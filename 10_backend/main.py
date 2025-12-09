import uvicorn
from fastapi import FastAPI
from app.core.settings import settings
from app.routers.user import router as user_router
from app.services.db_init import ensure_database_and_tables

app = FastAPI(title="Auth Service", version="1.0.0")

# 라우터 등록
app.include_router(user_router)


@app.on_event("startup")
async def startup_event():
    """API 기동 시 DB/테이블 자동 생성"""
    await ensure_database_and_tables()


@app.get("/")
async def root():
    return {"message": "Auth Service is running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.app_port, reload=True)
