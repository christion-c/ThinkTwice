"""Creates the FastAPI app. Run with: uv run uvicorn thinktwice_ml.main:create_app --factory."""

import logging

from fastapi import FastAPI

from thinktwice_ml.config import Settings
from thinktwice_ml.routes import build_router


def create_app(settings: Settings | None = None) -> FastAPI:
    """Builds the app from settings (read from the environment unless given, as in tests)."""
    resolved = settings if settings is not None else Settings()
    logging.basicConfig(
        level=resolved.log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    # Internal service: no interactive docs or published schema to give attackers a map.
    app = FastAPI(title="ThinkTwice ML", docs_url=None, redoc_url=None, openapi_url=None)
    app.include_router(build_router(resolved.ml_service_token))
    return app
