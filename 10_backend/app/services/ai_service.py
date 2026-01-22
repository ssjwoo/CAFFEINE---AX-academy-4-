# -*- coding: utf-8 -*-
"""
AI 서비스 모듈 (Vertex AI 기반)

Google Vertex AI SDK를 사용하여 Gemini 모델을 호출합니다.
Google Search Grounding을 지원하며, 실패 시 기본 API로 fallback합니다.

인증 방식:
- Vertex AI: GCP 서비스 계정 (GOOGLE_APPLICATION_CREDENTIALS)
- Fallback: Gemini API Key (GEMINI_API_KEY)
"""

import os
import logging
import asyncio
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# =============================================================================
# Vertex AI 초기화
# =============================================================================

_vertex_ai_initialized = False

def _init_vertex_ai() -> bool:
    """
    Vertex AI SDK 초기화.
    GCP 프로젝트 ID와 리전이 필요합니다.
    """
    global _vertex_ai_initialized
    
    if _vertex_ai_initialized:
        return True
    
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        
        project_id = os.getenv("GCP_PROJECT_ID")
        location = os.getenv("GCP_LOCATION", "asia-northeast3")  # 서울 리전
        
        if not project_id:
            logger.warning("GCP_PROJECT_ID not set, Vertex AI unavailable")
            return False
        
        vertexai.init(project=project_id, location=location)
        _vertex_ai_initialized = True
        logger.info(f"Vertex AI initialized: project={project_id}, location={location}")
        return True
        
    except ImportError:
        logger.warning("vertexai package not installed")
        return False
    except Exception as e:
        logger.error(f"Vertex AI initialization failed: {e}")
        return False


# =============================================================================
# Vertex AI로 Gemini 호출 (Google Search Grounding 지원)
# =============================================================================

async def call_vertex_ai_with_grounding(prompt: str) -> Optional[str]:
    """
    Vertex AI SDK를 사용하여 Gemini 모델 호출.
    Google Search Grounding을 적용하여 최신 정보를 반영합니다.
    
    Args:
        prompt: 프롬프트 텍스트
        
    Returns:
        AI 응답 텍스트 또는 None (실패 시)
    """
    if not _init_vertex_ai():
        return None
    
    try:
        from vertexai.generative_models import GenerativeModel, Tool
        from vertexai.preview.generative_models import grounding
        
        # Gemini 모델 초기화
        model = GenerativeModel("gemini-1.5-flash")
        
        # Google Search Grounding 도구 설정
        google_search_tool = Tool.from_google_search_retrieval(
            grounding.GoogleSearchRetrieval()
        )
        
        logger.info("Calling Vertex AI with Google Search Grounding...")
        
        # 비동기 실행을 위해 스레드풀 사용
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                prompt,
                tools=[google_search_tool],
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 2048,
                }
            )
        )
        
        result = response.text
        logger.info("Vertex AI Grounding response received successfully")
        return result
        
    except Exception as e:
        logger.error(f"Vertex AI call failed: {e}")
        return None


async def call_vertex_ai_basic(prompt: str) -> Optional[str]:
    """
    Vertex AI SDK를 사용한 기본 Gemini 호출 (Grounding 없음).
    
    Args:
        prompt: 프롬프트 텍스트
        
    Returns:
        AI 응답 텍스트 또는 None (실패 시)
    """
    if not _init_vertex_ai():
        return None
    
    try:
        from vertexai.generative_models import GenerativeModel
        
        model = GenerativeModel("gemini-1.5-flash")
        
        logger.info("Calling Vertex AI (basic, no grounding)...")
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 2048,
                }
            )
        )
        
        result = response.text
        logger.info("Vertex AI basic response received")
        return result
        
    except Exception as e:
        logger.error(f"Vertex AI basic call failed: {e}")
        return None


# =============================================================================
# Fallback: Gemini API Key 방식 (REST API)
# =============================================================================

async def _call_gemini_api_rest(prompt: str, use_grounding: bool = False) -> Optional[str]:
    """
    REST API를 사용한 Gemini 호출 (API Key 방식).
    Vertex AI 실패 시 fallback으로 사용.
    
    Args:
        prompt: 프롬프트 텍스트
        use_grounding: Google Search Grounding 사용 여부
        
    Returns:
        AI 응답 텍스트 또는 None (실패 시)
    """
    import httpx
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set")
        return None
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    if use_grounding:
        payload["tools"] = [{"google_search": {}}]
    
    async with httpx.AsyncClient() as client:
        try:
            timeout = 20.0 if use_grounding else 15.0
            response = await client.post(
                url, 
                json=payload, 
                headers={"Content-Type": "application/json"}, 
                timeout=timeout
            )
            
            if response.status_code != 200:
                logger.warning(f"Gemini REST API error: {response.status_code}")
                return None
            
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
            
        except Exception as e:
            logger.error(f"Gemini REST API failed: {e}")
            return None


# =============================================================================
# 통합 API: Vertex AI 우선, REST API Fallback
# =============================================================================

async def call_gemini_api(prompt: str) -> str:
    """
    Gemini API 통합 호출 함수.
    
    호출 순서 (Fallback Chain):
    1. Vertex AI + Google Search Grounding
    2. Vertex AI (Grounding 없음)
    3. REST API + Google Search Grounding  
    4. REST API (Grounding 없음)
    5. 에러 메시지 반환
    
    Args:
        prompt: 프롬프트 텍스트
        
    Returns:
        AI 응답 텍스트
    """
    # 1단계: Vertex AI + Grounding 시도
    result = await call_vertex_ai_with_grounding(prompt)
    if result:
        return result
    
    logger.info("Vertex AI Grounding failed, trying Vertex AI basic...")
    
    # 2단계: Vertex AI (Grounding 없음) 시도
    result = await call_vertex_ai_basic(prompt)
    if result:
        return result
    
    logger.info("Vertex AI failed, falling back to REST API...")
    
    # 3단계: REST API + Grounding 시도
    result = await _call_gemini_api_rest(prompt, use_grounding=True)
    if result:
        return result
    
    # 4단계: REST API (Grounding 없음) 시도
    result = await _call_gemini_api_rest(prompt, use_grounding=False)
    if result:
        return result
    
    # 5단계: 모든 방법 실패
    logger.error("All AI service methods failed")
    return "AI 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요."


# Legacy alias for backward compatibility
async def call_gemini_api_with_grounding(prompt: str) -> str:
    """Legacy alias - use call_gemini_api instead"""
    return await call_gemini_api(prompt)


# =============================================================================
# 리포트 프롬프트 생성
# =============================================================================

def generate_report_prompt(report_type: str, data: Dict[str, Any]) -> str:
    """
    CEO/C-Level 대상의 프리미엄 전략 보고서 생성을 위한 AI 프롬프트.
    YAML 설정 파일에서 프롬프트 템플릿을 로드합니다.
    """
    from app.config import get_report_prompt
    
    # YAML에서 기본 프롬프트 로드
    base_prompt = get_report_prompt("strategic_report")
    if not base_prompt:
        # Fallback: YAML 로드 실패 시 기본 프롬프트
        base_prompt = """Role: Senior Strategic Consultant & BI Developer
당신은 데이터의 비즈니스 가치를 극대화하는 전략 컨설턴트입니다.
제공된 데이터를 분석하여 Executive Summary, Consumer Insight, Partnership Strategy를 작성하십시오."""
    
    # 동적 데이터 삽입
    categories_text = "\n".join([
        f"- {cat['name']}: {int(cat['amount']):,}원 ({cat['percent']:.1f}%)" 
        for cat in data.get("top_categories", [])
    ])

    max_tx_text = "N/A"
    if data.get('max_transaction'):
        max_tx = data['max_transaction']
        max_tx_text = f"{max_tx['merchant_name']} ({int(max_tx['amount']):,}원) - {max_tx['category']} 분야"

    # 데이터 컨텍스트 추가
    data_context = f"""
[분석 데이터 (Fact)]
- 기간: {data['period_start']} ~ {data['period_end']}
- 총 지출: {int(data['total_amount']):,}원 (전기 대비 {data['change_rate']}%)
- 상위 카테고리:
{categories_text}
- 최대 지출 트랜잭션: {max_tx_text}

"""
    
    return base_prompt + "\n\n" + data_context
