"""
Git 변경사항 리뷰 대시보드 (회사 리뷰용) - Mermaid 간소화 버전
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

# ... (CSS 및 데이터 정의는 동일) ...

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

# 프로젝트 구조 페이지 (간소화 버전)
if page == "프로젝트 구조":
    st.header("프로젝트 구조 시각화")
    
    try:
        from streamlit_mermaid import st_mermaid
        
        st.info("Mermaid 다이어그램으로 프로젝트 구조를 시각화합니다. 각 탭에서 다른 관점의 구조를 확인하세요.")
        
        # 탭으로 구분
        tab1, tab2, tab3 = st.tabs([
            "시스템 아키텍처",
            "데이터 흐름",
            "변경사항 분석"
        ])
        
        with tab1:
            st.subheader("1. 전체 시스템 아키텍처")
            st_mermaid("""
graph TD
    A[Frontend React Native] -->|HTTP API| B[Backend FastAPI]
    B --> C[ML Router]
    C --> D[Preprocessing Service]
    C --> E[ML Model LightGBM]
    D --> E
    A -->|Cache| F[AsyncStorage]
    B -->|Load| G[CSV Files]
    
    style A fill:#e1f5ff
    style B fill:#ffe1e1
    style C fill:#fff4e1
    style E fill:#e1ffe1
            """, height=400)
            
            st.subheader("2. ML API 엔드포인트")
            st_mermaid("""
graph LR
    A[POST /ml/predict] --> D[Single Prediction]
    B[POST /ml/upload] --> E[Batch Prediction]
    C[POST /ml/predict-next] --> F[Next Purchase Prediction]
    
    D --> G[JSON Response]
    E --> G
    F --> G
    
    style A fill:#e1f5ff
    style B fill:#e1ffe1
    style C fill:#fff4e1
            """, height=300)
        
        with tab2:
            st.subheader("3. 데이터 흐름")
            st_mermaid("""
sequenceDiagram
    participant User
    participant TransactionScreen
    participant TransactionContext
    participant Backend
    participant MLModel
    participant Dashboard
    
    User->>TransactionScreen: Upload CSV
    TransactionScreen->>Backend: POST /ml/upload
    Backend->>MLModel: Preprocess and Predict
    MLModel-->>Backend: Predictions
    Backend-->>TransactionScreen: Results with AI Categories
    TransactionScreen->>TransactionContext: saveTransactions
    TransactionContext->>Dashboard: Auto Update
    
    TransactionContext->>Backend: POST /ml/predict-next
    Backend->>MLModel: Predict Next Category
    MLModel-->>Backend: Category with Confidence
    Backend-->>Dashboard: Display Prediction
            """, height=500)
            
            st.subheader("4. Context API 패턴")
            st_mermaid("""
graph TD
    A[TransactionContext] --> B[Provider]
    B --> C[DashboardScreen]
    B --> D[TransactionScreen]
    B --> E[MLTestScreen]
    
    C -->|useTransactions| B
    D -->|useTransactions| B
    E -->|useTransactions| B
    
    style A fill:#e1f5ff
    style B fill:#ffe1e1
    style C fill:#fff4e1
            """, height=400)
        
        with tab3:
            st.subheader("5. Git 변경사항")
            st_mermaid("""
graph TD
    A[Git Changes 43 files] --> B[Deleted 33]
    A --> C[Added 21]
    A --> D[Modified 9]
    
    B --> B1[frontend/ 27 files]
    B --> B2[docs 5 files]
    
    C --> C1[00_docs_core/ 7 files]
    C --> C2[scripts 4 files]
    C --> C3[ML backend 4 files]
    C --> C4[ML frontend 2 files]
    
    D --> D1[backend 2 files]
    D --> D2[frontend 7 files]
    
    style B fill:#ffe1e1
    style C fill:#e1ffe1
    style D fill:#fff4e1
            """, height=500)
            
            st.subheader("6. 디렉토리 정리")
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("""
                **Before (19개 파일)**:
                - 문서 7개 (산재)
                - 데이터 3개
                - frontend/ (중복)
                - 기타 6개
                """)
            
            with col2:
                st.markdown("""
                **After (7개 파일)**:
                - README.md
                - docker-compose.yml
                - .gitignore
                - start_all.sh
                - start_backend.sh
                - start_frontend.sh
                - stop_all.sh
                """)
        
        st.success("모든 다이어그램이 로드되었습니다!")
        
        # 추가 정보
        with st.expander("더 자세한 구조 보기"):
            st.markdown("""
            ### 백엔드 모듈 의존성
            - main.py → ML Router
            - ML Router → Preprocessing Service
            - Preprocessing Service → ML Model
            
            ### 프론트엔드 컴포넌트
            - App.js wraps TransactionProvider
            - All screens use TransactionContext
            - DashboardScreen auto-calls predictNextPurchase
            
            ### ML 파이프라인
            1. CSV Upload
            2. UTF-8/CP949 Encoding Detection
            3. Data Preprocessing
            4. Feature Engineering
            5. ML Model Prediction
            6. Category Mapping
            7. JSON Response
            """)
        
    except ImportError:
        st.error("streamlit-mermaid 라이브러리가 필요합니다: pip install streamlit-mermaid")
    except Exception as e:
        st.error(f"다이어그램 렌더링 오류: {str(e)}")
        st.markdown("""
        **대체 정보**:
        
        프로젝트 구조는 `/root/caffeine/PROJECT_VISUALIZATION.md` 파일에서 확인할 수 있습니다.
        
        주요 구조:
        - Frontend (React Native) ↔ Backend (FastAPI) ↔ ML Model (LightGBM)
        - 3개 ML API: /predict, /upload, /predict-next
        - TransactionContext로 전역 상태 관리
        - AsyncStorage로 로컬 캐싱
        """)
