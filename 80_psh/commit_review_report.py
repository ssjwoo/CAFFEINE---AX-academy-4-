"""커밋 코드 리뷰 보고서 v2.1 - 기능별 분류, FastAPI 중심"""
import streamlit as st
import pandas as pd
import os

st.set_page_config(page_title="커밋 코드 리뷰 보고서", layout="wide")

st.markdown("""<style>
.code-block { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; }
.reason-box { background: #e8f4fd; border-left: 4px solid #3498db; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; }
.how-box { background: #e8f8f5; border-left: 4px solid #27ae60; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; }
.folder-tree { background: #2d2d2d; color: #e0e0e0; padding: 1.5rem; border-radius: 10px; font-family: monospace; white-space: pre-wrap; line-height: 1.8; }
</style>""", unsafe_allow_html=True)

# 사이드바
st.sidebar.markdown("### 코드 리뷰 보고서")
st.sidebar.markdown("**작성자**: 15tkdgns")
st.sidebar.markdown("**기간**: 2025.12.04~12.12")
st.sidebar.markdown("---")

menu = st.sidebar.radio("메뉴", ["1. 전체 개요", "2. ML 예측 API", "3. 데이터 전처리", 
    "4. 프론트엔드 통합", "5. Docker 환경", "6. LLM 분석", "7. 프로젝트 구조"])

# 1. 전체 개요
if menu == "1. 전체 개요":
    st.markdown("# 커밋 코드 리뷰 보고서")
    st.markdown("**15tkdgns (박상혁) | 2025.12.04~12.12 | FastAPI 백엔드 중심**")
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    col1.metric("총 커밋", "8개")
    col2.metric("추가 라인", "+44,096")
    col3.metric("삭제 라인", "-51,309")
    
    st.markdown("---")
    st.subheader("구현한 주요 기능")
    features = [
        ("ML 예측 API", "XGBoost 모델 기반 소비 카테고리 예측. CSV 업로드, 단일 예측, 다음 소비 예측 3개 엔드포인트"),
        ("데이터 전처리", "원본 CSV를 27개 파생변수로 변환. 싱글톤 패턴으로 메모리 효율화"),
        ("프론트엔드 통합", "React Native에서 ML API 호출. 대시보드에 AI 인사이트 표시"),
        ("Docker 환경", "8개 서비스를 docker-compose로 통합"),
        ("LLM 분석", "Google Gemini API로 소비 패턴 분석 및 절약 조언")
    ]
    for t, d in features:
        st.markdown(f"**{t}**: {d}")

# 2. ML 예측 API
elif menu == "2. ML 예측 API":
    st.markdown("# ML 예측 API (FastAPI)")
    st.markdown("**파일**: `10_backend/app/routers/ml.py` (401줄)")
    st.markdown("---")
    
    st.subheader("왜 만들었는가 (Why)")
    st.markdown("""<div class="reason-box">
<b>목적</b>: 사용자가 CSV 파일을 업로드하면 AI가 각 거래의 소비 카테고리를 자동 예측<br><br>
<b>배경</b>: XGBoost 모델(정확도 73.47%)이 학습되어 있었고, 이를 API로 제공 필요
</div>""", unsafe_allow_html=True)
    
    st.markdown("---")
    st.subheader("API 엔드포인트")
    
    api_df = pd.DataFrame({
        "엔드포인트": ["/ml/predict", "/ml/upload", "/ml/predict-next"],
        "메서드": ["POST", "POST", "POST"],
        "Request": ["JSON {features: {날짜, 시간, 금액, 대분류...}}", 
                   "multipart/form-data (CSV 파일)",
                   "multipart/form-data (CSV 파일)"],
        "Response": ['{"prediction": "외식"}',
                    '{"transactions": [...], "summary": {"by_category": {...}}}',
                    '{"predicted_category": "외식", "confidence": 0.78, "probabilities": {...}}'],
        "용도": ["단일 거래 테스트", "대량 CSV 예측", "다음 소비 예측"]
    })
    st.dataframe(api_df, use_container_width=True)
    
    st.markdown("---")
    st.subheader("핵심 코드: 모델 로드")
    
    code1 = '''# 10_backend/app/routers/ml.py
from fastapi import APIRouter, HTTPException, UploadFile, File
import joblib  # sklearn 모델 직렬화 라이브러리
import os

router = APIRouter(prefix="/ml", tags=["machine-learning"])

# 전역 변수로 모델 저장 (앱 시작 시 한 번만 로드하여 재사용)
model = None

def load_model():
    """
    XGBoost 모델을 메모리에 로드하는 함수
    
    [작동 원리]
    1. 현재 파일 위치에서 app 디렉토리 경로 계산
    2. model_xgboost_acc_73.47.joblib 파일 경로 생성
    3. joblib.load()로 학습된 모델 객체를 메모리에 로드
    4. 전역 변수 model에 저장하여 모든 API 요청에서 재사용
    
    [왜 전역 변수인가]
    - 매 요청마다 모델을 로드하면 수십 MB 파일 읽기 + 역직렬화 오버헤드
    - 한 번 로드 후 재사용하면 예측은 밀리초 단위로 빠름
    """
    global model
    # __file__: 현재 파일의 절대 경로 (/app/routers/ml.py)
    # dirname 두 번 호출: routers -> app 디렉토리로 이동
    app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(app_dir, "model_xgboost_acc_73.47.joblib")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    # joblib.load: pickle보다 대용량 numpy 배열 처리에 효율적
    model = joblib.load(model_path)'''
    st.code(code1, language="python")
    
    st.markdown("---")
    st.subheader("핵심 코드: CSV 업로드 예측")
    
    code2 = '''@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    CSV 파일 업로드 후 전체 행에 대해 ML 예측 수행
    
    [처리 흐름]
    1. 파일 바이너리 읽기 -> pandas DataFrame 변환
    2. 전처리 파이프라인으로 27개 피처 생성
    3. XGBoost 모델로 각 행별 카테고리 예측 (0~5 정수)
    4. 숫자를 카테고리명으로 매핑 후 JSON 반환
    """
    global model
    content = await file.read()  # 비동기로 전체 파일 읽기
    
    # [한글 CSV 인코딩 처리]
    # 한국 은행/카드사 CSV는 보통 CP949(EUC-KR) 인코딩
    # UTF-8 먼저 시도, 실패 시 CP949로 폴백
    try:
        df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(content), encoding='cp949')
    
    # [전처리] 싱글톤 패턴으로 전처리기 인스턴스 획득
    preprocessor = get_preprocessor()
    df_processed = preprocessor.preprocess(df)  # 27개 피처 생성
    
    # [모델 lazy loading] 첫 요청 시에만 로드
    if model is None:
        load_model()
    
    # [예측] numpy array 반환 (각 행의 예측 클래스 0~5)
    predictions = model.predict(df_processed)
    
    # [카테고리 매핑] 학습 시 사용한 레이블 인코딩의 역변환
    category_map = {0:'교통', 1:'생활', 2:'쇼핑', 3:'식료품', 4:'외식', 5:'주유'}
    predicted_cats = [category_map.get(int(p), '기타') for p in predictions]
    
    # [응답 구성] 프론트엔드에서 바로 사용할 수 있는 형태
    return {
        "filename": file.filename,
        "total_rows": len(df),
        "transactions": [...],  # 각 거래 + AI 예측 결과
        "summary": {"by_category": pd.Series(predicted_cats).value_counts().to_dict()}
    }'''
    st.code(code2, language="python")

# 3. 데이터 전처리
elif menu == "3. 데이터 전처리":
    st.markdown("# 데이터 전처리 파이프라인")
    st.markdown("**파일**: `10_backend/app/services/preprocessing.py` (466줄)")
    st.markdown("---")
    
    st.subheader("왜 만들었는가 (Why)")
    st.markdown("""<div class="reason-box">
<b>문제</b>: 원본 CSV(날짜, 시간, 금액 등 텍스트)와 모델 입력(24개 숫자 피처)의 형식 불일치<br><br>
<b>해결</b>: 학습 시와 동일한 전처리 로직을 API에서도 적용하는 파이프라인 구축
</div>""", unsafe_allow_html=True)
    
    st.markdown("---")
    st.subheader("생성되는 27개 파생변수")
    
    features = pd.DataFrame({
        "카테고리": ["시간"]*9 + ["금액"]*3 + ["사용자"]*3 + ["시퀀스"]*2 + ["카테고리"]*4 + ["비율"]*6,
        "피처명": ["Hour","DayOfWeek","DayOfMonth","IsWeekend","IsLunchTime","IsEvening",
                 "IsMorningRush","IsNight","IsBusinessHour","Amount_clean","Amount_log",
                 "AmountBin","User_AvgAmount","User_StdAmount","User_TxCount",
                 "Transaction_Sequence","Time_Since_Last","Previous_Category",
                 "Current_Category","User_FavCategory","User_Category_Count",
                 "User_교통_Ratio","User_생활_Ratio","User_쇼핑_Ratio",
                 "User_식료품_Ratio","User_외식_Ratio","User_주유_Ratio"],
        "설명": ["시간(0-23)","요일(0:월~6:일)","일(1-31)","주말여부","점심(11-13)","저녁(18-20)",
                "출근(7-9)","심야(22-4)","업무시간","금액절대값","금액로그",
                "금액구간","평균거래액","표준편차","총거래수",
                "거래순서","이전거래간격","이전카테고리",
                "현재카테고리","선호카테고리","사용카테고리수",
                "교통비율","생활비율","쇼핑비율","식료품비율","외식비율","주유비율"]
    })
    st.dataframe(features, use_container_width=True)
    
    st.markdown("---")
    st.subheader("핵심 코드: 전처리 클래스")
    
    code = '''class DataPreprocessor:
    """
    XGBoost 모델 입력을 위한 데이터 전처리 클래스
    
    [설계 원칙]
    1. 메타데이터 기반: model_metadata.json에서 피처 목록 로드
    2. 싱글톤 패턴: get_preprocessor()로 인스턴스 재사용
    3. 파이프라인 구조: clean -> engineer -> select 순차 처리
    """
    
    def __init__(self, metadata_path=None):
        """
        초기화 시 메타데이터 로드
        - metadata_path: 모델과 함께 저장된 피처 스펙 JSON
        - 없으면 app 폴더의 model_metadata.json 사용
        """
        if metadata_path is None:
            app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            metadata_path = os.path.join(app_dir, "model_metadata.json")
        with open(metadata_path) as f:
            self.metadata = json.load(f)
        self.feature_names = self.metadata['features']  # 24개 피처명 리스트
    
    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        전체 전처리 파이프라인 실행
        
        [단계별 처리]
        1. _clean_data: 날짜/시간 파싱, 금액 숫자 변환, 정렬
        2. _feature_engineering: 27개 파생변수 생성
        3. 컬럼 선택: 메타데이터의 24개 피처만 추출 (순서 보장)
        """
        df_clean = self._clean_data(df)
        df_engineered = self._feature_engineering(df_clean)
        # 모델이 학습된 피처 순서대로 정렬하여 반환
        return df_engineered[[f for f in self.feature_names if f in df_engineered.columns]]
    
    def _clean_data(self, df):
        """
        원본 데이터 정제
        - 날짜 + 시간 컬럼 합쳐서 datetime 생성
        - 금액: 문자열이면 콤마 제거 후 숫자 변환
        - 시간순 정렬 (시퀀스 피처 생성에 필요)
        """
        df = df.copy()
        df['CreateDate'] = pd.to_datetime(df['날짜'] + ' ' + df['시간'])
        if df['금액'].dtype == object:
            df['Amount'] = pd.to_numeric(df['금액'].str.replace(',',''), errors='coerce').fillna(0)
        else:
            df['Amount'] = df['금액'].fillna(0)
        return df.sort_values('CreateDate')
    
    def _feature_engineering(self, df):
        """
        27개 파생변수 생성
        
        [시간 피처] - 소비 패턴은 시간대에 따라 다름
        - Hour, DayOfWeek, DayOfMonth: 기본 시간 정보
        - IsWeekend, IsLunchTime 등: 특정 시간대 플래그
        
        [금액 피처] - 금액 크기와 분포 정보
        - Amount_log: 로그 변환으로 큰 금액의 영향 완화
        - AmountBin: 5000원 단위 구간화
        
        [사용자 피처] - 개인 소비 패턴
        - User_AvgAmount: CSV 내 평균 거래액
        - User_*_Ratio: 카테고리별 사용 비율
        """
        df = df.copy()
        # 시간 피처
        df['Hour'] = df['CreateDate'].dt.hour
        df['DayOfWeek'] = df['CreateDate'].dt.dayofweek
        df['IsWeekend'] = (df['DayOfWeek'] >= 5).astype(int)
        df['IsLunchTime'] = df['Hour'].between(11,13).astype(int)
        # ... 생략 (전체 27개 생성)
        return df

# [싱글톤 패턴 구현]
# 전역 변수로 인스턴스 캐싱 -> 매 요청마다 JSON 파싱 불필요
_instance = None
def get_preprocessor():
    global _instance
    if _instance is None:
        _instance = DataPreprocessor()
    return _instance'''
    st.code(code, language="python")

# 4. 프론트엔드 통합
elif menu == "4. 프론트엔드 통합":
    st.markdown("# 프론트엔드 ML 통합")
    st.markdown("**파일**: `20_frontend_user/src/` (React Native)")
    st.markdown("---")
    
    st.subheader("왜 만들었는가 (Why)")
    st.markdown("""<div class="reason-box">
<b>목적</b>: 백엔드 ML API를 React Native 앱에서 호출하여 사용자에게 AI 예측 결과 표시<br><br>
<b>구현 화면</b>: MLTestScreen(테스트), DashboardScreen(인사이트), TransactionContext(상태관리)
</div>""", unsafe_allow_html=True)
    
    st.markdown("---")
    st.subheader("핵심 코드: TransactionContext")
    
    code = '''// 20_frontend_user/src/contexts/TransactionContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    
    // [앱 시작 시] 로컬 캐시에서 데이터 로드 (오프라인 지원)
    useEffect(() => {
        loadCachedTransactions();
        loadTransactionsFromServer();
    }, []);
    
    // [다음 소비 예측 API 호출]
    const predictNextPurchase = async () => {
        // 거래 데이터를 CSV 문자열로 변환
        const csvHeader = '날짜,시간,타입,대분류,...\\n';
        const csvRows = transactions.map(t => 
            [t.date.split(' ')[0], t.date.split(' ')[1], '지출', t.category, ...].join(',')
        ).join('\\n');
        
        // FormData로 파일 전송
        const formData = new FormData();
        formData.append('file', new Blob([csvHeader + csvRows]), 'data.csv');
        
        // API 호출 -> 예측 결과 반환
        const result = await fetch('http://localhost:8001/ml/predict-next', {
            method: 'POST', body: formData
        });
        return await result.json();
    };
    
    return (
        <TransactionContext.Provider value={{ transactions, predictNextPurchase }}>
            {children}
        </TransactionContext.Provider>
    );
};'''
    st.code(code, language="javascript")

# 5. Docker 환경
elif menu == "5. Docker 환경":
    st.markdown("# Docker 컨테이너 환경")
    st.markdown("**파일**: `docker-compose.yml` (129줄)")
    st.markdown("---")
    
    st.subheader("왜 만들었는가 (Why)")
    st.markdown("""<div class="reason-box">
<b>목적</b>: 8개 서비스를 일관된 환경에서 실행/배포<br><br>
<b>문제</b>: 각 서비스마다 다른 의존성, 로컬/서버 환경 차이, 네트워크 설정 복잡성
</div>""", unsafe_allow_html=True)
    
    st.markdown("---")
    st.subheader("서비스 구성")
    
    services = pd.DataFrame({
        "서비스": ["db", "backend", "admin_front", "nginx", "ml_next", "ml_fraud", "llm_category", "llm_analysis"],
        "이미지": ["postgres:15", "FastAPI", "Next.js", "Nginx", "FastAPI", "FastAPI", "FastAPI", "FastAPI"],
        "포트": ["5432", "8001", "3001", "80", "9001", "9002", "9100", "9102"],
        "Request": ["SQL Query", "REST API JSON/CSV", "HTTP", "HTTP Proxy", "CSV File", "JSON", "Text", "JSON"],
        "Response": ["SQL Result", "JSON", "HTML/JS", "Proxied Response", "JSON (prediction)", "JSON (score)", "JSON (category)", "JSON (insight)"]
    })
    st.dataframe(services, use_container_width=True)
    
    st.markdown("---")
    st.subheader("핵심 코드: docker-compose.yml")
    
    code = '''version: "3.9"
services:
  # [PostgreSQL] 메인 데이터베이스
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # .env에서 주입
    healthcheck:  # 준비 상태 확인 (backend 시작 전 대기)
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
  
  # [FastAPI Backend] 메인 API 서버
  backend:
    build: ./10_backend
    depends_on:
      db: { condition: service_healthy }  # DB 준비 후 시작
    environment:
      SECRET_KEY: ${SECRET_KEY}
    ports: ["8001:8000"]  # 호스트:컨테이너
    volumes: ["./10_backend/app:/app/app"]  # 핫 리로드
  
  # [ML 서비스] XGBoost 예측
  ml_next:
    build: ./40_ml_next
    volumes:
      - ./10_backend/app/model.joblib:/app/model.joblib:ro  # 읽기전용
  
  # [LLM 서비스] Gemini 분석
  llm_analysis:
    build: ./51_llm_analysis
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}'''
    st.code(code, language="yaml")

# 6. LLM 분석
elif menu == "6. LLM 분석":
    st.markdown("# LLM 분석 서비스 (Gemini)")
    st.markdown("**파일**: `51_llm_analysis/app.py`")
    st.markdown("---")
    
    st.subheader("왜 만들었는가 (Why)")
    st.markdown("""<div class="reason-box">
<b>목적</b>: ML 예측을 넘어 맞춤형 소비 조언 제공<br><br>
<b>Gemini 선택</b>: 한국어 이해도 높음, 무료 티어(60회/분), JSON 응답 지원
</div>""", unsafe_allow_html=True)
    
    st.markdown("---")
    st.subheader("API 엔드포인트")
    
    api_df = pd.DataFrame({
        "엔드포인트": ["/analyze", "/category-tips"],
        "Request": ['{"transactions": [...], "summary": {...}}', '{"category": "외식", "amount": 300000}'],
        "Response": ['{"insight": "...", "tips": [...], "score": 72}', '{"tips": ["팁1", "팁2", "팁3"]}']
    })
    st.dataframe(api_df, use_container_width=True)
    
    st.markdown("---")
    st.subheader("핵심 코드: Gemini 연동")
    
    code = '''# 51_llm_analysis/app.py
from fastapi import FastAPI
import google.generativeai as genai
import os

app = FastAPI(title="LLM Analysis Service")

# [Gemini 초기화] 환경변수에서 API 키 로드
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

@app.post("/analyze")
async def analyze_spending(data: dict):
    """
    소비 데이터 분석 및 인사이트 생성
    
    [프롬프트 엔지니어링]
    - 역할: 가계부 분석 전문가
    - 입력: 총 지출, 카테고리별 금액
    - 출력: JSON 형식 (insight, tips, score)
    """
    prompt = f"""당신은 가계부 분석 전문가입니다.
    
총 지출: {data['summary']['total']:,}원
카테고리별: {data['summary']['by_category']}

다음을 분석해주세요:
1. 소비 패턴 인사이트 (2문장)
2. 절약 팁 3가지
3. 재정 건강 점수 (0-100)

JSON으로 응답: {{"insight": "...", "tips": [...], "score": N}}"""
    
    # [API 호출] generate_content는 동기 메서드
    response = model.generate_content(prompt)
    return parse_json(response.text)'''
    st.code(code, language="python")

# 7. 프로젝트 구조
elif menu == "7. 프로젝트 구조":
    st.markdown("# 프로젝트 구조")
    st.markdown("---")
    
    st.subheader("시스템 아키텍처 다이어그램")
    
    # 이미지 표시
    img_path = os.path.join(os.path.dirname(__file__), "project_architecture.png")
    if os.path.exists(img_path):
        st.image(img_path, caption="프로젝트 아키텍처", use_container_width=True)
    else:
        st.info("아키텍처 이미지를 로드할 수 없습니다.")
    
    st.markdown("---")
    st.subheader("폴더 구조")
    
    tree = """caffeine/
    10_backend/                      -- FastAPI 백엔드
        app/
            routers/ml.py            -- [신규] ML 예측 API
            services/preprocessing.py -- [신규] 전처리 파이프라인
            main.py                  -- 앱 진입점
    20_frontend_user/                -- React Native 앱
        src/screens/MLTestScreen.js  -- [신규] ML 테스트
        src/contexts/TransactionContext.js -- [신규]
    21_frontend_admin/               -- Next.js 관리자앱
    30_nginx/                        -- 리버스 프록시
    40_ml_next/                      -- ML 다음 예측 서비스
    51_llm_analysis/app.py           -- [신규] Gemini 연동
    docker-compose.yml               -- [신규] 8개 서비스 통합"""
    
    st.markdown(f'<div class="folder-tree">{tree}</div>', unsafe_allow_html=True)

st.markdown("---")
st.markdown("<center>커밋 코드 리뷰 보고서 v2.1 | 15tkdgns | 2025-12-12</center>", unsafe_allow_html=True)
