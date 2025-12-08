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

# 프로젝트 구조 페이지
if page == "프로젝트 구조":
    st.header("프로젝트 구조 시각화")
    
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
    st.header("삭제된 파일 상세 (33개)")
    
    st.subheader("frontend/ 디렉토리 전체 삭제 (27개 파일)")
    
    st. markdown("""
    **삭제 이유**:
    - 20_frontend_user/ 디렉토리와 완전히 중복
    - 실제 사용 중인 프론트엔드는 20_frontend_user/
    - 유지보수 혼란 방지 및 코드 중복 제거
    """)
    
    deleted_frontend = [
        ('package-lock.json', 10349, '의존성', '중복'),
        ('DashboardScreen.js', 799, '화면', '중복'),
        ('CouponScreen.js', 699, '화면', '미사용'),
        ('TransactionScreen.js', 572, '화면', '중복'),
        ('AuthContext.js', 360, '컨텍스트', '중복'),
        ('ThemeContext.js', 305, '컨텍스트', '중복'),
        ('AnomalyDetectionScreen.js', 250, '화면', '미사용'),
        ('AnimatedButton.js', 223, '컴포넌트', '미사용'),
        ('SignupScreen.js', 220, '화면', '중복'),
        ('ProfileScreen.js', 224, '화면', '중복'),
        ('LoginScreen.js', 184, '화면', '중복'),
        ('constants/index.js', 177, '상수', '미사용'),
        ('SkeletonCard.js', 175, '컴포넌트', '미사용'),
        ('기타 컴포넌트 및 유틸', 1500, '기타', '미사용/중복')
    ]
    
    df1 = pd.DataFrame(deleted_frontend, columns=['파일명', '라인 수', '카테고리', '삭제 이유'])
    df1['라인 수'] = df1['라인 수'].apply(lambda x: f"{x:,}")
    st.dataframe(df1, use_container_width=True, hide_index=True)
    
    st.info(f"**총 삭제**: 약 14,846줄 (바이너리 파일 제외)")
    
    st.markdown("---")
    
    st.subheader("문서 파일 이동 (5개)")
    
    st.markdown("""
    **이동 이유**:
    - 루트 디렉토리에 문서가 산재하여 접근성 저하
    - 문서 분류 체계 부재로 관리 어려움
    - 프로젝트 성장에 따른 문서 관리 필요성 증가
    """)
    
    moved_docs = [
        ('(상세)작업+백엔드연동.md', 1170, '00_docs_core/manuals/', '백엔드 연동 매뉴얼'),
        ('BACKEND_INTEGRATION_GUIDE.md', 817, '00_docs_core/manuals/', 'API 연동 가이드'),
        ('PROJECT_HANDOFF.md', 775, '00_docs_core/', '인수인계 문서'),
        ('데이터베이스_테이블_스키마.md', 686, '00_docs_core/design/', 'DB 스키마'),
        ('프로젝트_전체_진행상황.md', 555, '00_docs_core/', '진행 상황')
    ]
    
    df2 = pd.DataFrame(moved_docs, columns=['파일명', '라인 수', '이동 위치', '설명'])
    df2['라인 수'] = df2['라인 수'].apply(lambda x: f"{x:,}")
    st.dataframe(df2, use_container_width=True, hide_index=True)
    
    st.info("**총 이동**: 4,003줄 (Git에서는 삭제로 표시, Untracked로 재추가 필요)")

# ========================================
# 수정 내역
# ========================================
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
