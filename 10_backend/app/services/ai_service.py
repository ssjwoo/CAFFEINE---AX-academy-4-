
import os
import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def call_gemini_api(prompt: str) -> str:
    """
    Google Gemini API를 호출하여 텍스트 응답을 생성합니다.
    (chatbot.py의 로직을 기반으로 재작성)
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY is missing")
        return "AI 분석을 사용할 수 없습니다 (API Key 누락)."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url, 
                json=payload, 
                headers={"Content-Type": "application/json"}, 
                timeout=15.0
            )
            
            if response.status_code != 200:
                logger.error(f"Gemini API Error: {response.status_code} - {response.text}")
                return "AI 분석을 가져오는 중 오류가 발생했습니다."
                
            data = response.json()
            # 안전하게 응답 추출
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                logger.error(f"Gemini Response parsing error: {e}")
                return "AI 응답을 처리할 수 없습니다."
                
        except httpx.RequestError as e:
            logger.error(f"Gemini API Request Error: {e}")
            return "AI 서비스 연결 실패."

def generate_report_prompt(report_type: str, data: Dict[str, Any]) -> str:
    """
    리포트 데이터를 바탕으로 AI 프롬프트를 생성합니다.
    """
    categories_text = "\n".join([
        f"- {cat['name']}: {int(cat['amount']):,}원" 
        for cat in data.get("top_categories", [])
    ])

    return f"""
Role: 당신은 이 금융 플랫폼의 **관리자(Administrator)**이자 **데이터 분석가**입니다.
Task: 플랫폼 전체의 {report_type} 소비 트렌드를 분석하여, 관리자에게 **마케팅 전략**이나 **비즈니스 인사이트**를 제안해 주세요.
Input: 아래 통계는 특정 개인이 아니라, 플랫폼 내에서 발생한 **전체 거래 데이터 요약**입니다.

[통계 데이터]
- 기간: {data.get('period_start')} ~ {data.get('period_end')}
- 총 거래액: {int(data.get('total_amount', 0)):,}원
- 총 거래 건수: {data.get('transaction_count', 0)}건
- 전기간 대비 증감률: {data.get('change_rate', 0)}%
- 상위 소비 카테고리 (인기 항목):
{categories_text}

[작성 가이드]
1. 리포트의 맨 첫 줄에 **"Headline: [한 줄 요약]"**을 반드시 작성하세요. (예: "Headline: 식비 지출이 전월 대비 20% 증가했습니다.")
2. 그 다음 줄부터 본문을 작성하되, **"어떤 카테고리가 인기 있으니 어떤 마케팅을 하면 좋겠다"**는 식의 관리자 관점 조언을 작성하세요.
3. 예시: "식비와 외식 카테고리 거래가 급증했습니다. 주말 외식 쿠폰 프로모션을 진행하여 트래픽을 더 확보하는 전략이 유효해 보입니다."
4. 가독성을 위해 **번호 매기기(1. 2. 3.)** 형식을 반드시 사용하고, **핵심 키워드는 굵게(`**키워드**`) 표시**하세요.
5. **키워드 뒤에는 줄바꿈**이 들어가도록 의도해 주세요 (프론트엔드에서 처리 예정).
6. 예시 포맷:
Headline: [헤드라인 내용]
1. **[전략 이름]:** [내용]
"""
