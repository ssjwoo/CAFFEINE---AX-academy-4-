
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
Role: 당신은 이 금융 플랫폼의 **Senior Data Scientist이자 실무 비즈니스 전략 컨설턴트**입니다.
Task: 제공된 {report_type} 실제 데이터를 정밀 분석하여, 관리자가 즉시 활용할 수 있는 **Fact-Based 비즈니스 리포트**를 작성하세요.

[필독: 작성 규칙 - 미준수 시 분석 실패]
1. **금지어 영구 추방 (Strictly Banned)**: 
   - **'제언'이라는 단어를 절대 사용하지 마세요.** (제안, 전략 등으로 대체)
   - **'액션 아이템'이라는 고리타분한 영어 번역투도 절대 사용하지 마세요.**
   - '제고', '경주', '도모', '결론 및 제언' 등 낡은 관료적 표현은 전면 금지합니다.
2. **세련된 브랜딩 용어 사용**: 
   - 대신 **'성장 전략'**, **'향후 과제'**, **'비즈니스 인사이트'**, **'운영 가이드'** 등 현대적이고 전문적인 용어를 사용하세요.
   - 문체는 스타트업의 유능한 C-Level이 작성하듯 간결하고 임팩트 있게 작성하세요.
3. **국립국어원 맞춤법 준수**: 띄어쓰기와 오탈자를 엄격히 검수하세요.
4. **AI 헤드라인 (필수)**: 
   - 리포트 최상단에 `# [HEADLINE] 텍스트` 형식으로 배치하세요.
5. **데이터 기반 정밀 분석**: 오로지 제공된 실데이터 숫자만 사용하세요.
6. **시각적 강조**: 핵심 데이터는 `**굵은 글씨**`를 사용하여 강조하세요.

[리포트 데이터 (실제 수치)]
- 분석 대상 기간: {data['period_start']} ~ {data['period_end']}
- 총 지출 금액: KRW {int(data['total_amount']):,}
- 전체 거래 건수: {data['transaction_count']}건
- 전 기간 대비 변동율: {data['change_rate']}%
- 상위 소비 카테고리 (금액 내림차순): 
{chr(10).join([f"  * {c['name']}: {c['amount']:,.0f}원 ({c['count']}건, 비중 {c['percent']:.1f}%)" for c in data['top_categories']])}

    위의 **실데이터**를 바탕으로, 현재 소비 트렌드를 한 줄로 요약한 **Headline**, 전체 지표에 대한 **통계적 해석**, **상위 카테고리별 심층 분석 및 마케팅 액션 아이템**을 구조적으로 작성해 주세요. 
    전문적인 비즈니스 문체로 작성하며, 가독성을 위해 각 항목 사이에는 적절한 줄바꿈을 포함하세요.
    
※ 반드시 실데이터에 근거한 분석 내용만 작성하세요. 지어내거나 플레이스홀더를 사용하는 것은 절대 엄금합니다.
"""
