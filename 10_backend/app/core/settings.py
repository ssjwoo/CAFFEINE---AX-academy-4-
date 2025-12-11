from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path

# 설정 파일 경로
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    # ==========================================================
    # Database 설정 (Primary: AWS RDS, Fallback: Local PostgreSQL)
    # ==========================================================
    # 2025-12-11: AWS RDS 우선, 연결 실패 시 로컬 DB 폴백
    
    # AWS RDS 설정 (Primary)
    db_user: str = Field("postgres", alias="DB_USER")
    db_password: str = Field("caffeineapprds", alias="DB_PASSWORD")
    db_host: str = Field("caffeine-database.c58og6ke6t36.ap-northeast-2.rds.amazonaws.com", alias="DB_HOST")
    db_port: str = Field("5432", alias="DB_PORT")
    db_name: str = Field("postgres", alias="DB_NAME")
    
    # 로컬 DB 설정 (Fallback) - Docker 또는 로컬 PostgreSQL
    local_db_host: str = Field("localhost", alias="LOCAL_DB_HOST")
    local_db_port: str = Field("5432", alias="LOCAL_DB_PORT")
    local_db_name: str = Field("caffeine_db", alias="LOCAL_DB_NAME")
    local_db_user: str = Field("postgres", alias="LOCAL_DB_USER")
    local_db_password: str = Field("caffeineapprds", alias="LOCAL_DB_PASSWORD")

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
        """Primary DB URL (AWS RDS)"""
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def local_database_url(self) -> str:
        """Fallback DB URL (Local PostgreSQL)"""
        return f"postgresql+asyncpg://{self.local_db_user}:{self.local_db_password}@{self.local_db_host}:{self.local_db_port}/{self.local_db_name}"

    @property
    def backend_url(self) -> str:
        return f"http://{self.app_host}:{self.app_port}"


settings = Settings()
