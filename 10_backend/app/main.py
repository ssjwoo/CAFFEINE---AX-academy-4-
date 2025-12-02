# 01_backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정 ----------------------------------------------------
# 개발 단계에서는 * 로 열어두고, 배포 후에는 도메인만 허용하는 게 좋음.
origins = [
    "http://localhost:5173",  # 04_app_front Vite dev 서버
    "http://localhost:5174",  # 05_admin_front Vite dev 서버 (포트는 팀에서 통일하기)
    "http://localhost",       # nginx 경유 접근 (로컬)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 필요하다면 ["*"] 로 개발 중 전체 허용해도 됨
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------------------------------------

# ---------------- DUMMY DATA!! 나중에 삭제 --------------------
dummy_users = [
    {"id": 1, "name": "홍길동", "email": "test1@example.com"},
    {"id": 2, "name": "김철수", "email": "test2@example.com"},
]

dummy_transactions = [
    {"id": 1, "user_id": 1, "category": "식비", "amount": 12000},
    {"id": 2, "user_id": 2, "category": "쇼핑", "amount": 50000},
]
# -------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/users")
def get_users():
    # 🚨 DUMMY DATA!! 나중에 DB 연동되면 교체
    return dummy_users


@app.get("/transactions")
def get_transactions():
    # 🚨 DUMMY DATA!! 나중에 DB 연동되면 교체
    return dummy_transactions
