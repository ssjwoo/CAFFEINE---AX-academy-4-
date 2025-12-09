from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path

# 설정 파일 경로
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    # Database 설정 (PostgreSQL)
    # 2025-12-05: MySQL → PostgreSQL 전환
    # - db_user: root → user (docker-compose.yml의 POSTGRES_USER와 일치)
    # - db_password: 1234 → password (docker-compose.yml의 POSTGRES_PASSWORD와 일치)
    # - db_port: 3306 → 5432 (PostgreSQL 기본 포트)
    # - db_name: caffeine → caffeine_db (docker-compose.yml의 POSTGRES_DB와 일치)
    db_user: str = Field("user", alias="DB_USER")
    db_password: str = Field("password", alias="DB_PASSWORD")
    db_host: str = Field("localhost", alias="DB_HOST")
    db_port: str = Field("5432", alias="DB_PORT")
    db_name: str = Field("caffeine_db", alias="DB_NAME")

    # App 설정
    app_port: int = Field(8081, alias="APP_PORT")
    app_host: str = Field("localhost", alias="APP_HOST")

    # JWT 설정
    secret_key: str = Field("change-me-secret", alias="SECRET_KEY")
    algorithm: str = Field("HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    class Config:
        env_file = ENV_PATH
        extra = "allow"
        populate_by_name = True
        case_sensitive = True

    @property
    def database_url(self) -> str:
        # 2025-12-05: mysql+aiomysql → postgresql+asyncpg로 변경
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def backend_url(self) -> str:
        return f"http://{self.app_host}:{self.app_port}"


settings = Settings()
