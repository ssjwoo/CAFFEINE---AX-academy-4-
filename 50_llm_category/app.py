from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# ---- 더미데이터!! (나중에 실제 LLM 호출로 변경) ----
def dummy_llm_category(text: str) -> str:
    if "커피" in text:
        return "FOOD_BEVERAGE"
    elif "병원" in text:
        return "HEALTH"
    elif "마트" in text:
        return "GROCERY"
    else:
        return "OTHER"


class CategoryRequest(BaseModel):
    text: str


@app.post("/category")
def predict_category(payload: CategoryRequest):
    # TODO: 외부 LLM API(GPT/Gemini/Claude) 연결
    category = dummy_llm_category(payload.text)  # 더미 로직
    return {"category": category}
