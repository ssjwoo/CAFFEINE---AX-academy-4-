from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os
import logging
from typing import Dict, Any
from datetime import datetime

# 로깅 설정
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.WARNING)  # WARNING 이상만 표시

router = APIRouter(
    prefix="/ml",
    tags=["machine-learning"],
    responses={404: {"description": "Not found"}},
)

# 모델 전역 변수
model = None

def load_model():
    """
    XGBoost 모델 로드 (model_xgboost_acc_73.47.joblib)
    
    모델 위치: 10_backend/app/model_xgboost_acc_73.47.joblib
    정확도: 73.47%
    """
    global model
    try:
        # 모델 파일 경로: /10_backend/app/model_xgboost_acc_73.47.joblib
        # 현재 파일: /10_backend/app/routers/ml.py
        app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # /10_backend/app
        model_path = os.path.join(app_dir, "model_xgboost_acc_73.47.joblib")
        
        if not os.path.exists(model_path):
            logger.error(f"Model not found: {model_path}")
            return

        model = joblib.load(model_path)
        logger.info(f"✅ XGBoost 모델 로드 완료: {os.path.basename(model_path)}")
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")

# 앱 시작 시 모델 로드 (main.py에서 호출 예정)

class PredictionRequest(BaseModel):
    features: Dict[str, Any]

@router.post("/predict")
async def predict(request: PredictionRequest):
    global model
    if model is None:
        load_model()
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # 단일 예측 요청 처리
        # 입력된 딕셔너리를 DataFrame으로 변환
        input_data = pd.DataFrame([request.features])
        
        # 전처리 수행
        preprocessor = get_preprocessor()
        
        # 날짜/시간 필수 컬럼 확인 및 임시 생성 (단일 예측 시)
        if '날짜' not in input_data.columns:
            input_data['날짜'] = datetime.now().strftime('%Y-%m-%d')
        if '시간' not in input_data.columns:
            input_data['시간'] = datetime.now().strftime('%H:%M')
            
        df_processed = preprocessor.preprocess(input_data)
        
        # 예측 수행
        prediction = model.predict(df_processed)
        
        # 결과 반환
        result = prediction[0].item() if hasattr(prediction[0], 'item') else prediction[0]
        
        # 실제 메타데이터에 있는 클래스 매핑 사용권장
        # 여기서는 하드코딩된 맵 대신 메타데이터를 읽거나 유지
        category_map = {
            0: '교통', 1: '생활', 2: '쇼핑', 
            3: '식료품', 4: '외식', 5: '주유'
        }
        
        prediction_idx = int(result)
        prediction_str = category_map.get(prediction_idx, '기타')
            
        return {"prediction": prediction_str}

    except Exception as e:
        logger.error(f"Prediction Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Prediction Error: {str(e)}")

from fastapi import UploadFile, File
import io
from app.services.preprocessing import get_preprocessor

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    CSV 파일을 업로드하고 ML 모델로 예측을 수행합니다.
    
    처리 과정:
    1. CSV 파일 읽기 (인코딩 자동 감지)
    2. 데이터 전처리 (정제, 인코딩, Feature 조정)
    3. ML 예측 수행 (각 거래별 카테고리 예측)
    4. 원본 데이터 + 예측 결과 반환
    
    Args:
        file: 업로드된 CSV 파일
        
    Returns:
        {
            "filename": 파일명,
            "total_rows": 전체 행 수,
            "columns": 컬럼 목록,
            "preview": 상위 5개 행 (원본 + 예측 결과),
            "predictions": 전체 예측 결과 (카테고리별 개수)
        }
    """
    global model
    
    try:
        # 1. CSV 파일 읽기
        content = await file.read()
        
        # 한글 인코딩 대응 (utf-8 시도 후 실패 시 cp949)
        try:
            df_original = pd.read_csv(io.BytesIO(content), encoding='utf-8')
        except UnicodeDecodeError:
            df_original = pd.read_csv(io.BytesIO(content), encoding='cp949')
        
        # 2. 데이터 전처리
        preprocessor = get_preprocessor()
        
        try:
            # 전처리 수행
            df_processed = preprocessor.preprocess(df_original)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"전처리 실패: {str(e)}")
        
        # 3. ML 예측 수행
        if model is None:
            load_model()
            if model is None:
                raise HTTPException(status_code=500, detail="모델이 로드되지 않았습니다.")
        
        # 예측 실행
        predictions = model.predict(df_processed)
        
        # 4. 카테고리 매핑 (모델 메타데이터 기준)
        category_map = {
            0: '교통',
            1: '생활',
            2: '쇼핑',
            3: '식료품',
            4: '외식',
            5: '주유'
        }
        
        # 예측 결과를 카테고리명으로 변환
        predicted_categories = [category_map.get(int(pred), '기타') for pred in predictions]
        
        # 원본 데이터에 예측 결과 추가
        df_result = df_original.copy()
        df_result['AI예측카테고리'] = predicted_categories
        
        # 5. 프론트엔드 형식으로 변환
        transactions_formatted = []
        for idx, row in df_result.iterrows():
            # 금액을 절댓값으로 변환 (양수)
            amount = abs(int(row.get('금액', 0))) if pd.notna(row.get('금액')) else 0

            # 날짜 + 시간 조합
            date_str = str(row.get('날짜', '')).strip()
            time_str = str(row.get('시간', '')).strip()
            datetime_str = f"{date_str} {time_str}".strip()

            # 카드 타입 결정
            payment_method = str(row.get('결제수단', ''))
            card_type = '체크' if '체크' in payment_method else '신용'

            # 거래 객체 생성
            transaction = {
                "id": str(idx + 1),
                "merchant": str(row.get('내용', '알 수 없음')),
                "businessName": str(row.get('내용', '알 수 없음')),
                "amount": amount,
                "category": row.get('AI예측카테고리', '기타'),
                "date": datetime_str,
                "notes": str(row.get('메모', '')) if pd.notna(row.get('메모')) else '',
                "cardType": card_type,
                "originalCategory": str(row.get('대분류', '')) if pd.notna(row.get('대분류')) else '',
                "aiPredicted": True
            }
            transactions_formatted.append(transaction)

        # 카테고리별 예측 개수 집계
        prediction_summary = df_result['AI예측카테고리'].value_counts().to_dict()

        # 6. 결과 반환
        return {
            "filename": file.filename,
            "total_rows": len(df_original),
            "transactions": transactions_formatted,  # 전체 거래 내역
            "summary": {
                "by_category": prediction_summary,
                "total": len(predictions)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(status_code=400, detail=f"파일 처리 실패: {str(e)}")

import numpy as np

def calculate_confidence_metrics(probabilities: np.ndarray) -> dict:
    """
    예측 신뢰도 계산

    Args:
        probabilities: 모델의 확률 예측 결과 (6개 카테고리에 대한 확률 배열)

    Returns:
        신뢰도 메트릭을 포함한 딕셔너리
    """
    top1_prob = np.max(probabilities)
    sorted_probs = np.sort(probabilities)[::-1]
    top2_gap = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) > 1 else 1.0

    # Entropy calculation (낮을수록 확신도 높음)
    entropy = -np.sum(probabilities * np.log(probabilities + 1e-10))

    return {
        "top1_confidence": float(top1_prob),
        "top2_gap": float(top2_gap),
        "entropy": float(entropy),
        "confidence_level": "high" if top1_prob > 0.7 else "medium" if top1_prob > 0.4 else "low"
    }

@router.post("/predict-next")
async def predict_next_category(file: UploadFile = File(...)):
    """
    거래 이력을 기반으로 다음 소비 카테고리를 예측합니다

    처리 과정:
    1. CSV 전체를 읽어 사용자 통계 계산
    2. 가장 최근 거래를 컨텍스트로 추출
    3. 가상의 "다음 거래" 피처 생성
    4. 신뢰도 점수와 함께 예측

    Args:
        file: 업로드된 CSV 파일 (10개 컬럼 표준 포맷)

    Returns:
        {
            "predicted_category": "외식",
            "predicted_category_code": 4,
            "confidence": 0.78,
            "probabilities": {"교통": 0.05, "외식": 0.78, ...},
            "context": {
                "total_transactions": 150,
                "last_transaction_date": "2025-12-05 18:30",
                "last_category": "쇼핑",
                "user_avg_amount": 25000
            }
        }
    """
    global model

    try:
        # 1. CSV 파일 읽기
        content = await file.read()

        # 한글 인코딩 대응 (utf-8 시도 후 실패 시 cp949)
        try:
            df_original = pd.read_csv(io.BytesIO(content), encoding='utf-8')
        except UnicodeDecodeError:
            df_original = pd.read_csv(io.BytesIO(content), encoding='cp949')

        # CSV 로드 완료

        # 2. 예외 처리: 빈 CSV
        if len(df_original) == 0:
            raise HTTPException(status_code=400, detail="CSV 파일에 거래 데이터가 없습니다.")

        # 3. 필수 컬럼 확인
        required_cols = ['날짜', '시간', '금액', '대분류']
        missing_cols = [col for col in required_cols if col not in df_original.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"필수 컬럼이 없습니다: {', '.join(missing_cols)}"
            )

        # 4. 예외 처리: 단일 거래
        if len(df_original) == 1:
            category_map = {
                0: '교통', 1: '생활', 2: '쇼핑',
                3: '식료품', 4: '외식', 5: '주유'
            }
            return {
                "predicted_category": "외식",
                "predicted_category_code": 4,
                "confidence": 0.17,
                "probabilities": {cat: 1/6 for cat in category_map.values()},
                "context": {
                    "total_transactions": 1,
                    "note": "단일 거래로 예측 정확도가 낮습니다."
                }
            }

        # 5. 데이터 전처리
        preprocessor = get_preprocessor()

        # 6. 다음 거래 예측을 위한 피처 생성
        df_next_features = preprocessor.preprocess_for_next_prediction(df_original)
        # 피처 생성 완료

        # 7. ML 예측 수행
        if model is None:
            load_model()
            if model is None:
                raise HTTPException(status_code=500, detail="모델이 로드되지 않았습니다.")

        # 예측 실행 (확률 포함)
        prediction_proba = model.predict_proba(df_next_features)
        prediction = model.predict(df_next_features)

        # 예측 완료

        # 8. 카테고리 매핑
        category_map = {
            0: '교통', 1: '생활', 2: '쇼핑',
            3: '식료품', 4: '외식', 5: '주유'
        }

        predicted_category_code = int(prediction[0])
        predicted_category = category_map.get(predicted_category_code, '기타')

        # 9. 확률 딕셔너리 생성
        probabilities_dict = {
            category_map[i]: float(prediction_proba[0][i])
            for i in range(len(prediction_proba[0]))
        }

        # 10. 신뢰도 메트릭 계산
        confidence_metrics = calculate_confidence_metrics(prediction_proba[0])

        # 11. 컨텍스트 정보 생성
        # df_original에서 통계 추출
        preprocessor_temp = get_preprocessor()
        df_clean = preprocessor_temp._clean_data(df_original.copy())

        last_transaction = df_clean.iloc[-1]
        user_avg_amount = df_clean['Amount'].mean()

        # 가장 빈번한 카테고리 찾기
        category_map_reverse = {
            '교통': 0, '생활': 1, '쇼핑': 2, '식료품': 3, '외식': 4, '주유': 5,
            '식비': 4, '카페': 4, '간식': 3, '마트': 3, '편의점': 3,
            '카페/간식': 4  # 추가
        }
        df_clean['category_encoded'] = df_clean['대분류'].map(category_map_reverse).fillna(6)
        most_frequent_category_code = df_clean['category_encoded'].mode()[0] if len(df_clean) > 0 else 4
        most_frequent_category = category_map.get(int(most_frequent_category_code), '외식')

        last_category_code = category_map_reverse.get(last_transaction.get('대분류', '외식'), 4)
        last_category = category_map.get(int(last_category_code), '외식')

        context = {
            "total_transactions": len(df_original),
            "last_transaction_date": last_transaction['CreateDate'].strftime('%Y-%m-%d %H:%M'),
            "last_category": last_category,
            "user_avg_amount": float(user_avg_amount),
            "most_frequent_category": most_frequent_category
        }

        # 12. 최종 결과 반환
        return {
            "predicted_category": predicted_category,
            "predicted_category_code": predicted_category_code,
            "confidence": confidence_metrics["top1_confidence"],
            "probabilities": probabilities_dict,
            "context": context,
            "confidence_metrics": confidence_metrics
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Next prediction failed: {e}")
        raise HTTPException(status_code=400, detail=f"다음 소비 예측 실패: {str(e)}")
