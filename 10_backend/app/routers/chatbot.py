from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import os
import httpx

router = APIRouter(
    prefix="/api/chat",
    tags=["chatbot"],
    responses={404: {"description": "Not found"}},
)

class ChatMessage(BaseModel):
    message: str
    naggingLevel: str  # '상', '중', '하'
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    reply: str
    mood: Optional[str] = "neutral"

# ==========================================
# Real LLM Service Logic (Google Gemini)
# ==========================================
async def call_llm_api(message: str, level: str) -> str:
    """
    Calls Google Gemini API via HTTP requests.
    Strictly fails if API Key is missing or call fails.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("Error: GEMINI_API_KEY is missing.")
        raise HTTPException(status_code=500, detail="Server Configuration Error: API Key missing")
    
    # Gemini API Endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }

    # Prompt Engineering based on Nagging Level
    system_instruction = f"""
    당신은 사용자의 소비 습관을 지적하는 '절약 잔소리 꾼'입니다.
    잔소리 강도는 '{level}'입니다.
    
    [강도 가이드]
    - 상: 매우 강하게 비난하고, 당장 지출을 멈추라고 소리칩니다. 반말을 사용하세요. (예: "야! 너 미쳤어?", "당장 그 손 떼!")
    - 중: 논리적으로 왜 이 소비가 잘못되었는지 설명하고, 대안을 제시합니다. 존댓말과 반말을 섞어 씁니다.
    - 하: 부드럽게 회유하고, 절약하면 좋을 점을 이야기합니다. 친절한 존댓말을 사용하세요.
    
    사용자의 말에 대해 위 강도에 맞춰 짧고 굵게(한 문장 또는 두 문장) 답변하세요.
    """

    payload = {
        "contents": [{
            "parts": [{"text": f"{system_instruction}\n\n사용자: {message}\n답변:"}]
        }]
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            
            if response.status_code != 200:
                print(f"Gemini API Error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=502, detail=f"LLM Provider Error: {response.status_code}")
                
            data = response.json()
            # Extract text from Gemini response structure
            try:
                reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return reply_text
            except (KeyError, IndexError) as e:
                print(f"Response Parsing Error: {data}")
                raise HTTPException(status_code=502, detail="Invalid response format from LLM")
                
        except httpx.RequestError as e:
            print(f"Request Error: {e}")
            raise HTTPException(status_code=503, detail="LLM Service Unavailable")

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatMessage):
    """
    Chatbot endpoint. 
    STRICT MODE: Only calls Real LLM. No Mocks allowed.
    """
    try:
        reply = await call_llm_api(request.message, request.naggingLevel)
        return {"reply": reply, "mood": "neutral"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error processing chat")
