"""커밋 코드 리뷰 보고서 v3.2 - 단일 페이지 스크롤"""
import streamlit as st
import pandas as pd
import os

st.set_page_config(page_title="커밋 코드 리뷰 보고서", layout="wide")

st.markdown("""<style>
.main-title { font-size: 2.5rem; font-weight: bold; color: #1a1a2e; margin-bottom: 1rem; text-align: center; }
.section-divider { border-top: 3px solid #667eea; margin: 3rem 0; }
.section-header { font-size: 2rem; font-weight: bold; color: black; padding: 1rem; border-radius: 10px; margin: 2rem 0 1rem 0; }
.subsection-header { font-size: 1.5rem; font-weight: bold; color: #34495e; margin: 1.5rem 0 0.5rem 0; border-bottom: 2px solid #ecf0f1; padding-bottom: 0.5rem; }
.reason-box { background: #e8f4fd; border-left: 4px solid #3498db; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; }
.explain-box { background: #fef9e7; border-left: 4px solid #f1c40f; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; }
.flow-box { background: #f5eef8; border-left: 4px solid #9b59b6; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; }
.folder-tree { background: #2d2d2d; color: #e0e0e0; padding: 1.5rem; border-radius: 10px; font-family: monospace; white-space: pre-wrap; line-height: 1.8; }
</style>""", unsafe_allow_html=True)

# 메인 헤더
st.markdown('<p class="main-title">커밋 코드 리뷰 보고서</p>', unsafe_allow_html=True)
st.markdown("---")

# 1. 시스템 아키텍처
st.markdown('<div class="section-header">1. 시스템 아키텍처</div>', unsafe_allow_html=True)

img_path = os.path.join(os.path.dirname(__file__), "project_architecture.png")
if os.path.exists(img_path):
    st.image(img_path, use_container_width=True)

st.markdown('<div class="subsection-header">폴더 구조</div>', unsafe_allow_html=True)
tree = """caffeine/
    10_backend/                      -- FastAPI 백엔드
        app/routers/ml.py            -- ML 예측 API
        app/services/preprocessing.py -- 데이터 전처리
    20_frontend_user/                -- React Native 앱
    21_frontend_admin/               -- Next.js 관리자앱
    51_llm_analysis/app.py           -- Gemini LLM 연동
    docker-compose.yml               -- 컨테이너 구성"""
st.markdown(f'<div class="folder-tree">{tree}</div>', unsafe_allow_html=True)

st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)

# 2. 전체 개요
st.markdown('<div class="section-header">2. 전체 개요</div>', unsafe_allow_html=True)

st.markdown("""
| 기능 | 설명 | 기술 |
|-----|------|-----|
| **ML 예측 API** | CSV 업로드 시 AI가 소비 카테고리 자동 분류 | FastAPI + XGBoost |
| **데이터 전처리** | 원본 데이터를 ML 모델 입력 형식으로 변환 | Pandas + NumPy |
| **프론트엔드 통합** | 앱에서 예측 결과 표시 | React Native |
| **Docker 환경** | 8개 서비스 컨테이너화 | Docker Compose |
| **LLM 분석** | AI 소비 조언 생성 | Gemini API |
""")

st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)

# 2-1. 파일 수정 이력
st.markdown('<div class="section-header">2-1. 파일 및 폴더 수정 이력</div>', unsafe_allow_html=True)
st.markdown("**기간**: 2025.12.04 ~ 12.12 | **작성자**: 15tkdgns")

# 트리 형태로 통합
file_tree = """caffeine/
├── 10_backend/
│   ├── app/
│   │   ├── routers/
│   │   │   └── <span style="color:#27ae60">+ ml.py</span>              ← ML 예측 API (신규)
│   │   ├── services/
│   │   │   └── <span style="color:#27ae60">+ preprocessing.py</span>  ← 데이터 전처리 (신규)
│   │   └── <span style="color:#f39c12">M main.py</span>               ← ML 라우터 등록 (수정)
│   └── <span style="color:#f39c12">M requirements.txt</span>          ← xgboost, joblib 추가 (수정)
│
├── 20_frontend_user/
│   ├── <span style="color:#f39c12">M App.js</span>                     ← 새 화면 라우트 (수정)
│   └── src/
│       ├── screens/
│       │   ├── <span style="color:#27ae60">+ MLTestScreen.js</span>    ← ML 테스트 화면 (신규)
│       │   └── <span style="color:#f39c12">M DashboardScreen.js</span> ← AI 인사이트 추가 (수정)
│       └── contexts/
│           └── <span style="color:#27ae60">+ TransactionContext.js</span> ← 전역 상태 (신규)
│
├── <span style="color:#27ae60">+ 21_frontend_admin/</span>           ← Next.js 관리자앱 (신규 전체)
│
├── <span style="color:#27ae60">+ 51_llm_analysis/</span>
│   └── <span style="color:#27ae60">+ app.py</span>                     ← Gemini LLM 연동 (신규)
│
├── <span style="color:#27ae60">+ docker-compose.yml</span>            ← 8개 서비스 통합 (신규)
│
├── <span style="color:#3498db">→ 80_psh/</span>                        ← 개인 도구 분리
│   └── <span style="color:#27ae60">+ commit_review_report.py</span>
│
├── <span style="color:#3498db">→ 99_archive/</span>                    ← 백업 아카이브
│   └── scripts/, 10_backend.zip
│
└── <span style="color:#e74c3c">- frontend/</span>                     ← 20_frontend_user로 통합 (삭제)
    <span style="color:#e74c3c">- __pycache__/</span>                  ← 캐시 제거 (삭제)
    <span style="color:#e74c3c">- 21_frontend_admin_old/</span>        ← 통합 후 삭제"""

st.markdown(f'<div class="folder-tree">{file_tree}</div>', unsafe_allow_html=True)

st.markdown("""
**범례**: <span style="color:#27ae60">+ 신규</span> | <span style="color:#f39c12">M 수정</span> | <span style="color:#3498db">→ 이동</span> | <span style="color:#e74c3c">- 삭제</span>
""", unsafe_allow_html=True)

st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)

# 3. ML 예측 API
st.markdown('<div class="section-header">3. ML 예측 API (FastAPI)</div>', unsafe_allow_html=True)
st.markdown("**파일**: `10_backend/app/routers/ml.py`")

st.markdown("""<div class="reason-box">
<b>문제</b>: CSV 업로드 시 각 거래의 카테고리(식비, 교통비 등) 자동 분류 필요<br><br>
<b>해결</b>: XGBoost 모델을 FastAPI 서버에 로드하고 CSV를 받아 예측 결과 JSON 반환
</div>""", unsafe_allow_html=True)

api_df = pd.DataFrame({
    "엔드포인트": ["/ml/predict", "/ml/upload", "/ml/predict-next"],
    "용도": ["단일 거래 테스트", "CSV 전체 예측", "다음 소비 예측"],
    "입력": ["JSON", "CSV 파일", "CSV 파일"],
    "출력": ['{"prediction": "외식"}', '{"transactions": [...]}', '{"predicted_category": "외식"}']
})
st.dataframe(api_df, use_container_width=True)

# 코드와 스크린샷 나란히 배치
col_code, col_img = st.columns([3, 2])

with col_code:
    code1 = '''def load_model():
    """XGBoost 모델 로드"""
    global model
    model_path = "model_xgboost_acc_73.47.joblib"
    model = joblib.load(model_path)

@router.post("/upload")
async def upload_file(file: UploadFile):
    """CSV 업로드 -> 예측 -> JSON"""
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))
    
    preprocessor = get_preprocessor()
    df_processed = preprocessor.preprocess(df)
    predictions = model.predict(df_processed)
    
    return {"transactions": [...]}'''
    st.code(code1, language="python")

with col_img:
    img_ml = os.path.join(os.path.dirname(__file__), "screenshots/api_docs_ml.png")
    if os.path.exists(img_ml):
        st.image(img_ml, caption="ML API 엔드포인트 (Swagger UI)")
    img_api = os.path.join(os.path.dirname(__file__), "screenshots/api_docs_main.png")
    if os.path.exists(img_api):
        st.image(img_api, caption="전체 API 문서")

st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)

# 4. 데이터 전처리
st.markdown('<div class="section-header">4. 데이터 전처리 파이프라인</div>', unsafe_allow_html=True)
st.markdown("**파일**: `10_backend/app/services/preprocessing.py`")

st.markdown("""<div class="reason-box">
<b>문제</b>: 원본 CSV (날짜, 금액 텍스트)를 ML 모델은 이해 못함<br><br>
<b>해결</b>: 텍스트 → 숫자 변환, 27개 파생변수 생성
</div>""", unsafe_allow_html=True)

col1, col2 = st.columns(2)
with col1:
    st.markdown("""**시간 피처 (9개)**
    - Hour, DayOfWeek, DayOfMonth
    - IsWeekend, IsLunchTime, IsEvening
    - IsMorningRush, IsNight, IsBusinessHour""")
with col2:
    st.markdown("""**금액/사용자 피처 (18개)**
    - Amount_clean, Amount_log, AmountBin
    - User_AvgAmount, User_StdAmount
    - User_외식_Ratio 등 카테고리별 비율""")

code2 = '''class DataPreprocessor:
    def preprocess(self, df):
        df_clean = self._clean_data(df)      # 날짜/금액 파싱
        df_feat = self._feature_engineering(df_clean)  # 27개 피처
        return df_feat[self.feature_names]   # 모델 입력 순서
    
    def _feature_engineering(self, df):
        df['Hour'] = df['CreateDate'].dt.hour
        df['IsWeekend'] = (df['DayOfWeek'] >= 5).astype(int)
        df['Amount_log'] = np.log1p(df['Amount'].abs())
        # ... 27개 피처 생성
        return df'''
st.code(code2, language="python")

st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)

# 5. 프론트엔드 통합
st.markdown('<div class="section-header">5. 프론트엔드 ML 통합</div>', unsafe_allow_html=True)
st.markdown("**파일**: `20_frontend_user/src/contexts/TransactionContext.js`")

code3 = '''// React Context로 전역 상태 관리
const predictNextPurchase = async () => {
    // 거래 데이터를 CSV 형식으로 변환
    const csvRows = transactions.map(t => 
        [t.date, t.amount, t.category].join(',')
    );
    
    const formData = new FormData();
    formData.append('file', 
        new Blob([csv], {type: 'text/csv'}), 
        'data.csv'
    );
    
    // ML API 호출
    const response = await fetch(
        '/ml/predict-next', 
        {method: 'POST', body: formData}
    );
    return response.json();
};'''
st.code(code3, language="javascript")

st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)

# 6. Docker 환경
st.markdown('<div class="section-header">6. Docker 컨테이너 환경</div>', unsafe_allow_html=True)

services = pd.DataFrame({
    "서비스": ["db", "backend", "admin_front", "nginx", "ml_next", "llm_analysis"],
    "역할": ["PostgreSQL", "FastAPI", "Next.js", "프록시", "ML 예측", "Gemini"],
    "포트": ["5432", "8001", "3001", "80", "9001", "9102"]
})
st.dataframe(services, use_container_width=True)

# 코드와 스크린샷 나란히 배치
col_code, col_img = st.columns([3, 2])

with col_code:
    code4 = '''# docker-compose.yml
services:
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
  
  backend:
    build: ./10_backend
    depends_on:
      db: { condition: service_healthy }
  
  admin_front:
    build: ./21_frontend_admin
    ports:
      - "3001:3000"'''
    st.code(code4, language="yaml")

with col_img:
    img_admin = os.path.join(os.path.dirname(__file__), "screenshots/admin_main.png")
    if os.path.exists(img_admin):
        st.image(img_admin, caption="관리자 대시보드")
    img_users = os.path.join(os.path.dirname(__file__), "screenshots/admin_users.png")
    if os.path.exists(img_users):
        st.image(img_users, caption="사용자 관리 페이지")

st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)

# 7. LLM 분석
st.markdown('<div class="section-header">7. LLM 분석 서비스 (Gemini)</div>', unsafe_allow_html=True)
st.markdown("**파일**: `51_llm_analysis/app.py`")

code5 = '''import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

@app.post("/analyze")
async def analyze_spending(data: dict):
    prompt = f"""당신은 가계부 분석 전문가입니다.
    총 지출: {data['total']:,}원
    카테고리별: {data['by_category']}
    
    분석해주세요:
    1. 소비 패턴 인사이트
    2. 절약 팁 3가지
    3. 재정 점수 (0-100)"""
    
    response = model.generate_content(prompt)
    return parse_json(response.text)'''
st.code(code5, language="python")

# Footer
st.markdown('<div class="section-divider"></div>', unsafe_allow_html=True)
st.markdown("<center>커밋 코드 리뷰 보고서 v3.2 | 15tkdgns | 2025-12-12</center>", unsafe_allow_html=True)
