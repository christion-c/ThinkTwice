"""Settings read from environment variables (see services/ml/.env.example)."""

from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

LogLevel = Literal["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"]


class Settings(BaseSettings):
    """The forecasting service's settings, validated at startup so bad configuration fails fast."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", frozen=True)

    # Shared secret the API sends with every request. Generate with: openssl rand -hex 32
    ml_service_token: SecretStr = Field(min_length=32)
    log_level: LogLevel = "INFO"
