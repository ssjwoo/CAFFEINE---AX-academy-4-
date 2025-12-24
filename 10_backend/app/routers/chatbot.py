from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, List
import os
import httpx
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.model.transaction import Transaction, Category
from app.db.model.user import User

router = APIRouter(
    prefix="/chat",
    tags=["chatbot"],
    responses={404: {"description": "Not found"}},
)

class ChatMessage(BaseModel):
    message: str
    naggingLevel: str
    type: Optional[str] = "chat"
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    reply: str
    mood: Optional[str] = "neutral"


def get_alarm_persona(level: str, spending_context: str = "") -> str:
    """거래 추가 시 알람용 독설가 AI 페르소나"""
    return f"""
You are sending a short Korean text message about this purchase. Do NOT explain or introduce yourself. Just write the message directly.

# Tone by Amount
- **5,000원 이하**: Very gentle. Example: "꼭 필요한 것만 산거 맞지?","잘하자","아껴쓰자"
- **5,000-15,000원**: Friendly concern. Example: "이것도 아껴야해","이 돈이면 넷플릭스가 한 달"
- **15,000-30,000원**: Light sarcasm. Example: "다음달엔 라면만 먹게?"
- **30,000-50,000원**: Strong sarcasm. Example: "월급날이야?","생일이야?","혹시 내가 모르는 사이에 연봉 협상 다시 했니?"
- **50,000원 이상**: Maximum roast. Example: "빌 게이츠야?,"기부천사","미쳤어?"

# Rules
- Korean only (반말)
- Mention amount and item
- 3 or 4 sentences
- Sound like a real text from a friend

{spending_context}
"""


def get_chatbot_persona(spending_context: str = "") -> str:
    """대화형 챗봇용 소비 상담 AI 페르소나"""
    return f"""
Role: 사용자의 소비를 분석하고 개선 팁을 제공하는 친절한 재무 상담 AI
Tone: 친근하고 공감적이며, 실질적인 조언 제공,반말로 대답

Instruction:
1. 사용자의 소비 패턴을 분석하여 구체적으로 피드백
2. 다음 소비를 어떻게 잘 할 수 있는지 실용적인 팁을 제공
3. 예산 관리, 절약 방법, 스마트한 소비 전략을 제안
4. 이모지를 사용하지 말 것 (NO emojis)

[사용자의 실제 소비내역]
{spending_context}
"""



async def get_user_spending_context(db: AsyncSession, user_id: int) -> str:
    """Get user spending summary for LLM context"""
    try:
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Stats query
        stats_query = select(
            func.count(Transaction.id).label("count"),
            func.sum(Transaction.amount).label("total"),
            func.avg(Transaction.amount).label("avg")
        ).where(
            Transaction.user_id == user_id,
            Transaction.transaction_time >= thirty_days_ago
        )
        stats_result = await db.execute(stats_query)
        stats = stats_result.fetchone()
        
        total_count = stats.count or 0
        total_amount = float(stats.total) if stats.total else 0
        avg_amount = float(stats.avg) if stats.avg else 0
        
        # Category query
        category_query = select(
            Category.name,
            func.sum(Transaction.amount).label("total")
        ).join(
            Transaction, Transaction.category_id == Category.id
        ).where(
            Transaction.user_id == user_id,
            Transaction.transaction_time >= thirty_days_ago
        ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).limit(5)
        
        cat_result = await db.execute(category_query)
        categories = cat_result.fetchall()
        
        cat_lines = [f"  - {c.name}: {int(c.total):,}원" for c in categories]
        category_text = "\n".join(cat_lines) if categories else "  (데이터 없음)"
        
        # Recent transactions
        recent_query = select(Transaction).options(
            selectinload(Transaction.category)
        ).where(
            Transaction.user_id == user_id
        ).order_by(Transaction.transaction_time.desc()).limit(5)
        
        recent_result = await db.execute(recent_query)
        recent_txs = recent_result.scalars().all()
        
        tx_lines = [
            f"  - {tx.merchant_name or '알수없음'}: {int(tx.amount):,}원 ({tx.category.name if tx.category else '기타'})"
            for tx in recent_txs
        ]
        recent_text = "\n".join(tx_lines) if recent_txs else "  (데이터 없음)"

        # 다음 예상 소비 카테고리 (ML 기반)
        predicted_category = categories[0].name if categories else "기타"

        context = f"""
[사용자 소비내역 - 최근 30일]
- 총 지출: {int(total_amount):,}원
- 거래 건수: {total_count}건
- 평균 거래액: {int(avg_amount):,}원

[카테고리별 TOP 5]
{category_text}

[최근 거래 5건]
{recent_text}

[AI 예측 - 다음 소비]
- 예상 카테고리: {predicted_category}
"""
        return context
        
    except Exception as e:
        print(f"Spending context error: {e}")
        return "(소비내역 조회 실패)"


async def call_llm_api(message: str, level: str, spending_context: str = "", is_alarm: bool = False) -> str:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="API Key missing")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    # 타입에 따른 페르소나 선택
    if is_alarm:
        system_instruction = get_alarm_persona(level, spending_context)
        # 알림용: 거래 정보 포함 + 직접 응답 유도
        text_content = f"{system_instruction}\n\n거래정보: {message}"
    else:
        system_instruction = get_chatbot_persona(spending_context)
        # 챗봇용: 대화형 형식 유지
        text_content = f"{system_instruction}\n\n사용자: {message}\n답변:"

    payload = {
        "contents": [{
            "parts": [{"text": text_content}]
        }]
    }


    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15.0)
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail=f"LLM Error: {response.status_code}")
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="LLM Service Unavailable")


async def get_optional_user(db: AsyncSession, request: Request) -> Optional[User]:
    try:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return None
        token = auth.split(" ")[1]
        from app.core.jwt import verify_access_token
        from app.db.crud import user as user_crud
        payload = verify_access_token(token)
        user_id = int(payload.get("sub"))
        return await user_crud.get_user_by_id(db, user_id)
    except:
        return None


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatMessage, db: AsyncSession = Depends(get_db), http_request: Request = None):
    try:
        user = await get_optional_user(db, http_request)
        if request.type == "alarm":
            # 알림(잔소리)인 경우 통계 컨텍스트 제외 (현재 거래에만 집중)
            spending_context = ""
            is_alarm = True
        elif user:
            spending_context = await get_user_spending_context(db, user.id)
            is_alarm = False
        else:
            spending_context = await get_user_spending_context(db, 1)  # 테스트용: 기본 user_id=1
            is_alarm = False
        
        reply = await call_llm_api(request.message, request.naggingLevel, spending_context, is_alarm)
        return {"reply": reply, "mood": "neutral"}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
