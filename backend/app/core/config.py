from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "QMS Platform API"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    postgres_server: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "qms_platform"
    postgres_user: str = "qms_user"
    postgres_password: str = "change_me"

    database_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()