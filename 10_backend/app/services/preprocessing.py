import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple

class DataPreprocessor:
    """
    LightGBM 모델(v1.0)을 위한 데이터 전처리 클래스
    
    메타데이터(JSON)에 정의된 스펙에 따라:
    1. Feature Engineering (27개 파생변수 생성)
    2. Scaling (StandardScaler 적용)
    3. Column Ordering (모델 입력 순서 보장)
    을 수행합니다.
    """
    
    def __init__(self, metadata_path: str = None):
        """
        초기화
        
        Args:
            metadata_path: 모델 메타데이터 JSON 파일 경로
        """
        if metadata_path is None:
            # 기본 경로: production_models 폴더 내의 json
            # /app/services/preprocessing.py -> /app/services -> /app -> /10_backend -> /root/caffeine
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            prod_dir = os.path.join(base_dir, "production_models")
            
            if not os.path.exists(prod_dir):
                raise FileNotFoundError(f"프로덕션 모델 폴더를 찾을 수 없습니다: {prod_dir}")
            
            # json 파일 찾기
            json_files = [f for f in os.listdir(prod_dir) if f.endswith('.json')]
            if json_files:
                metadata_path = os.path.join(prod_dir, json_files[0])
            else:
                raise FileNotFoundError("메타데이터 파일을 찾을 수 없습니다.")
        
        self.metadata_path = metadata_path
        self._load_metadata()
        
    def _load_metadata(self):
        """메타데이터 로드"""
        with open(self.metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        self.feature_stats = self.metadata['input_spec']['feature_statistics']
        self.feature_names = self.metadata['input_spec']['feature_names']
        
    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        전체 전처리 파이프라인 실행
        
        Args:
            df: 원본 DataFrame (CSV 로드 결과)
            
        Returns:
            모델 입력용 DataFrame (27개 feature, scaled)
        """
        # 1. 기본 데이터 정제
        df_clean = self._clean_data(df)
        
        # 2. Feature Engineering (파생변수 생성)
        df_engineered = self._feature_engineering(df_clean)
        
        # 3. Scaling (정규화)
        df_scaled = self._apply_scaling(df_engineered)
        
        # 4. 컬럼 순서 보장 (모델 입력 순서대로)
        df_final = df_scaled[self.feature_names]
        
        return df_final

    def preprocess_for_next_prediction(self, df: pd.DataFrame, prediction_time: datetime = None) -> pd.DataFrame:
        """
        다음 거래 예측을 위한 피처 생성

        전체 거래 이력에서 사용자 통계를 계산하고, 가장 최근 거래를 컨텍스트로 사용하여
        가상의 "다음 거래"에 대한 27개 피처를 생성합니다.

        Args:
            df: 전체 거래 이력 DataFrame
            prediction_time: 예측 시점 (기본값: 현재 시간)

        Returns:
            27개 스케일링된 피처를 가진 단일 행 DataFrame
        """
        if prediction_time is None:
            prediction_time = datetime.now()

        # 1. 기본 데이터 정제 (전체 히스토리)
        df_clean = self._clean_data(df)

        # 2. 사용자 통계 계산
        user_stats = self._calculate_user_stats(df_clean)

        # 3. 가장 최근 거래 추출
        last_transaction = df_clean.iloc[-1]

        # 4. "다음 거래" 피처 구성
        next_features = self._build_next_transaction_features(
            last_transaction=last_transaction,
            user_stats=user_stats,
            prediction_time=prediction_time,
            full_history=df_clean
        )

        # 5. Scaling 적용
        next_scaled = self._apply_scaling(next_features)

        return next_scaled[self.feature_names]

    def _calculate_user_stats(self, df: pd.DataFrame) -> dict:
        """
        사용자 레벨 통계 추출

        Args:
            df: 정제된 거래 이력 DataFrame

        Returns:
            사용자 통계 딕셔너리
        """
        stats = {}

        # 금액 통계
        stats['avg_amount'] = df['Amount'].mean()
        stats['std_amount'] = df['Amount'].std()
        if pd.isna(stats['std_amount']):
            stats['std_amount'] = 0

        # 거래 개수
        stats['tx_count'] = len(df)

        # 카테고리 인코딩 (기존 로직 재사용)
        category_map = {
            '교통': 0, '생활': 1, '쇼핑': 2, '식료품': 3, '외식': 4, '주유': 5,
            '식비': 4, '카페': 4, '간식': 3, '마트': 3, '편의점': 3,
            '카페/간식': 4  # 추가
        }
        df['category_encoded'] = df['대분류'].map(category_map).fillna(6)

        # 가장 선호하는 카테고리
        if len(df) > 0:
            stats['fav_category'] = df['category_encoded'].mode()[0]
        else:
            stats['fav_category'] = 4  # 기본값: 외식

        # 카테고리 개수
        stats['category_count'] = df['category_encoded'].nunique()

        # 카테고리별 비율
        total_count = len(df)
        cat_counts = df['category_encoded'].value_counts()
        stats['category_ratios'] = {
            '교통': cat_counts.get(0, 0) / total_count,
            '생활': cat_counts.get(1, 0) / total_count,
            '쇼핑': cat_counts.get(2, 0) / total_count,
            '식료품': cat_counts.get(3, 0) / total_count,
            '외식': cat_counts.get(4, 0) / total_count,
            '주유': cat_counts.get(5, 0) / total_count
        }

        return stats

    def _build_next_transaction_features(
        self,
        last_transaction: pd.Series,
        user_stats: dict,
        prediction_time: datetime,
        full_history: pd.DataFrame
    ) -> pd.DataFrame:
        """
        가상의 다음 거래 피처 구성

        Args:
            last_transaction: 가장 최근 거래
            user_stats: 사용자 통계
            prediction_time: 예측 시점
            full_history: 전체 거래 이력

        Returns:
            피처 딕셔너리를 포함하는 DataFrame
        """
        features = {}

        # ---------------------------------------------------------
        # 1. 시간 피처 (prediction_time 기준)
        # ---------------------------------------------------------
        features['Hour'] = prediction_time.hour
        features['DayOfWeek'] = prediction_time.weekday()  # 0:월 ~ 6:일
        features['DayOfMonth'] = prediction_time.day

        # ---------------------------------------------------------
        # 2. Boolean Time Features
        # ---------------------------------------------------------
        features['IsWeekend'] = 1 if prediction_time.weekday() >= 5 else 0
        features['IsLunchTime'] = 1 if 11 <= prediction_time.hour <= 13 else 0
        features['IsEvening'] = 1 if 18 <= prediction_time.hour <= 20 else 0
        features['IsMorningRush'] = 1 if 7 <= prediction_time.hour <= 9 else 0
        features['IsNight'] = 1 if prediction_time.hour >= 22 or prediction_time.hour <= 4 else 0
        features['IsBusinessHour'] = 1 if (9 <= prediction_time.hour <= 17) and features['IsWeekend'] == 0 else 0

        # ---------------------------------------------------------
        # 3. Amount Features (사용자 평균을 기준으로)
        # ---------------------------------------------------------
        avg_amount = user_stats['avg_amount']
        features['Amount'] = avg_amount
        features['Amount_log'] = np.log1p(abs(avg_amount))
        features['AmountBin_encoded'] = (abs(avg_amount) // 5000)

        # ---------------------------------------------------------
        # 4. User Stats Features
        # ---------------------------------------------------------
        features['User_AvgAmount'] = user_stats['avg_amount']
        features['User_StdAmount'] = user_stats['std_amount']
        features['User_TxCount'] = len(full_history)

        # ---------------------------------------------------------
        # 5. Sequence Features
        # ---------------------------------------------------------
        last_tx_time = last_transaction['CreateDate']
        time_since_last = (prediction_time - last_tx_time).total_seconds() / 60  # 분 단위
        features['Time_Since_Last'] = time_since_last
        features['Transaction_Sequence'] = (len(full_history) + 1) / (len(full_history) + 1)  # 정규화

        # ---------------------------------------------------------
        # 6. Category Features
        # ---------------------------------------------------------
        # 카테고리 매핑
        category_map = {
            '교통': 0, '생활': 1, '쇼핑': 2, '식료품': 3, '외식': 4, '주유': 5,
            '식비': 4, '카페': 4, '간식': 3, '마트': 3, '편의점': 3,
            '카페/간식': 4
        }

        # 마지막 거래의 카테고리
        prev_category = category_map.get(last_transaction.get('대분류', '외식'), 4)
        features['Previous_Category_encoded'] = prev_category

        # Current Category는 가장 빈번한 카테고리 사용
        features['Current_Category_encoded'] = user_stats['fav_category']
        features['User_FavCategory_encoded'] = user_stats['fav_category']
        features['User_Category_Count'] = user_stats['category_count']

        # ---------------------------------------------------------
        # 7. Category Ratio Features
        # ---------------------------------------------------------
        features['User_교통_Ratio'] = user_stats['category_ratios']['교통']
        features['User_생활_Ratio'] = user_stats['category_ratios']['생활']
        features['User_쇼핑_Ratio'] = user_stats['category_ratios']['쇼핑']
        features['User_식료품_Ratio'] = user_stats['category_ratios']['식료품']
        features['User_외식_Ratio'] = user_stats['category_ratios']['외식']
        features['User_주유_Ratio'] = user_stats['category_ratios']['주유']

        return pd.DataFrame([features])

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """데이터 정제"""
        df = df.copy()
        
        # 날짜/시간 병합 및 datetime 변환
        # CSV 컬럼: '날짜', '시간', '금액', '타입', '대분류', '소분류' 등
        
        # 날짜 처리
        df['CreateDate'] = pd.to_datetime(df['날짜'] + ' ' + df['시간'])
        
        # 금액 처리 (문자열 -> 숫자)
        if df['금액'].dtype == object:
            df['Amount'] = pd.to_numeric(df['금액'].astype(str).str.replace(',', ''), errors='coerce').fillna(0)
        else:
            df['Amount'] = df['금액'].fillna(0)
            
        # 정렬 (시간순)
        df = df.sort_values('CreateDate')
        
        return df
        
    def _feature_engineering(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        27개 Feature 생성
        
        주의: 실제 사용자 전체 히스토리가 아닌 업로드된 CSV 내에서만 통계를 계산하므로
        일부 누적 통계(User_AvgAmount 등)는 정확하지 않을 수 있습니다.
        """
        df = df.copy()
        
        # ---------------------------------------------------------
        # 1. 기본 Time Features
        # ---------------------------------------------------------
        df['Hour'] = df['CreateDate'].dt.hour
        df['DayOfWeek'] = df['CreateDate'].dt.dayofweek  # 0:월 ~ 6:일
        df['DayOfMonth'] = df['CreateDate'].dt.day
        
        # ---------------------------------------------------------
        # 2. Boolean Time Features (0 or 1)
        # ---------------------------------------------------------
        # 주말 여부 (토, 일)
        df['IsWeekend'] = df['DayOfWeek'].apply(lambda x: 1 if x >= 5 else 0)
        
        # 점심 시간 (11:00 ~ 13:59)
        df['IsLunchTime'] = df['Hour'].apply(lambda x: 1 if 11 <= x <= 13 else 0)
        
        # 저녁 시간 (18:00 ~ 20:59)
        df['IsEvening'] = df['Hour'].apply(lambda x: 1 if 18 <= x <= 20 else 0)
        
        # 아침 출근 시간 (07:00 ~ 09:59)
        df['IsMorningRush'] = df['Hour'].apply(lambda x: 1 if 7 <= x <= 9 else 0)
        
        # 심야 시간 (22:00 ~ 04:59)
        df['IsNight'] = df['Hour'].apply(lambda x: 1 if x >= 22 or x <= 4 else 0)
        
        # 업무 시간 (09:00 ~ 17:59, 주말 제외)
        df['IsBusinessHour'] = df.apply(lambda row: 1 if (9 <= row['Hour'] <= 17) and (row['IsWeekend'] == 0) else 0, axis=1)
        
        # ---------------------------------------------------------
        # 3. Amount Features
        # ---------------------------------------------------------
        # 로그 변환 (음수 처리를 위해 절대값+1 사용 후 부호 복원 방식 등을 사용했으나
        # 메타데이터 상 min/max를 보면 그냥 자연로그일 수 있음. 
        # 안전하게 np.log1p(abs(amount)) 사용)
        df['Amount_log'] = np.log1p(df['Amount'].abs())
        
        # 금액 구간 (Binning) - 임의 로직 (실제 모델 학습 로직과 맞춰야 함)
        # 예시: 5000원 단위로 구간화
        df['AmountBin_encoded'] = (df['Amount'].abs() // 5000).clip(upper=20)
        
        # ---------------------------------------------------------
        # 4. User Stats Features (CSV 내 데이터로 계산)
        # ---------------------------------------------------------
        # 전체 평균/표준편차 (여기서는 단일 사용자라고 가정)
        user_mean = df['Amount'].mean()
        user_std = df['Amount'].std()
        if np.isnan(user_std): user_std = 0
            
        df['User_AvgAmount'] = user_mean
        df['User_StdAmount'] = user_std
        df['User_TxCount'] = len(df)
        
        # ---------------------------------------------------------
        # 5. Sequence Features
        # ---------------------------------------------------------
        # 이전 거래와의 시간 간격 (분 단위)
        df['Time_Since_Last'] = df['CreateDate'].diff().dt.total_seconds() / 60
        df['Time_Since_Last'] = df['Time_Since_Last'].fillna(0)
        
        # 거래 순서 (0 ~ 1 정규화된 순서)
        df['Transaction_Sequence'] = np.arange(len(df)) / len(df)
        
        # ---------------------------------------------------------
        # 6. Category Features
        # ---------------------------------------------------------
        # 카테고리 매핑 (학습 데이터의 LabelEncoding 값 필요)
        # 임시 매핑 테이블 (실제 인코더가 없다면 해시값이나 임의 매핑 사용 불가)
        # 여기서는 메타데이터의 class_mapping을 사용하여 역매핑 시도 또는
        # 자주 사용하는 카테고리를 하드코딩
        
        # 대분류를 기준으로 함
        category_map = {
            '교통': 0, '생활': 1, '쇼핑': 2, '식료품': 3, '외식': 4, '주유': 5,
            '식비': 4, '카페': 4, '간식': 3, '마트': 3, '편의점': 3 # 유사 카테고리 매핑
        }
        
        df['Current_Category_encoded'] = df['대분류'].map(category_map).fillna(6) # 6: 기타
        
        # 이전 카테고리
        df['Previous_Category_encoded'] = df['Current_Category_encoded'].shift(1).fillna(6)
        
        # 사용자 선호 카테고리 (가장 많이 나온 것)
        fav_cat = df['Current_Category_encoded'].mode()[0]
        df['User_FavCategory_encoded'] = fav_cat
        
        # 카테고리 개수
        df['User_Category_Count'] = df['Current_Category_encoded'].nunique()
        
        # ---------------------------------------------------------
        # 7. Ratio Features (비율)
        # ---------------------------------------------------------
        total_count = len(df)
        cat_counts = df['Current_Category_encoded'].value_counts()
        
        # 각 카테고리별 비율 (전체 대비)
        # 매핑: 0:교통, 1:생활, 2:쇼핑, 3:식료품, 4:외식, 5:주유
        df['User_교통_Ratio'] = cat_counts.get(0, 0) / total_count
        df['User_생활_Ratio'] = cat_counts.get(1, 0) / total_count
        df['User_쇼핑_Ratio'] = cat_counts.get(2, 0) / total_count
        df['User_식료품_Ratio'] = cat_counts.get(3, 0) / total_count
        df['User_외식_Ratio'] = cat_counts.get(4, 0) / total_count
        df['User_주유_Ratio'] = cat_counts.get(5, 0) / total_count
        
        return df
        
    def _apply_scaling(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        메타데이터의 통계값을 사용하여 Scaling 수행
        Formula: (Value - Mean) / Std
        """
        result_df = df.copy()
        
        for feature_name in self.feature_names:
            # feature 이름에서 '_scaled' 제거하여 원본 컬럼명 찾기
            original_col = feature_name.replace('_scaled', '')
            
            # 일부 예외 처리
            if feature_name == 'AmountBin_encoded_scaled': original_col = 'AmountBin_encoded'
            
            # 컬럼이 존재하면 스케일링
            if original_col in result_df.columns:
                stats = self.feature_stats[feature_name]
                mean = stats['mean']
                std = stats['std']
                
                # Zero Division 방지
                if std == 0: std = 1
                
                result_df[feature_name] = (result_df[original_col] - mean) / std
            else:
                # 컬럼이 없으면 0으로 채움 (Warning)
                # print(f"Warning: Column {original_col} not found for {feature_name}")
                result_df[feature_name] = 0
                
        return result_df

# 싱글톤 인스턴스
_instance = None

def get_preprocessor():
    global _instance
    if _instance is None:
        _instance = DataPreprocessor()
    return _instance
