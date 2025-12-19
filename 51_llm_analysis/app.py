"""
Gemini 기반 소비 분석 / 절약 가이드 LLM 서비스
2025-12-11: Google Gemini API 연동
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import google.generativeai as genai
import os
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Caffeine 소비 분석 AI",
    description="Google Gemini 기반 소비 패턴 분석 및 절약 가이드 서비스",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDQ4GpW4Vs6eyYvqFi_GNevT5v9Bx50zhM")
genai.configure(api_key=GEMINI_API_KEY)

# Gemini 모델 초기화
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    logger.info("✅ Gemini 모델 초기화 성공")
except Exception as e:
    logger.error(f"❌ Gemini 모델 초기화 실패: {e}")
    model = None


# ============================================================
# 요청/응답 모델
# ============================================================

class SpendingData(BaseModel):
    """소비 데이터"""
    total_amount: float  # 총 소비액
    category_breakdown: List[dict]  # 카테고리별 소비 [{"category": "식비", "amount": 500000, "percentage": 30}]
    monthly_trend: Optional[List[dict]] = None  # 월별 추이
    top_merchants: Optional[List[str]] = None  # 자주 가는 가맹점


class AnalysisRequest(BaseModel):
    """분석 요청"""
    spending_data: SpendingData
    user_question: Optional[str] = None  # 사용자 질문 (선택)


class ChatRequest(BaseModel):
    """채팅 요청"""
    message: str
    spending_context: Optional[SpendingData] = None


class AnalysisResponse(BaseModel):
    """분석 응답"""
    summary: str  # 요약
    insights: List[str]  # 인사이트
    saving_tips: List[str]  # 절약 팁
    warning: Optional[str] = None  # 경고 (과소비 등)


# ============================================================
# 프롬프트 템플릿
# ============================================================

ANALYSIS_PROMPT = """
당신은 전문 가계부 분석가이자 절약 컨설턴트입니다.
다음 소비 데이터를 분석하고 친절하게 조언해주세요.

## 소비 데이터
- 총 소비액: {total_amount:,}원
- 카테고리별 소비:
{category_breakdown}

{monthly_trend}
{top_merchants}

## 요청사항
1. 소비 패턴을 간단히 요약해주세요 (2-3문장)
2. 주요 인사이트 3개를 알려주세요
3. 구체적인 절약 팁 3개를 제안해주세요
4. 과소비가 의심되면 부드럽게 경고해주세요

응답은 한국어로, 친근하고 격려하는 톤으로 해주세요.
JSON 형식이 아닌 자연스러운 문장으로 답변해주세요.
"""

CHAT_PROMPT = """
당신은 친절한 가계부 비서 "카페인"입니다.
사용자의 소비 관련 질문에 도움을 드립니다.

{context}

사용자 질문: {message}

친근하고 도움이 되는 답변을 해주세요. 답변은 한국어로 해주세요.
"""


# ============================================================
# API 엔드포인트
# ============================================================

@app.get("/")
def health_check():
    """헬스 체크"""
    return {
        "status": "ok",
        "service": "Caffeine 소비 분석 AI",
        "model": "gemini-2.0-flash",
        "model_loaded": model is not None
    }


@app.post("/analyze")
async def analyze_spending(request: AnalysisRequest):
    """소비 데이터 분석"""
    if model is None:
        raise HTTPException(status_code=503, detail="Gemini 모델이 초기화되지 않았습니다")
    
    try:
        # 카테고리 데이터 포맷팅
        category_text = "\n".join([
            f"  - {item.get('category', '기타')}: {item.get('amount', 0):,}원 ({item.get('percentage', 0):.1f}%)"
            for item in request.spending_data.category_breakdown
        ])
        
        # 월별 추이 (있으면)
        monthly_text = ""
        if request.spending_data.monthly_trend:
            monthly_text = "\n- 월별 추이:\n" + "\n".join([
                f"  - {item.get('month', '?')}: {item.get('amount', 0):,}원"
                for item in request.spending_data.monthly_trend
            ])
        
        # 자주 가는 가맹점 (있으면)
        merchants_text = ""
        if request.spending_data.top_merchants:
            merchants_text = f"\n- 자주 가는 곳: {', '.join(request.spending_data.top_merchants)}"
        
        # 프롬프트 생성
        prompt = ANALYSIS_PROMPT.format(
            total_amount=request.spending_data.total_amount,
            category_breakdown=category_text,
            monthly_trend=monthly_text,
            top_merchants=merchants_text
        )
        
        # 사용자 추가 질문이 있으면 포함
        if request.user_question:
            prompt += f"\n\n추가 질문: {request.user_question}"
        
        # Gemini API 호출
        response = model.generate_content(prompt)
        
        logger.info("✅ Gemini 분석 완료")
        
        return {
            "status": "success",
            "analysis": response.text,
            "model": "gemini-2.0-flash"
        }
        
    except Exception as e:
        logger.error(f"❌ 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"분석 중 오류 발생: {str(e)}")


@app.post("/chat")
async def chat_with_assistant(request: ChatRequest):
    """채팅형 질의응답"""
    if model is None:
        raise HTTPException(status_code=503, detail="Gemini 모델이 초기화되지 않았습니다")
    
    try:
        # 소비 컨텍스트 생성
        context = ""
        if request.spending_context:
            context = f"""
사용자의 소비 정보:
- 총 소비: {request.spending_context.total_amount:,}원
- 주요 카테고리: {', '.join([item.get('category', '') for item in request.spending_context.category_breakdown[:3]])}
"""
        
        prompt = CHAT_PROMPT.format(
            context=context,
            message=request.message
        )
        
        response = model.generate_content(prompt)
        
        return {
            "status": "success",
            "reply": response.text,
            "model": "gemini-2.0-flash"
        }
        
    except Exception as e:
        logger.error(f"❌ 채팅 실패: {e}")
        raise HTTPException(status_code=500, detail=f"채팅 중 오류 발생: {str(e)}")


@app.post("/saving-tips")
async def get_saving_tips(category: str = "전체"):
    """카테고리별 절약 팁"""
    if model is None:
        raise HTTPException(status_code=503, detail="Gemini 모델이 초기화되지 않았습니다")
    
    try:
        prompt = f"""
'{category}' 카테고리에서 돈을 절약하는 실용적인 팁 5개를 알려주세요.
한국의 상황에 맞는 구체적이고 실천 가능한 조언을 해주세요.
각 팁은 1-2문장으로 간결하게 작성해주세요.
"""
        
        response = model.generate_content(prompt)
        
        return {
            "status": "success",
            "category": category,
            "tips": response.text,
            "model": "gemini-2.0-flash"
        }
        
    except Exception as e:
        logger.error(f"❌ 팁 생성 실패: {e}")