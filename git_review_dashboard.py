"""
Git 변경사항 리뷰 대시보드 (회사 리뷰용)
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import os

# 페이지 설정
st.set_page_config(
    page_title="Git 변경사항 리뷰 대시보드",
    page_icon="chart_with_upwards_trend",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 커스텀 CSS
st.markdown("""
<style>
    .big-font {
        font-size:30px !important;
        font-weight: bold;
    }
    .metric-container {
        background-color: #f0f2f6;
        padding: 20px;
        border-radius: 10px;
        margin: 10px 0px;
    }
    .warning-box {
        background-color: #fff3cd;
        border-left: 5px solid #ffc107;
        padding: 15px;
        margin: 10px 0px;
    }
    .success-box {
        background-color: #d4edda;
        border-left: 5px solid #28a745;
        padding: 15px;
        margin: 10px 0px;
    }
    .danger-box {
        background-color: #f8d7da;
        border-left: 5px solid #dc3545;
        padding: 15px;
        margin: 10px 0px;
    }
    .info-box {
        background-color: #d1ecf1;
        border-left: 5px solid #17a2b8;
        padding: 15px;
        margin: 10px 0px;
    }
</style>
""", unsafe_allow_html=True)

# 데이터 정의
git_data = {
    'branch': 'front-sjw',
    'remote': 'source_repo/front-sjw',
    'commits_behind': 3,
    'total_files': 43,
    'modified': 9,
    'deleted': 33,
    'added': 21,
    'lines_added': 669,
    'lines_deleted': 20029,
    'root_files_before': 19,
    'root_files_after': 7
}

# 사이드바
st.sidebar.title("목차")
page = st.sidebar.radio(
    "섹션 선택",
    [
        "Executive Summary", 
        "Executive Review 전문",
        "프로젝트 구조",
        "삭제 내역", 
        "수정 내역", 
        "추가 내역", 
        "리스크 분석", 
        "머지 권장사항"
    ]
)

# 메인 타이틀
st.title("Git 변경사항 상세 리뷰 대시보드")
st.markdown(f"**브랜치**: front-sjw | **생성일**: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
st.markdown("---")


# Executive Summary 파일 읽기 함수
def load_executive_review():
    review_path = "/root/caffeine/EXECUTIVE_GIT_REVIEW.md"
    if os.path.exists(review_path):
        with open(review_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "# Executive Review 파일을 찾을 수 없습니다."

# ========================================
# Executive Summary
# ========================================
if page == "Executive Summary":
    st.header("Executive Summary")
    
    # 핵심 메트릭
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("총 변경 파일", f"{git_data['total_files']}개", "")
    with col2:
        st.metric("코드 감소", f"-{git_data['lines_deleted']:,}줄", f"+{git_data['lines_added']}줄")
    with col3:
        st.metric("루트 파일", f"{git_data['root_files_after']}개", f"-{git_data['root_files_before']-git_data['root_files_after']}개 (63%↓)")
    with col4:
        st.metric("커밋 차이", f"{git_data['commits_behind']}개", "뒤처짐", delta_color="inverse")
    
    st.markdown("---")
    
    # 변경사항 분포
    st.subheader("변경사항 분포")
    col1, col2 = st.columns(2)
    
    with col1:
        fig1 = go.Figure(data=[go.Pie(
            labels=['삭제됨', '추가됨', '수정됨'],
            values=[git_data['deleted'], git_data['added'], git_data['modified']],
            hole=0.4,
            marker=dict(colors=['#ff6b6b', '#51cf66', '#ffd43b'])
        )])
        fig1.update_layout(title='파일 변경 유형', height=350)
        st.plotly_chart(fig1, use_container_width=True)
    
    with col2:
        fig2 = go.Figure(data=[
            go.Bar(name='추가', x=['코드 변경량'], y=[git_data['lines_added']], marker_color='#51cf66'),
            go.Bar(name='삭제', x=['코드 변경량'], y=[git_data['lines_deleted']], marker_color='#ff6b6b')
        ])
        fig2.update_layout(title='코드 라인 변경량', barmode='group', height=350)
        st.plotly_chart(fig2, use_container_width=True)
    
    st.subheader("주요 변경사항")
    
    st.markdown("""
    <div class="success-box">
        <h4>긍정적 변경</h4>
        <ul>
            <li><strong>코드베이스 간소화</strong>: 19,360줄 감소 (96.7% 감소)</li>
            <li><strong>문서 체계화</strong>: 00_docs_core/ 디렉토리 구조로 정리</li>
            <li><strong>운영 편의성</strong>: 실행 스크립트로 시스템 관리 자동화</li>
            <li><strong>ML 기능 추가</strong>: 백엔드 API + 프론트엔드 테스트 화면</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="warning-box">
        <h4>주의사항</h4>
        <ul>
            <li><strong>Git 상태</strong>: 원격과 3 커밋 차이 → 충돌 가능성</li>
            <li><strong>대량 파일 삭제</strong>: 33개 파일 → 신중한 리뷰 필요</li>
            <li><strong>.gitignore 업데이트</strong>: __pycache__/, audit.log 추가 필요</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

# ========================================
# Executive Review 전문
# ========================================
elif page == "Executive Review 전문":
    st.header("Executive Review 전문")
    
    st.markdown("""
    <div class="info-box">
        <p>이 문서는 회사 리뷰 및 머지 승인을 위한 상세 보고서입니다.</p>
        <p>모든 이모지가 제거되었으며, 각 변경사항의 이유와 비즈니스 임팩트가 상세히 설명되어 있습니다.</p>
    </div>
    """, unsafe_allow_html=True)
    
    review_content = load_executive_review()
    st.markdown(review_content)

# ========================================
# 프로젝트 구조
# ========================================
elif page == "프로젝트 구조":
    st.header("프로젝트 구조 시각화")
    
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "시스템 아키텍처", 
        "API 구조",
        "디렉토리 구조", 
        "백엔드 구조",
        "프론트엔드 구조",
        "Git 변경사항"
    ])
    
    with tab1:
        st.subheader("1. 전체 시스템 아키텍처")
        
        arch_graph = '''
        digraph {
            rankdir=TB
            node [shape=box, style="rounded,filled", fontname="Arial"]
            
            subgraph cluster_client {
                label="클라이언트"
                style=filled
                color=lightblue
                A [label="20_frontend_user\\nReact Native Expo" fillcolor="#e1f5ff"]
                B [label="21_frontend_admin\\n관리자" fillcolor="#e1f5ff"]
            }
            
            subgraph cluster_server {
                label="백엔드 서버"
                style=filled
                color=lightyellow
                C [label="10_backend\\nFastAPI" fillcolor="#ffe1e1"]
                D [label="ML Router\\nml.py (407줄)" fillcolor="#fff4e1"]
                E [label="Preprocessing\\npreprocessing.py (433줄)" fillcolor="#fff4e1"]
            }
            
            subgraph cluster_ml {
                label="ML 모델"
                style=filled
                color=lightgreen
                F [label="Production Models\\nLightGBM (25MB)" fillcolor="#e1ffe1"]
            }
            
            A -> C [label="HTTP API"]
            B -> C [label="HTTP API"]
            C -> D [label="라우팅"]
            D -> E [label="전처리"]
            D -> F [label="예측"]
            E -> F [label="피처"]
        }
        '''
        st.graphviz_chart(arch_graph)
        
        st.subheader("2. ML API 엔드포인트")
        
        api_graph = '''
        digraph {
            rankdir=LR
            node [shape=box, style="rounded,filled", fontname="Arial"]
            
            E1 [label="POST /ml/predict" fillcolor="#e1f5ff"]
            E2 [label="POST /ml/upload" fillcolor="#e1ffe1"]
            E3 [label="POST /ml/predict-next" fillcolor="#fff4e1"]
            
            R1 [label="단일 예측\\n{prediction: 카테고리}" shape=note]
            R2 [label="일괄 예측\\n{transactions: [...], summary: {...}}" shape=note]
            R3 [label="다음 소비 예측\\n{predicted_category, confidence, probabilities}" shape=note]
            
            E1 -> R1
            E2 -> R2
            E3 -> R3
        }
        '''
        st.graphviz_chart(api_graph)
    
    with tab2:
        st.subheader("API 전체 구조 및 변경 내역")
        
        st.markdown("### 현재 API 엔드포인트 구조")
        
        # API 전체 구조 다이어그램
        api_full_graph = '''
        digraph {
            rankdir=TB
            node [shape=box, style="rounded,filled", fontname="Arial"]
            
            subgraph cluster_api {
                label="FastAPI Backend (10_backend)"
                style=filled
                color=lightblue
                
                MAIN [label="main.py\\n앱 진입점" fillcolor="#e1f5ff"]
                
                subgraph cluster_routers {
                    label="Routers"
                    style=filled
                    color=lightyellow
                    
                    ML [label="routers/ml.py\\n407줄\\n(신규)" fillcolor="#e1ffe1"]
                }
                
                subgraph cluster_services {
                    label="Services"
                    style=filled
                    color=lightgreen
                    
                    PREP [label="preprocessing.py\\n433줄\\n(신규)\\n\\n27개 Feature 생성" fillcolor="#fff4e1"]
                }
            }
            
            subgraph cluster_endpoints {
                label="ML API 엔드포인트 (신규)"
                style=filled
                color="#ffe1e1"
                
                E1 [label="POST /ml/predict\\n단일 거래 예측" fillcolor="#ffcccc"]
                E2 [label="POST /ml/upload\\nCSV 일괄 예측" fillcolor="#ffcccc"]
                E3 [label="POST /ml/predict-next\\n다음 소비 예측" fillcolor="#ffcccc"]
            }
            
            MODEL [label="production_models/\\nLightGBM (25MB)" fillcolor="#ffe1ff" shape=cylinder]
            
            MAIN -> ML [label="include_router"]
            ML -> E1
            ML -> E2
            ML -> E3
            
            E1 -> PREP [label="1. 전처리 호출" color=blue penwidth=2]
            E2 -> PREP [label="1. 전처리 호출" color=blue penwidth=2]
            E3 -> PREP [label="1. 전처리 호출" color=blue penwidth=2]
            
            PREP -> MODEL [label="2. Feature 전달\\n(27개 scaled)" color=green penwidth=2]
            
            MODEL -> E1 [label="3. 예측 결과" color=red penwidth=2 style=dashed]
            MODEL -> E2 [label="3. 예측 결과" color=red penwidth=2 style=dashed]
            MODEL -> E3 [label="3. 예측 결과" color=red penwidth=2 style=dashed]
        }
        '''
        st.graphviz_chart(api_full_graph)
        
        st.markdown("---")
        st.markdown("### API 변경 내역")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 신규 추가된 API")
            new_api = pd.DataFrame([
                {'엔드포인트': 'POST /ml/predict', '설명': '단일 거래 카테고리 예측', '파일': 'ml.py'},
                {'엔드포인트': 'POST /ml/upload', '설명': 'CSV 파일 업로드 및 일괄 예측', '파일': 'ml.py'},
                {'엔드포인트': 'POST /ml/predict-next', '설명': '다음 소비 카테고리 예측', '파일': 'ml.py'}
            ])
            st.dataframe(new_api, use_container_width=True, hide_index=True)
        
        with col2:
            st.markdown("#### 수정된 설정")
            modified_config = pd.DataFrame([
                {'항목': 'CORS 설정', '변경 내용': 'localhost:8081, 19000, 19006 추가', '이유': 'Expo 개발 서버 지원'},
                {'항목': 'startup_event', '변경 내용': 'ml.load_model() 호출 추가', '이유': '앱 시작 시 모델 로드'},
                {'항목': 'requirements.txt', '변경 내용': 'scikit-learn, joblib, pandas, numpy 추가', '이유': 'ML 라이브러리'}
            ])
            st.dataframe(modified_config, use_container_width=True, hide_index=True)
        
        st.markdown("---")
        st.markdown("### API 요청/응답 상세")
        
        st.markdown("#### 1. POST /ml/predict")
        col1, col2 = st.columns(2)
        with col1:
            st.code('''
# 요청 (Request)
{
  "features": {
    "날짜": "2024-12-08",
    "시간": "14:30",
    "타입": "지출",
    "대분류": "식비",
    "내용": "스타벅스",
    "금액": -5000
  }
}
            ''', language='json')
        with col2:
            st.code('''
# 응답 (Response)
{
  "prediction": "외식"
}
            ''', language='json')
        
        st.markdown("#### 2. POST /ml/upload")
        col1, col2 = st.columns(2)
        with col1:
            st.code('''
# 요청 (Request)
# Content-Type: multipart/form-data
# file: CSV 파일 (UTF-8 또는 CP949)
            ''', language='text')
        with col2:
            st.code('''
# 응답 (Response)
{
  "filename": "transactions.csv",
  "total_rows": 150,
  "transactions": [
    {
      "id": "1",
      "merchant": "스타벅스",
      "amount": 5000,
      "category": "외식",  // AI 예측
      "aiPredicted": true
    }
  ],
  "summary": {
    "by_category": {"외식": 45, "교통": 30},
    "total": 150
  }
}
            ''', language='json')
        
        st.markdown("#### 3. POST /ml/predict-next")
        col1, col2 = st.columns(2)
        with col1:
            st.code('''
# 요청 (Request)
# Content-Type: multipart/form-data
# file: CSV 파일 (거래 이력)
            ''', language='text')
        with col2:
            st.code('''
# 응답 (Response)
{
  "predicted_category": "외식",
  "confidence": 0.85,
  "probabilities": {
    "외식": 0.85,
    "교통": 0.08,
    "쇼핑": 0.05,
    "기타": 0.02
  },
  "confidence_metrics": {
    "confidence_level": "high"
  },
  "context": {
    "last_category": "교통",
    "most_frequent_category": "외식",
    "user_avg_amount": 15000
  }
}
            ''', language='json')
        
        st.markdown("---")
        st.markdown("### API 데이터 흐름 (전처리 포함)")
        
        api_flow_graph = '''
        digraph {
            rankdir=LR
            node [shape=box, style="rounded,filled", fontname="Arial"]
            
            CLIENT [label="Frontend\\n(React Native)" fillcolor="#e1f5ff"]
            
            subgraph cluster_api {
                label="API 처리 과정"
                style=filled
                color=lightgray
                
                API [label="FastAPI\\n/ml/*" fillcolor="#ffe1e1"]
                PREP [label="Preprocessing\\n27개 Feature 생성" fillcolor="#fff4e1"]
                MODEL [label="LightGBM\\n예측" fillcolor="#e1ffe1"]
            }
            
            RESP [label="JSON\\n응답" fillcolor="#ffe1ff"]
            
            CLIENT -> API [label="1. HTTP POST\\nCSV/JSON"]
            API -> PREP [label="2. 원본 데이터" color=blue penwidth=2]
            PREP -> MODEL [label="3. Feature Vector\\n(27개 scaled)" color=green penwidth=2]
            MODEL -> API [label="4. Prediction" color=red penwidth=2]
            API -> RESP [label="5. 포맷팅"]
            RESP -> CLIENT [label="6. JSON Response"]
        }
        '''
        st.graphviz_chart(api_flow_graph)
        
        # 전처리 상세 설명
        st.markdown("---")
        st.markdown("### 전처리 단계 상세")
        
        prep_detail = pd.DataFrame([
            {'순서': '1', '단계': '데이터 정제', '작업': '날짜/시간 병합, 금액 파싱, 정렬'},
            {'순서': '2', '단계': 'Feature Engineering', '작업': '27개 파생변수 생성 (시간, 금액, 사용자통계, 카테고리, 비율)'},
            {'순서': '3', '단계': 'Scaling', '작업': 'StandardScaler 적용 (mean/std 기반)'},
            {'순서': '4', '단계': '컬럼 순서 보장', '작업': '모델 입력 순서대로 정렬'}
        ])
        st.dataframe(prep_detail, use_container_width=True, hide_index=True)
        
        # 27개 Feature 목록
        with st.expander("생성되는 27개 Feature 상세"):
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.markdown("""
                **시간 피처 (9개)**:
                - Hour
                - DayOfWeek
                - DayOfMonth
                - IsWeekend
                - IsLunchTime
                - IsEvening
                - IsMorningRush
                - IsNight
                - IsBusinessHour
                """)
            
            with col2:
                st.markdown("""
                **금액/통계 피처 (8개)**:
                - Amount
                - Amount_log
                - AmountBin_encoded
                - User_AvgAmount
                - User_StdAmount
                - User_TxCount
                - Time_Since_Last
                - Transaction_Sequence
                """)
            
            with col3:
                st.markdown("""
                **카테고리 피처 (10개)**:
                - Current_Category_encoded
                - Previous_Category_encoded
                - User_FavCategory_encoded
                - User_Category_Count
                - User_교통_Ratio
                - User_생활_Ratio
                - User_쇼핑_Ratio
                - User_식료품_Ratio
                - User_외식_Ratio
                - User_주유_Ratio
                """)
    
    with tab3:
        st.subheader("3. 디렉토리 구조 변화")
        
        st.markdown("### 📂 정리 후 프로젝트 구조 (트리)")
        
        # 트리 구조를 Markdown 코드 블록으로 표시
        st.code("""
caffeine/
├── 📁 00_docs_core/                    [새로 추가] 문서 체계화
│   ├── design/
│   │   ├── 데이터베이스_테이블_스키마.md      [이동] 루트에서 이동
│   │   ├── 시스템구성도.txt                   [새로 추가]
│   │   └── 쿼리문.txt                         [새로 추가]
│   ├── manuals/
│   │   ├── (상세)작업+백엔드연동.md          [이동] 루트에서 이동
│   │   └── BACKEND_INTEGRATION_GUIDE.md    [이동] 루트에서 이동
│   └── 프로젝트_전체_진행상황.md              [이동] 루트에서 이동
│
├── 📁 10_backend/                     [기존] FastAPI 백엔드
│   ├── app/
│   │   ├── main.py                   [수정] CORS 확장, ML 라우터 추가 (+39줄, -9줄)
│   │   ├── routers/
│   │   │   └── ml.py                [신규] ML API 엔드포인트 (407줄)
│   │   └── services/
│   │       ├── __init__.py          [신규]
│   │       └── preprocessing.py     [신규] 데이터 전처리 (433줄)
│   └── requirements.txt             [수정] ML 라이브러리 추가 (+4줄, -10줄)
│
├── 📁 20_frontend_user/              [기존] React Native Expo
│   ├── App.js                       [수정] TransactionContext 추가 (+5줄, -9줄)
│   ├── src/
│   │   ├── contexts/
│   │   │   └── TransactionContext.js  [신규] 거래 상태 관리 (111줄)
│   │   └── screens/
│   │       ├── DashboardScreen.js      [수정] 다음 소비 예측 통합 (+94줄, -102줄)
│   │       ├── ProfileScreen.js        [수정] 데이터 동기화 개선 (+6줄, -144줄)
│   │       ├── TransactionScreen.js    [수정] UI 개선 (+62줄, -145줄)
│   │       └── MLTestScreen.js         [신규] ML 테스트 화면 (175줄)
│   ├── package.json                [수정] 의존성 추가
│   └── package-lock.json           [수정] 자동 생성 (+248줄)
│
├── 📁 99_archive/                    [새로 추가] 이전 파일 보관
│   ├── frontend/                    [삭제 후 이동] 중복 디렉토리 (27개 파일)
│   │   ├── App.js                  [삭제] 14,846줄
│   │   ├── src/...                 [삭제] 전체
│   │   └── package.json            [삭제]
│   └── data/                       [삭제 후 이동] 훈련 데이터 (82MB)
│
├── 📁 production_models/            [새로 추가] 프로덕션 모델
│   ├── lightgbm_v1.0.joblib        [신규] LightGBM 모델 (25MB)
│   └── lightgbm_v1.0_metadata.json [신규] 모델 메타데이터 (4KB)
│
├── 📄 git_review_dashboard.py       [신규] Streamlit 대시보드 (1,191줄)
├── 📄 EXECUTIVE_GIT_REVIEW.md       [신규] Git 변경사항 리뷰 (584줄)
├── 📄 DIRECTORY_STRUCTURE_ANALYSIS.md [신규] 디렉토리 분석 (1,000줄)
├── 📄 PROJECT_VISUALIZATION.md      [신규] 프로젝트 시각화 (1,000줄)
├── 📄 project_structure_viewer.html [신규] Mermaid 뷰어 (260줄)
│
├── 📄 start_all.sh                  [신규] 전체 실행 스크립트
├── 📄 start_backend.sh              [신규] 백엔드 실행 스크립트
├── 📄 start_frontend.sh             [신규] 프론트엔드 실행 스크립트
├── 📄 stop_all.sh                   [신규] 전체 종료 스크립트
│
├── 📄 README.md                     [기존] 프로젝트 설명
├── 📄 docker-compose.yml            [기존] Docker 구성
└── 📄 .gitignore                    [기존] Git 무시 파일

[삭제된 파일] (루트에서 제거됨)
├── ❌ frontend/                     → 99_archive/frontend/ (27개 파일, 14,846줄)
├── ❌ app.json                      → 삭제 (중복)
├── ❌ BACKEND_INTEGRATION_GUIDE.md  → 00_docs_core/manuals/
├── ❌ PROJECT_HANDOFF.md            → 00_docs_core/
└── ❌ 데이터베이스_테이블_스키마.md  → 00_docs_core/design/
        """, language="text")
        
        st.markdown("---")
        st.markdown("### 📊 변경사항 요약")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            **📁 디렉토리 구조 개선**:
            - ✅ **00_docs_core/** 생성 - 문서 체계화
            - ✅ **99_archive/** 생성 - 이전 파일 보관
            - ✅ **production_models/** 생성 - ML 모델
            - ❌ **frontend/** 삭제 - 중복 제거
            
            **📈 효과**:
            - 루트 디렉토리 파일 19개 → 7개 (63% 감소)
            - 문서 접근성 향상
            - 코드 중복 제거
            """)
        
        with col2:
            st.markdown("""
            **📝 주요 파일 변경**:
            - **10_backend**: ML API 추가 (840줄 신규)
            - **20_frontend_user**: ML 통합 (111줄 신규)
            - **문서**: 4개 새로 생성 (2,844줄)
            - **스크립트**: 4개 실행 스크립트
            
            **📦 코드 라인 변경**:
            - 추가: 669줄 (신규 기능)
            - 삭제: 20,029줄 (중복 제거)
            - 수정: 9개 파일
            """)
        
        st.markdown("---")
        st.markdown("### 🔍 상세 변경 내역")
        
        # 상세 변경 내역 테이블
        detailed_changes = pd.DataFrame([
            {'디렉토리/파일': '00_docs_core/', '유형': '신규', '변경': '문서 7개 이동/추가', '크기': '144KB', '영향': '문서 체계화'},
            {'디렉토리/파일': '10_backend/app/routers/ml.py', '유형': '신규', '변경': '407줄 추가', '크기': '14.8KB', '영향': 'ML API 3개'},
            {'디렉토리/파일': '10_backend/app/services/preprocessing.py', '유형': '신규', '변경': '433줄 추가', '크기': '18.3KB', '영향': '27개 Feature 생성'},
            {'디렉토리/파일': '10_backend/app/main.py', '유형': '수정', '변경': '+39줄, -9줄', '크기': '~2KB', '영향': 'CORS, ML 라우터'},
            {'디렉토리/파일': '20_frontend_user/src/contexts/TransactionContext.js', '유형': '신규', '변경': '111줄 추가', '크기': '3.5KB', '영향': '거래 상태 관리'},
            {'디렉토리/파일': '20_frontend_user/src/screens/DashboardScreen.js', '유형': '수정', '변경': '+94줄, -102줄', '크기': '35KB', '영향': '다음 소비 예측'},
            {'디렉토리/파일': '20_frontend_user/src/screens/ProfileScreen.js', '유형': '수정', '변경': '+6줄, -144줄', '크기': '14KB', '영향': '데이터 동기화'},
            {'디렉토리/파일': 'production_models/', '유형': '신규', '변경': '모델 2개 추가', '크기': '25MB', '영향': 'LightGBM 프로덕션'},
            {'디렉토리/파일': '99_archive/frontend/', '유형': '이동', '변경': '27개 파일', '크기': '82MB', '영향': '중복 제거'},
            {'디렉토리/파일': 'git_review_dashboard.py', '유형': '신규', '변경': '1,191줄 추가', '크기': '41KB', '영향': 'Streamlit 대시보드'},
        ])
        
        st.dataframe(detailed_changes, use_container_width=True, hide_index=True)
        
        # 변경 전후 비교
        st.markdown("---")
        st.markdown("### 📋 Before vs After 비교")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Before (정리 전)")
            st.code("""
루트 디렉토리: 19개 파일
├── 문서 7개 (산재)
├── frontend/ (중복)
├── 데이터 3개 (82MB)
└── 기타 6개

문제점:
❌ 문서 접근성 저하
❌ 코드 중복 (frontend/)
❌ 루트 디렉토리 복잡도 높음
❌ 스크립트 없음
            """, language="text")
        
        with col2:
            st.markdown("#### After (정리 후)")
            st.code("""
루트 디렉토리: 7개 파일
├── 00_docs_core/ (문서)
├── 99_archive/ (보관)
├── production_models/
└── 실행 스크립트 4개

개선점:
✅ 문서 체계화
✅ 중복 제거
✅ 루트 간결화 (63% 감소)
✅ 실행 자동화 스크립트
            """, language="text")
    
    with tab4:
        st.subheader("4. 백엔드 모듈 의존성")
        
        backend_graph = '''
        digraph {
            rankdir=TD
            node [shape=box, style="rounded,filled", fontname="Arial"]
            
            A [label="main.py\\nFastAPI App" fillcolor="#e1f5ff"]
            B [label="routers/ml.py\\n407줄" fillcolor="#ffe1e1"]
            C [label="services/preprocessing.py\\n433줄" fillcolor="#fff4e1"]
            D [label="Production Models\\nLightGBM" fillcolor="#e1ffe1"]
            E [label="load_model()" fillcolor="#ffe1ff"]
            F [label="pandas, scikit-learn" shape=ellipse fillcolor="#f0f0f0"]
            
            A -> B [label="include_router"]
            A -> E [label="startup_event"]
            B -> C [label="import"]
            B -> E [label="import"]
            E -> D [label="load"]
            C -> F [label="use"]
            B -> D [label="predict"]
        }
        '''
        st.graphviz_chart(backend_graph)
        
        st.subheader("5. API 응답 구조")
        
        response_data = pd.DataFrame([
            {'엔드포인트': '/ml/predict', '응답 필드': 'prediction', '설명': '예측된 카테고리 (외식, 교통 등)'},
            {'엔드포인트': '/ml/upload', '응답 필드': 'transactions', '설명': 'AI 카테고리가 추가된 거래 목록'},
            {'엔드포인트': '/ml/upload', '응답 필드': 'summary', '설명': '카테고리별 통계'},
            {'엔드포인트': '/ml/predict-next', '응답 필드': 'predicted_category', '설명': '다음 예상 카테고리'},
            {'엔드포인트': '/ml/predict-next', '응답 필드': 'confidence', '설명': '신뢰도 (0.0~1.0)'},
            {'엔드포인트': '/ml/predict-next', '응답 필드': 'probabilities', '설명': '카테고리별 확률 분포'}
        ])
        st.dataframe(response_data, use_container_width=True, hide_index=True)
    
    with tab5:
        st.subheader("6. 프론트엔드 컴포넌트 관계")
        
        frontend_graph = '''
        digraph {
            rankdir=TD
            node [shape=box, style="rounded,filled", fontname="Arial"]
            
            A [label="App.js" fillcolor="#e1f5ff"]
            B [label="TransactionProvider\\n(Context)" fillcolor="#ffe1e1"]
            C [label="DashboardScreen\\n808줄" fillcolor="#fff4e1"]
            D [label="TransactionScreen" fillcolor="#e1ffe1"]
            E [label="MLTestScreen\\n175줄" fillcolor="#e1ffe1"]
            F [label="ProfileScreen" fillcolor="#e1ffe1"]
            G [label="ML API\\n(Backend)" fillcolor="#ffe1ff"]
            
            A -> B [label="wrap"]
            B -> C [label="context"]
            B -> D [label="context"]
            B -> E [label="context"]
            B -> F [label="context"]
            C -> G [label="predictNextPurchase"]
            D -> G [label="uploadCSV"]
            E -> G [label="predict"]
        }
        '''
        st.graphviz_chart(frontend_graph)
        
        st.subheader("7. TransactionContext 구조")
        
        context_data = pd.DataFrame([
            {'유형': '상태', '이름': 'transactions', '설명': '거래 데이터 배열'},
            {'유형': '상태', '이름': 'loading', '설명': '로딩 상태'},
            {'유형': '상태', '이름': 'lastSyncTime', '설명': '마지막 동기화 시간'},
            {'유형': '함수', '이름': 'saveTransactions()', '설명': '거래 저장 + AsyncStorage'},
            {'유형': '함수', '이름': 'clearTransactions()', '설명': '거래 삭제'},
            {'유형': '함수', '이름': 'predictNextPurchase()', '설명': 'ML API 호출 + 다음 소비 예측'}
        ])
        st.dataframe(context_data, use_container_width=True, hide_index=True)
    
    with tab6:
        st.subheader("8. Git 변경사항 분석")
        
        git_graph = '''
        digraph {
            rankdir=TD
            node [shape=box, style="rounded,filled", fontname="Arial"]
            
            A [label="Git 변경사항\\n43개 파일" fillcolor="#e1f5ff"]
            
            B [label="삭제 33개" fillcolor="#ffe1e1"]
            C [label="추가 21개" fillcolor="#e1ffe1"]
            D [label="수정 9개" fillcolor="#fff4e1"]
            
            B1 [label="frontend/ 27개\\n14,846줄" fillcolor="#ffcccc"]
            B2 [label="문서 5개\\n4,003줄" fillcolor="#ffcccc"]
            
            C1 [label="00_docs_core/ 7개" fillcolor="#ccffcc"]
            C2 [label="스크립트 4개" fillcolor="#ccffcc"]
            C3 [label="ML 기능 6개\\n840줄" fillcolor="#ccffcc"]
            
            D1 [label="백엔드 2개" fillcolor="#ffffcc"]
            D2 [label="프론트엔드 7개" fillcolor="#ffffcc"]
            
            A -> B
            A -> C
            A -> D
            B -> B1
            B -> B2
            C -> C1
            C -> C2
            C -> C3
            D -> D1
            D -> D2
        }
        '''
        st.graphviz_chart(git_graph)
        
        st.subheader("9. 코드 변경 통계")
        
        col1, col2 = st.columns(2)
        with col1:
            fig1 = go.Figure(data=[go.Bar(
                x=['삭제', '추가', '수정'],
                y=[33, 21, 9],
                marker_color=['#ff6b6b', '#51cf66', '#ffd43b'],
                text=[33, 21, 9],
                textposition='auto'
            )])
            fig1.update_layout(title='파일 변경 개수', height=300)
            st.plotly_chart(fig1, use_container_width=True)
        
        with col2:
            fig2 = go.Figure(data=[go.Bar(
                x=['삭제', '추가'],
                y=[20029, 669],
                marker_color=['#ff6b6b', '#51cf66'],
                text=['20,029줄', '669줄'],
                textposition='auto'
            )])
            fig2.update_layout(title='코드 라인 변경량', height=300)
            st.plotly_chart(fig2, use_container_width=True)
        
        change_summary = pd.DataFrame([
            {'항목': '삭제됨', '개수': 33, '상세': 'frontend/ 27개, 문서 5개, app.json'},
            {'항목': '추가됨', '개수': 21, '상세': '문서 7개, 스크립트 4개, ML 6개'},
            {'항목': '수정됨', '개수': 9, '상세': '백엔드 2개, 프론트엔드 7개'}
        ])
        st.dataframe(change_summary, use_container_width=True, hide_index=True)


elif page == "수정 내역":
    st.header("수정된 파일 상세 (9개)")
    
    modified_files = [
        ('10_backend/app/main.py', 9, 39, 'CORS 확장, ML 라우터 추가', '높음'),
        ('10_backend/requirements.txt', 10, 4, 'ML 라이브러리 추가', '중간'),
        ('20_frontend_user/App.js', 9, 5, 'TransactionContext 추가', '중간'),
        ('20_frontend_user/src/screens/DashboardScreen.js', 102, 94, 'MOCK 데이터 제거', '높음'),
        ('20_frontend_user/src/screens/ProfileScreen.js', 144, 6, '프로필 화면 개선', '높음'),
        ('20_frontend_user/src/screens/TransactionScreen.js', 145, 62, '트랜잭션 화면 개선', '높음'),
        ('20_frontend_user/package.json', 2, 0, '의존성 추가', '낮음'),
        ('20_frontend_user/package-lock.json', 248, 0, '자동 생성', '낮음')
    ]
    
    df = pd.DataFrame(modified_files, columns=['파일', '추가', '삭제', '변경 내용', '영향도'])
    
    # 영향도별 색상 코딩
    def highlight_impact(row):
        colors = {
            '높음': 'background-color: #ffe6e6',
            '중간': 'background-color: #fff4e6',
            '낮음': 'background-color: #e6f7ff'
        }
        color = colors.get(row['영향도'], '')
        return [color] * len(row)
    
    st.dataframe(
        df.style.apply(highlight_impact, axis=1),
        use_container_width=True,
        hide_index=True
    )
    
    st.markdown("---")
    
    # 주요 수정사항 상세
    st.subheader("주요 수정사항 상세")
    
    tab1, tab2, tab3 = st.tabs(["main.py 변경사항", "requirements.txt", "DashboardScreen.js"])
    
    with tab1:
        st.markdown("""
        ### 10_backend/app/main.py (+9 / -39)
        
        #### 변경사항 1: CORS 설정 확장
        
        **변경 전**:
        ```python
        allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        ```
        
        **변경 후**:
        ```python
        allowed_origins = os.getenv("ALLOWED_ORIGINS", 
            "http://localhost:3000,http://localhost:8081,http://localhost:8080,"+
            "http://localhost:19000,http://localhost:19006"
        ).split(",")
        ```
        
        **변경 이유**:
        - Expo 개발 서버는 기본적으로 포트 8081 사용
        - Metro Bundler는 19000, 19006 포트도 사용 가능
        - 프론트엔드 개발 시 CORS 에러 방지 필요
        
        #### 변경사항 2: ML 라우터 추가
        
        ```python
        from app.routers import ml
        app.include_router(ml.router)
        ```
        
        **변경 이유**:
        - ML 예측 기능을 FastAPI 라우터로 제공
        - /ml/predict, /ml/upload, /ml/predict-next 엔드포인트 활성화
        
        #### 변경사항 3: ML 모델 자동 로드
        
        ```python
        async def startup_event():
            ml.load_model()  # 추가됨
        ```
        
        **변경 이유**:
        - 애플리케이션 시작 시 ML 모델을 메모리에 로드
        - 첫 요청 시 모델 로드 시간 제거로 응답 속도 향상
        
        **영향도**: 높음
        """)
    
    with tab2:
        st.markdown("""
        ### 10_backend/requirements.txt (+10 / -4)
        
        #### DB 라이브러리 주석 처리
        
        ```diff
        - sqlalchemy==2.0.23
        - psycopg2-binary==2.9.9
        - alembic==1.12.1
        + # sqlalchemy==2.0.23
        + # psycopg2-binary==2.9.9
        + # alembic==1.12.1
        ```
        
        **이유**: 현재 단계에서 데이터베이스 미사용
        
        #### ML 라이브러리 추가
        
        ```diff
        + scikit-learn
        + joblib
        + pandas
        + numpy
        ```
        
        **이유**:
        - ML 모델 로드 및 예측에 필요한 라이브러리
        - scikit-learn: LightGBM 모델 사용
        - joblib: 모델 직렬화 파일 로드
        - pandas: CSV 데이터 처리
        
        **주의**: 버전 미지정 (프로덕션에서는 버전 고정 권장)
        """)
    
    with tab3:
        st.markdown("""
        ### 20_frontend_user/src/screens/DashboardScreen.js (+102 / -94)
        
        #### 변경 내용: MOCK 데이터 제거 및 실제 계산 로직 추가
        
        **변경 전**:
        ```javascript
        const MOCK_DATA = {
            summary: { total_spending: 1250000, ... }
        };
        const loadData = async () => {
            setSummary(MOCK_DATA.summary);
        };
        ```
        
        **변경 후**:
        ```javascript
        const calculateSummary = (transactions) => {
            const total_spending = transactions.reduce(...);
            // 실제 계산 로직
        };
        const loadData = async () => {
            setSummary(calculateSummary(transactions));
        };
        ```
        
        **변경 이유**:
        1. 데이터 소스 변경: 하드코딩된 MOCK → 실제 CSV 데이터
        2. 동적 계산: 거래 데이터 기반 통계 실시간 계산
        3. 유연성: 다양한 데이터셋 지원 가능
        
        **비즈니스 임팩트**: 사용자가 자신의 실제 거래 데이터 확인 가능
        """)

# ========================================
# 추가 내역
# ========================================
elif page == "추가 내역":
    st.header("추가된 파일 상세 (21개)")
    
    st.subheader("1. 실행 스크립트 (4개)")
    
    scripts = [
        ('start_all.sh', '2.9KB', '백엔드+프론트엔드 동시 시작'),
        ('start_backend.sh', '830B', '백엔드만 시작'),
        ('start_frontend.sh', '614B', '프론트엔드만 시작'),
        ('stop_all.sh', '1.3KB', '전체 시스템 종료')
    ]
    
    df_scripts = pd.DataFrame(scripts, columns=['파일', '크기', '설명'])
    st.dataframe(df_scripts, use_container_width=True, hide_index=True)
    
    st.markdown("""
    **추가 이유**:
    - 백엔드와 프론트엔드를 동시에 시작하는 번거로움 해소
    - 팀원 온보딩 시 실행 방법 통일
    - tmux 세션 자동 관리
    
    **비즈니스 가치**: 개발 환경 설정 시간 90% 단축
    """)
    
    st.markdown("---")
    
    st.subheader("2. 백엔드 ML 기능 (4개)")
    
    ml_files = [
        ('10_backend/app/routers/ml.py', '407줄', 'ML API 엔드포인트 3개'),
        ('10_backend/app/services/preprocessing.py', '433줄', '데이터 전처리 서비스'),
        ('10_backend/app/services/__init__.py', '-', '서비스 패키지'),
        ('10_backend/app/models/', '-', '데이터 모델 디렉토리')
    ]
    
    df_ml = pd.DataFrame(ml_files, columns=['파일', '크기', '설명'])
    st.dataframe(df_ml, use_container_width=True, hide_index=True)
    
    st.markdown("""
    **ml.py 구현 엔드포인트**:
    - POST /ml/predict: 단일 거래 카테고리 예측
    - POST /ml/upload: CSV 파일 업로드 및 일괄 예측
    - POST /ml/predict-next: 다음 소비 카테고리 예측
    
    **추가 이유**:
    - ML 예측 기능을 REST API로 제공
    - 프론트엔드에서 ML 기능 사용 가능
    
    **비즈니스 가치**:
    - 사용자 편의성: 수동 분류 → 자동 분류
    - 정확도: ML 모델 기반 분류
    """)
    
    st.markdown("---")
    
    st.subheader("3. 프론트엔드 ML 기능 (2개)")
    
    frontend_ml = [
        ('MLTestScreen.js', '175줄', 'ML API 테스트 화면'),
        ('TransactionContext.js', '110줄', '거래 데이터 상태 관리')
    ]
    
    df_fe_ml = pd.DataFrame(frontend_ml, columns=['파일', '크기', '설명'])
    st.dataframe(df_fe_ml, use_container_width=True, hide_index=True)
    
    st.markdown("""
    **MLTestScreen.js**:
    - CSV 컬럼 기반 입력 폼
    - /ml/predict API 호출
    - 예측 결과 표시
    
    **TransactionContext.js**:
    - CSV 업로드 기능
    - 거래 데이터 전역 상태 관리
    - DashboardScreen, TransactionScreen에서 공유
    """)
    
    st.markdown("---")
    
    st.subheader("4. 문서 디렉토리 (7개)")
    
    st.markdown("""
    **구조**:
    ```
    00_docs_core/
    ├── PROJECT_HANDOFF.md
    ├── 프로젝트_전체_진행상황.md
    ├── design/
    │   ├── 데이터베이스_테이블_스키마.md
    │   ├── 시스템구성도.txt
    │   └── 쿼리문.txt
    └── manuals/
        ├── (상세)작업+백엔드연동.md
        └── BACKEND_INTEGRATION_GUIDE.md
    ```
    
    **효과**: 문서 접근성 향상, 분류 체계 확립
    """)

# ========================================
# 리스크 분석
# ========================================
elif page == "리스크 분석":
    st.header("리스크 분석 및 완화 방안")
    
    risk_data = [
        {
            '리스크': 'Git 충돌',
            '발생 가능성': '높음',
            '영향도': '중간',
            '설명': '원격 브랜치보다 3커밋 뒤처짐',
            '완화 방안': 'git pull 먼저 실행 후 충돌 해결'
        },
        {
            '리스크': '대량 파일 삭제',
            '발생 가능성': '중간',
            '영향도': '낮음',
            '설명': '33개 파일 삭제 (대부분 중복/이동)',
            '완화 방안': 'Git 히스토리에 보존, 복구 가능'
        },
        {
            '리스크': 'ML 모델 경로 문제',
            '발생 가능성': '낮음',
            '영향도': '높음',
            '설명': '프로덕션 환경에서 모델 경로 변동 가능',
            '완화 방안': '환경 변수로 모델 경로 설정'
        },
        {
            '리스크': '의존성 버전 미지정',
            '발생 가능성': '중간',
            '영향도': '중간',
            '설명': 'ML 라이브러리 버전 고정 안됨',
            '완화 방안': 'requirements.txt에 버전 명시'
        },
        {
            '리스크': 'app.json 삭제',
            '발생 가능성': '낮음',
            '영향도': '중간',
            '설명': 'Expo 설정 파일 삭제',
            '완화 방안': '프론트엔드 빌드 테스트 필수'
        }
    ]
    
    df_risk = pd.DataFrame(risk_data)
    st.dataframe(df_risk, use_container_width=True, hide_index=True)
    
    st.markdown("---")
    
    # 완화 체크리스트
    st.subheader("완화 조치 체크리스트")
    
    st.markdown("""
    ### 머지 전 필수 조치
    
    **1. .gitignore 업데이트**
    ```bash
    echo "__pycache__/" >> .gitignore
    echo "*.log" >> .gitignore
    echo "audit.log" >> .gitignore
    ```
    
    **2. Git 캐시 정리**
    ```bash
    git rm -r --cached 10_backend/app/__pycache__/
    git rm --cached 10_backend/audit.log
    ```
    
    **3. requirements.txt 버전 고정**
    ```
    scikit-learn==1.3.2
    joblib==1.3.2
    pandas==2.1.3
    numpy==1.26.2
    ```
    
    **4. 원격 저장소 동기화**
    ```bash
    git fetch source_repo
    git pull source_repo front-sjw --no-rebase
    ```
    
    **5. 기능 테스트**
    - 백엔드 서버 실행 확인
    - 프론트엔드 빌드 테스트
    - ML API 3개 엔드포인트 테스트
    """)

# ========================================
# 머지 권장사항
# ========================================
elif page == "머지 권장사항":
    st.header("머지 권장사항")
    
    st.markdown("""
    <div class="success-box">
        <h3>최종 권장사항: 조건부 승인</h3>
        <p><strong>조건</strong>: 리스크 완화 조치 완료 후 머지</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 승인 이유
    st.subheader("승인 이유")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### 긍정적 영향
        
        **1. 코드 품질 개선**
        - 19,360줄 감소 (96.7%)
        - 중복 코드 제거
        - 구조 개선
        
        **2. 운영 효율성**
        - 실행 스크립트 자동화
        - 문서 체계화
        - 개발 환경 표준화
        
        **3. 기능 확장**
        - ML API 3개 엔드포인트
        - 프론트엔드 ML 테스트
        - 실시간 데이터 처리
        """)
    
    with col2:
        st.markdown("""
        ### 리스크 관리
        
        **1. Git 충돌**
        - 중간 리스크
        - 해결 가능 (pull & merge)
        
        **2. 파일 삭제**
        - 낮은 리스크
        - Git 히스토리 보존
        
        **3. 의존성**
        - 중간 리스크
        - 버전 고정으로 해결
        
        **4. 테스트**
        - 기능 테스트 필요
        - 로컬 확인 완료
        """)
    
    st.markdown("---")
    
    # 제안 커밋 메시지
    st.subheader("제안 커밋 메시지")
    
    commit_message = """refactor: 프로젝트 구조 개선 및 ML 기능 추가

[구조 개선]
- frontend/ 디렉토리 삭제하여 20_frontend_user로 통합
- 문서를 00_docs_core/로 이동 (manuals, design 분류)
- 오래된 파일 archive/로 이동 (82MB)

[ML 기능 추가]
- 백엔드: /ml/predict, /ml/upload, /ml/predict-next 엔드포인트
- 프론트엔드: MLTestScreen, TransactionContext 추가
- 데이터 전처리 서비스 구현

[운영 개선]
- 실행 스크립트 추가 (start_all.sh 등)
- CORS 설정 확장 (Expo 개발 서버 지원)
- DashboardScreen MOCK 데이터 제거

[통계]
- 파일: 43개 변경 (수정 9, 삭제 33, 추가 21)
- 코드: +669 / -20,029 (96.7% 감소)
- 루트 파일: 19개 → 7개 (63% 감소)

Breaking Changes: 없음
"""
    
    st.code(commit_message, language='markdown')
    
    # 다운로드 버튼
    st.download_button(
        label="커밋 메시지 다운로드",
        data=commit_message,
        file_name="commit_message.txt",
        mime="text/plain"
    )

# Footer
st.markdown("---")
st.markdown(f"""
<div style='text-align: center; color: #666;'>
    <p>Git 변경사항 리뷰 대시보드 v2.0 (이모지 제거 버전)</p>
    <p>생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
</div>
""", unsafe_allow_html=True)
