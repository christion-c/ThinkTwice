"""Only the ThinkTwice API may call the forecasting service."""

import hmac
from typing import TYPE_CHECKING

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from pydantic import SecretStr

_bearer_scheme = HTTPBearer(auto_error=False)


def service_token_guard(expected_token: SecretStr) -> Callable[[Request], Awaitable[None]]:
    """Builds a FastAPI dependency that rejects any request without the shared service token."""
    expected = expected_token.get_secret_value().encode()

    async def require_service_token(request: Request) -> None:
        """Raises 401 unless the request carries the shared service token."""
        credentials: HTTPAuthorizationCredentials | None = await _bearer_scheme(request)
        # compare_digest takes the same time however much matches, so the token can't be guessed.
        if credentials is None or not hmac.compare_digest(
            credentials.credentials.encode(), expected
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return require_service_token
