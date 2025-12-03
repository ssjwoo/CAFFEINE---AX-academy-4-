from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI()

# ---- 더미데이터!! (LLM 요약 대신 임시 설명) ----
def dummy_analysis(text: str) -> str:
    return f"요약: {text[:30]} ... (이 텍스트는 더미 요약입니다)"

class AnalysisRequest(BaseModel):
    text: str


@app.post("/analysis")
def analyze_text(payload: AnalysisRequest):
    # TODO: 외부 LLM API로 변경
    summary = dummy_analysis(payload.text)
    return {"summary": summary}
