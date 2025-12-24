"""
Gemini 기반 소비 분석 / 절약 가이드 LLM 서비스
최적화 버전: 프롬프트 단축, 캐싱, 토큰 제한 적용
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import google.generativeai as genai
import os
import logging
import hashlib
import json
import time
from functools import lru_cache

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Caffeine 소비 분석 AI",
    description="Google Gemini 기반 소비 패턴 분석 및 절약 가이드 서비스 (최적화)",
    version="2.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 캐시 설정 (메모리 기반)
# ============================================================
response_cache: Dict[str, tuple] = {}  # {hash: (response, timestamp)}
CACHE_TTL = 300  # 5분 캐시

def get_cache_key(prompt: str) -> str:
    """프롬프트 해시 생성"""
    return hashlib.md5(prompt.encode()).hexdigest()

def get_cached_response(prompt: str) -> Optional[str]:
    """캐시된 응답 조회"""
    key = get_cache_key(prompt)
    if key in response_cache:
        response, timestamp = response_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            logger.info("✅ 캐시 히트!")
            return response
        else:
            del response_cache[key]  # 만료된 캐시 삭제
    return None

def set_cached_response(prompt: str, response: str):
    """응답 캐시 저장"""
    key = get_cache_key(prompt)
    response_cache[key] = (response, time.time())
    # 캐시 크기 제한 (최대 100개)
    if len(response_cache) > 100:
        oldest_key = min(response_cache, key=lambda k: response_cache[k][1])
        del response_cache[oldest_key]

# ============================================================
# Gemini API 설정
# ============================================================
# docker-compose에서 GEMINI_API_KEY로 전달됨 (.env의 gemini_key에서)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_key", "")
if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY가 설정되지 않았습니다!")
else:
    logger.info(f"✅ API Key 로드됨: {GEMINI_API_KEY[:10]}...")
genai.configure(api_key=GEMINI_API_KEY)

# 모델 초기화 (최적화: max_output_tokens 제한)
try:
    generation_config = {
        "max_output_tokens": 200,  # 매운맛 답변을 위해 토큰 증가
        "temperature": 0.9,        # 더 재미있는 답변
    }
    model = genai.GenerativeModel(
        'gemini-2.0-flash-exp',
        generation_config=generation_config
    )
    logger.info("✅ Gemini 모델 초기화 성공 (gemini-2.0-flash-exp, max_tokens=200)")
except Exception as e:
    logger.error(f"❌ Gemini 모델 초기화 실패: {e}")
    model = None


# ============================================================
# 프롬프트 (매운맛 AI + 거래 내역 상세)
# ============================================================

def get_transaction_prompt(merchant: str, amount: int, category: str, 
                          budget_pct: float, category_count: int, category_spent: int, status: str) -> str:
    """거래 평가용 매운맛 프롬프트"""
    return f"""당신은 '잠깐만AI', 팩트폭행 재무 트레이너야.

[방금 거래]
- {merchant}에서 {amount:,}원 씀
- 카테고리: {category} (이번 달 {category_count}번째, 총 {category_spent:,}원)
- 예산 {budget_pct:.0f}% 사용, 상태: {status}

[규칙]
1. 반말로 3문장 이내
2. 이모지 절대 사용 금지
3. 과소비면 비꼬고 풍자, 잘했으면 격하게 칭찬
4. 구체적 숫자 언급

예시:
- 반복: "와 한달에 {merchant} {category_count}번이나 간다고? 너 덕분에 {merchant} 이번달 소고기 먹음"
- 과소비: "{category}에 {category_spent:,}원 쓰는 거 실화? 정신 못차리지?"
- 절약: "드디어 정신차렸구나! 잘하고 있어. 건물주 되면 나 잊지말고!"

바로 조언해:"""


def get_chat_prompt(message: str, budget_pct: float, remaining: int, 
                   tx_count: int, top_category: str, category_summary: str, recent_tx: str) -> str:
    """챗봇용 매운맛 프롬프트 (거래 내역 포함)"""
    return f"""당신은 '잠깐만AI', 팩트폭행하며 돈 아끼게 만드는 재무 트레이너야.

[사용자 재정 현황]
- 예산 사용: {budget_pct:.0f}% (남은 돈: {remaining:,}원)
- 이번 달 거래: {tx_count}회

[카테고리별 지출]
{category_summary if category_summary else "아직 거래 없음"}

[최근 거래]
{recent_tx if recent_tx else "없음"}

[규칙]
1. 반말로 3문장 이내
2. 이모지 절대 사용 금지
3. 구체적 숫자와 거래 내역 언급해서 답변
4. 비꼬고 풍자하되 도움되게

[사용자 질문]
{message}

바로 답변해:"""



# ============================================================
# API 엔드포인트
# ============================================================

@app.get("/")
def health_check():
    """헬스 체크"""
    return {
        "status": "ok",
        "service": "Caffeine 소비 분석 AI (최적화)",
        "model": "gemini-2.0-flash-exp",
        "model_loaded": model is not None,
        "cache_size": len(response_cache)
    }


@app.post("/evaluate")
async def evaluate_transaction(request: dict):
    """통합 AI 엔드포인트 - 거래 평가 및 챗봇 대화 (최적화)"""
    if model is None:
        raise HTTPException(status_code=503, detail="Gemini 모델이 초기화되지 않았습니다")
    
    start_time = time.time()
    
    try:
        transaction = request.get("transaction", {})
        message = request.get("message", "")
        budget = request.get("budget", 1000000)
        spending_history = request.get("spending_history", {})
        
        # 디버깅: 받은 데이터 로깅
        logger.info(f"📊 받은 데이터 - 예산: {budget:,}원, 지출: {spending_history.get('total', 0):,}원, 거래수: {spending_history.get('transaction_count', 0)}회")
        logger.info(f"📊 카테고리: {list(spending_history.get('category_breakdown', {}).keys())[:3]}")
        logger.info(f"📊 최근거래: {spending_history.get('recent_transactions', '없음')[:50]}...")
        
        total_spent = spending_history.get("total", 0)
        budget_percentage = (total_spent / budget * 100) if budget > 0 else 0
        remaining_budget = max(0, budget - total_spent)
        
        # 재정 상태 판단
        if budget_percentage > 100:
            status = "파산직전"
        elif budget_percentage > 80:
            status = "위험"
        elif budget_percentage > 50:
            status = "보통"
        else:
            status = "여유"
        
        # 거래 평가인 경우
        if transaction and transaction.get("merchant_name"):
            merchant = transaction.get("merchant_name", "?")
            amount = transaction.get("amount", 0)
            category = transaction.get("category", "기타")
            category_count = spending_history.get("category_count", 1)
            category_spent = spending_history.get("category_total", 0)
            
            prompt = get_transaction_prompt(
                merchant, amount, category, 
                budget_percentage, category_count, category_spent, status
            )
            req_type = "transaction"
            logger.info(f"📝 거래 평가: {merchant} {amount:,}원")
        
        # 일반 대화인 경우
        elif message:
            tx_count = spending_history.get("transaction_count", 0)
            category_breakdown = spending_history.get("category_breakdown", {})
            recent_transactions = spending_history.get("recent_transactions", "")
            
            # TOP 카테고리 추출
            top_category = "없음"
            category_summary = ""
            if category_breakdown:
                # 카테고리별 요약 생성
                sorted_cats = sorted(category_breakdown.items(), 
                                    key=lambda x: x[1].get('total', 0), reverse=True)[:3]
                category_summary = "\n".join([
                    f"- {cat}: {info.get('count', 0)}회, {info.get('total', 0):,}원" 
                    for cat, info in sorted_cats
                ])
                if sorted_cats:
                    top_cat = sorted_cats[0]
                    top_category = f"{top_cat[0]}({top_cat[1].get('count', 0)}회)"
            
            prompt = get_chat_prompt(
                message, budget_percentage, remaining_budget, 
                tx_count, top_category, category_summary, recent_transactions
            )
            req_type = "chat"
            logger.info(f"💬 챗봇 대화: {message[:20]}...")
        
        else:
            raise HTTPException(status_code=400, detail="transaction 또는 message 필수")
        
        # 캐시 확인
        cached = get_cached_response(prompt)
        if cached:
            elapsed = time.time() - start_time
            return {
                "status": "success",
                "message": cached,
                "model": "gemini-2.0-flash-exp",
                "type": req_type,
                "cached": True,
                "elapsed_ms": int(elapsed * 1000)
            }
        
        # Gemini API 호출
        response = model.generate_content(prompt)
        result = response.text.strip()
        
        # 캐시 저장
        set_cached_response(prompt, result)
        
        elapsed = time.time() - start_time
        logger.info(f"⚡ 응답 완료: {int(elapsed * 1000)}ms")
        
        return {
            "status": "success",
            "message": result,
            "model": "gemini-2.0-flash-exp",
            "type": req_type,
            "cached": False,
            "elapsed_ms": int(elapsed * 1000)
        }
        
    except Exception as e:
        logger.error(f"❌ AI 처리 실패: {e}")
        raise HTTPException(status_code=500, detail=f"처리 중 오류 발생: {str(e)}")


@app.post("/evaluate/stream")
async def evaluate_stream(request: dict):
    """스트리밍 응답 (UX 개선)"""
    if model is None:
        raise HTTPException(status_code=503, detail="Gemini 모델이 초기화되지 않았습니다")
    
    try:
        message = request.get("message", "")
        budget = request.get("budget", 1000000)
        spending_history = request.get("spending_history", {})
        
        total_spent = spending_history.get("total", 0)
        budget_percentage = (total_spent / budget * 100) if budget > 0 else 0
        remaining_budget = max(0, budget - total_spent)
        tx_count = spending_history.get("transaction_count", 0)
        
        prompt = get_chat_prompt(message, budget_percentage, remaining_budget, tx_count, "")
        
        async def generate():
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
        
    except Exception as e:
        logger.error(f"스트리밍 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cache/stats")
def cache_stats():
    """캐시 통계"""
    return {
        "cache_size": len(response_cache),
        "cache_keys": list(response_cache.keys())[:10],  # 최근 10개만
        "ttl_seconds": CACHE_TTL
    }


@app.delete("/cache/clear")
def clear_cache():
    """캐시 초기화"""
    response_cache.clear()
    return {"status": "ok", "message": "캐시가 초기화되었습니다"}
