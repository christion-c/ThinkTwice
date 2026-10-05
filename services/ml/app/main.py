# ThinkTwice ML service: FastAPI app setup and route registration.
# The actual logic lives in sibling modules so this file stays a short,
# readable index of "what endpoints exist and what they call":
#   models.py     Pydantic request/response shapes
#   dataset.py    synthetic reference dataset for /ml-preview's baseline
#   history.py    per-user fill-up history storage (backend-durable,
#                 with a local-file fallback)
#   prediction.py the actual prediction math for both /predict and /ml-preview

import hmac
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from .history import INTERNAL_SERVICE_TOKEN, load_user_history, save_user_history
from .models import PredictRequest, PredictResponse
from .prediction import (
    MIN_ENTRIES_FOR_REGRESSION,
    build_prediction,
    predict_by_average,
    predict_by_regression,
    recency_weighted_average,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not INTERNAL_SERVICE_TOKEN:
        print(
            "WARNING: INTERNAL_SERVICE_TOKEN is not set - /fill-up-history and "
            "/ml-preview will reject every request until it is configured.",
        )
    yield


logger = logging.getLogger("thinktwice.ml")

app = FastAPI(title="ThinkTwice ML Service", lifespan=lifespan)

# This service used to have no rate limiting at all - notable because
# its Cloud Run ingress is "all" (open to the public internet, see
# infra notes), relying entirely on require_internal_token below for
# protection. A per-client-IP cap adds a basic backstop against
# volumetric abuse independent of that check (which still costs a
# hash comparison per request even when it correctly rejects).
# Limits are generous relative to the backend's own real traffic
# pattern (one caller, occasional requests), not a tight quota.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    # Starlette's own default handler already returns a generic 500 with
    # no stack trace leaked to the client (debug mode is off), so this
    # isn't a safety fix - it's here so an unexpected failure is logged
    # somewhere structured/queryable instead of only appearing as
    # uvicorn's raw traceback output, and so the body matches the
    # backend's { "error": "..." } shape rather than differing between
    # the two services.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    # FastAPI's default handler for a malformed request body returns
    # Pydantic's own {"detail": [...]} shape, including internal field/
    # type names - reshaped here to match the {"error": "..."} convention
    # every other error response on this service (and the backend) uses,
    # rather than three different error shapes depending on which layer
    # rejected the request.
    first_error = exc.errors()[0] if exc.errors() else None
    message = first_error["msg"] if first_error else "Invalid request"
    return JSONResponse(status_code=422, content={"error": message})


@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


# Wide open: this service sits behind the backend and is not directly
# exposed to end users with sensitive credentials to protect.
# allow_credentials is deliberately left off (default False) - this
# service authenticates via the X-Internal-Token header, never cookies,
# so there's nothing credentialed to allow. With allow_origins=["*"],
# turning it on would make Starlette reflect the caller's literal
# Origin with Access-Control-Allow-Credentials: true instead of a
# simple wildcard - broader trust than this service needs.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    # Locks the debug-only endpoints below to callers holding the same
    # shared secret the backend already presents when it calls this
    # service (see require-internal-service.ts on the backend side).
    # Without this, /ml-preview accepted an arbitrary ?user_id= and
    # returned that user's real fill-up history and prediction to
    # anyone on the internet - a straightforward per-user data leak.
    # Fails closed (rejects every request) if INTERNAL_SERVICE_TOKEN
    # itself isn't configured, rather than treating a missing secret as
    # "no check needed."
    if (
        not INTERNAL_SERVICE_TOKEN
        or not x_internal_token
        or not hmac.compare_digest(x_internal_token, INTERNAL_SERVICE_TOKEN)
    ):
        raise HTTPException(status_code=401, detail="Missing or invalid internal service token")


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok"}


@app.post(
    "/predict",
    response_model=PredictResponse,
    response_model_by_alias=True,
    dependencies=[Depends(require_internal_token)],
)
@limiter.limit("30/minute")
def predict(request: Request, payload: PredictRequest) -> PredictResponse:
    # This is the endpoint the real app uses (called server-to-server by
    # the backend's /predictions route) - not to be confused with
    # /ml-preview below, which is a separate debug-only flow.
    # `request: Request` is required (and must be named exactly that) for
    # slowapi's @limiter.limit to find the caller's address - the actual
    # body param is named `payload` instead of the more obvious `request`
    # specifically to avoid colliding with it.
    if not payload.entries:
        raise HTTPException(
            status_code=422,
            detail="At least one budget entry is required.",
        )

    # Below the regression threshold, fall back to a plain average.
    if len(payload.entries) < MIN_ENTRIES_FOR_REGRESSION:
        return predict_by_average(payload.entries)

    return predict_by_regression(payload.entries)


@app.post("/fill-up-history", dependencies=[Depends(require_internal_token)])
@limiter.limit("30/minute")
def fill_up_history(request: Request, payload: dict[str, Any]) -> dict[str, Any]:
    # Backs the /ml-preview debug flow's own history writes (see history.py).
    return save_user_history(payload)


@app.get("/ml-preview", dependencies=[Depends(require_internal_token)])
@limiter.limit("30/minute")
def ml_preview(
    request: Request,
    miles_driven: int = 120,
    user_id: str | None = None,
    fuel_price: float | None = None,
    combined_mpg: float | None = None,
    tank_capacity: float | None = None,
    gallons: float | None = None,
) -> dict[str, Any]:
    # Debug-only preview endpoint, not called directly by the frontend -
    # it goes through the backend's authenticated GET /predictions/preview,
    # which forwards here with the internal token and the caller's own
    # verified user id (see predictions.client.ts on the backend side).
    return build_prediction(
        miles_driven=miles_driven,
        user_id=user_id,
        fuel_price=fuel_price,
        combined_mpg=combined_mpg,
        tank_capacity=tank_capacity,
        gallons=gallons,
    )


# Re-exported so existing imports (`from app.main import build_prediction,
# recency_weighted_average`, used by services/ml/tests/test_predict.py)
# keep working after this module split - these are read-only re-exports,
# not mutated anywhere, so a plain import binding is safe here. Contrast
# with HISTORY_PATH, which tests mutate directly and therefore import
# from app.history instead of via this re-export (see history.py and
# tests/test_main.py).
__all__ = [
    "app",
    "build_prediction",
    "load_user_history",
    "recency_weighted_average",
]
