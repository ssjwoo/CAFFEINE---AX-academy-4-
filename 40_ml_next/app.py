from fastapi import FastAPI
import os
from dotenv import load_dotenv
import logging
import joblib

load_dotenv()

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경 변수
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET = os.getenv("S3_BUCKET")
MODEL_KEY = os.getenv("MODEL_KEY")
LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", "/app/model.joblib")

model = None


def load_model_from_local():
    """로컬 파일에서 모델 로드"""
    try:
        if os.path.exists(LOCAL_MODEL_PATH):
            loaded_model = joblib.load(LOCAL_MODEL_PATH)
            logger.info(f"✅ 로컬 모델 로드 성공: {LOCAL_MODEL_PATH}")
            return loaded_model
        else:
            logger.warning(f"⚠️ 로컬 모델 파일 없음: {LOCAL_MODEL_PATH}")
            return None
    except Exception as e:
        logger.warning(f"⚠️ 로컬 모델 로드 실패: {e}")
        return None


def load_model_from_s3():
    """S3에서 모델 로드"""
    try:
        import boto3
        from io import BytesIO
        
        if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, MODEL_KEY]):
            raise ValueError("S3 환경 변수가 설정되지 않음")
        
        s3 = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        buffer = BytesIO()
        s3.download_fileobj(S3_BUCKET, MODEL_KEY, buffer)
        buffer.seek(0)
        loaded_model = joblib.load(buffer)
        logger.info("✅ S3 모델 로드 성공")
        return loaded_model
    except Exception as e:
        logger.warning(f"⚠️ S3 모델 로드 실패: {e}")
        return None


def load_model():
    """모델 로드 (S3 우선, 실패 시 로컬)"""
    global model
    
    # 1. S3에서 시도
    model = load_model_from_s3()
    
    # 2. S3 실패 시 로컬에서 시도
    if model is None:
        model = load_model_from_local()
    
    return model


# 시작 시 모델 로드
load_model()


@app.get("/")
def health():
    return {
        "status": "ok", 
        "model_loaded": model is not None,
        "model_source": "S3" if (AWS_ACCESS_KEY_ID and model) else ("Local" if model else "None")
    }


@app.get("/predict")
def predict(value: float):
    if model is None:
        return {"error": "모델이 로드되지 않음", "prediction": None}
    result = model.predict([[value]])
    return {"prediction": result[0]}


@app.post("/reload")
def reload_model():
    """모델 수동 재로드"""
    load_model()
    return {"status": "reloaded", "model_loaded": model is not None}
