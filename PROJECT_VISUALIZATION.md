# 프로젝트 구조 시각화

## 1. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "클라이언트"
        A[20_frontend_user<br/>React Native Expo]
        B[21_frontend_admin<br/>관리자 인터페이스]
    end
    
    subgraph "백엔드 서버"
        C[10_backend<br/>FastAPI]
        D[ML 라우터<br/>ml.py]
        E[전처리 서비스<br/>preprocessing.py]
    end
    
    subgraph "ML 모델"
        F[Production Models<br/>LightGBM]
    end
    
    subgraph "데이터 저장"
        G[AsyncStorage<br/>로컬 캐시]
        H[CSV 파일<br/>사용자 데이터]
    end
    
    subgraph "문서"
        I[00_docs_core<br/>프로젝트 문서]
    end
    
    A -->|HTTP API| C
    B -->|HTTP API| C
    C -->|라우팅| D
    D -->|전처리 요청| E
    D -->|모델 로드| F
    E -->|예측 요청| F
    A -->|CSV 업로드| D
    A -->|데이터 캐싱| G
    D -->|CSV 읽기| H
    
    style A fill:#e1f5ff
    style C fill:#ffe1e1
    style D fill:#fff4e1
    style F fill:#e1ffe1
```

## 2. 프론트엔드 데이터 흐름

```mermaid
sequenceDiagram
    participant U as 사용자
    participant TS as TransactionScreen
    participant TC as TransactionContext
    participant API as 백엔드 API
    participant ML as ML 모델
    participant DS as DashboardScreen
    
    U->>TS: CSV 파일 선택
    TS->>API: POST /ml/upload
    API->>ML: 전처리 + 예측
    ML-->>API: 예측 결과
    API-->>TS: 거래 데이터 + AI 카테고리
    TS->>TC: saveTransactions()
    TC->>TC: AsyncStorage 저장
    
    Note over TC,DS: 자동 동기화
    
    TC->>API: POST /ml/predict-next
    API->>ML: 다음 소비 예측
    ML-->>API: 예측 카테고리 + 신뢰도
    API-->>TC: 예측 결과
    TC->>DS: 상태 업데이트
    DS->>U: 대시보드 표시<br/>+ 다음 소비 예측
```

## 3. 디렉토리 구조 (계층형)

```mermaid
graph TD
    ROOT[/root/caffeine]
    
    ROOT --> DOC[00_docs_core/]
    ROOT --> BE[10_backend/]
    ROOT --> FE[20_frontend_user/]
    ROOT --> ARCH[archive/]
    ROOT --> MODEL[production_models/]
    ROOT --> SCRIPT[실행 스크립트]
    
    DOC --> DOC_D[design/]
    DOC --> DOC_M[manuals/]
    DOC --> DOC_F[PROJECT_HANDOFF.md<br/>프로젝트_전체_진행상황.md]
    
    DOC_D --> DOC_D_F[데이터베이스_테이블_스키마.md<br/>시스템구성도.txt<br/>쿼리문.txt]
    DOC_M --> DOC_M_F[작업+백엔드연동.md<br/>BACKEND_INTEGRATION_GUIDE.md]
    
    BE --> BE_APP[app/]
    BE --> BE_REQ[requirements.txt]
    
    BE_APP --> BE_MAIN[main.py]
    BE_APP --> BE_ROUTER[routers/]
    BE_APP --> BE_SERVICE[services/]
    BE_APP --> BE_MODEL[models/]
    
    BE_ROUTER --> BE_ML[ml.py<br/>407줄]
    BE_SERVICE --> BE_PREP[preprocessing.py<br/>433줄]
    
    FE --> FE_SRC[src/]
    FE --> FE_APP[App.js]
    FE --> FE_PKG[package.json]
    
    FE_SRC --> FE_CTX[contexts/]
    FE_SRC --> FE_SCR[screens/]
    FE_SRC --> FE_COMP[components/]
    
    FE_CTX --> FE_TC[TransactionContext.js<br/>110줄]
    FE_SCR --> FE_DASH[DashboardScreen.js<br/>808줄]
    FE_SCR --> FE_TRANS[TransactionScreen.js]
    FE_SCR --> FE_ML[MLTestScreen.js<br/>175줄]
    
    ARCH --> ARCH_F[1년치가계부.csv<br/>old_model.joblib 82MB<br/>metadata.json]
    MODEL --> MODEL_F[lightgbm_model.joblib<br/>25MB]
    SCRIPT --> SCRIPT_F[start_all.sh<br/>start_backend.sh<br/>start_frontend.sh<br/>stop_all.sh]
    
    style ROOT fill:#e1f5ff
    style BE fill:#ffe1e1
    style FE fill:#e1ffe1
    style DOC fill:#fff4e1
    style MODEL fill:#ffe1ff
```

## 4. ML API 엔드포인트 구조

```mermaid
graph LR
    subgraph "클라이언트 요청"
        A1[단일 거래 예측]
        A2[CSV 업로드]
        A3[다음 소비 예측]
    end
    
    subgraph "API 엔드포인트"
        B1[POST /ml/predict]
        B2[POST /ml/upload]
        B3[POST /ml/predict-next]
    end
    
    subgraph "처리 과정"
        C1[데이터 검증]
        C2[전처리]
        C3[모델 예측]
        C4[결과 변환]
    end
    
    subgraph "응답"
        D1[{prediction: 카테고리}]
        D2[{transactions: [...],<br/>summary: {...}}]
        D3[{predicted_category: 외식,<br/>confidence: 0.85,<br/>probabilities: {...}}]
    end
    
    A1 --> B1 --> C1 --> C2 --> C3 --> C4 --> D1
    A2 --> B2 --> C1 --> C2 --> C3 --> C4 --> D2
    A3 --> B3 --> C1 --> C2 --> C3 --> C4 --> D3
    
    style B1 fill:#e1f5ff
    style B2 fill:#e1ffe1
    style B3 fill:#fff4e1
```

## 5. 변경사항 요약 (파이 차트 개념)

```mermaid
pie title "변경된 파일 분포 (43개)"
    "삭제됨" : 33
    "추가됨" : 21
    "수정됨" : 9
```

```mermaid
pie title "코드 라인 변경 분포"
    "삭제된 코드" : 20029
    "추가된 코드" : 669
```

## 6. Git 변경사항 분석

```mermaid
graph TD
    A[Git 변경사항<br/>43개 파일]
    
    A --> B[삭제 33개]
    A --> C[추가 21개]
    A --> D[수정 9개]
    
    B --> B1[frontend/ 27개<br/>14,846줄]
    B --> B2[문서 5개<br/>4,003줄]
    B --> B3[app.json 1개<br/>29줄]
    
    C --> C1[문서 7개<br/>00_docs_core/]
    C --> C2[스크립트 4개<br/>start_*.sh]
    C --> C3[백엔드 ML 4개<br/>840줄]
    C --> C4[프론트엔드 ML 2개<br/>285줄]
    C --> C5[기타 4개]
    
    D --> D1[백엔드 2개<br/>main.py, requirements.txt]
    D --> D2[프론트엔드 7개<br/>App.js, screens/]
    
    style B fill:#ffe1e1
    style C fill:#e1ffe1
    style D fill:#fff4e1
```

## 7. 백엔드 모듈 의존성

```mermaid
graph TD
    A[main.py]
    B[routers/ml.py]
    C[services/preprocessing.py]
    D[Production Models]
    
    A -->|include_router| B
    A -->|startup_event| E[load_model]
    B -->|import| C
    B -->|import| E
    E -->|load| D
    C -->|use| F[pandas, scikit-learn]
    B -->|predict| D
    
    style A fill:#e1f5ff
    style B fill:#ffe1e1
    style C fill:#fff4e1
    style D fill:#e1ffe1
```

## 8. 프론트엔드 컴포넌트 관계

```mermaid
graph TD
    A[App.js]
    B[TransactionProvider]
    C[DashboardScreen]
    D[TransactionScreen]
    E[MLTestScreen]
    F[ProfileScreen]
    
    A -->|wrap| B
    B -->|provide context| C
    B -->|provide context| D
    B -->|provide context| E
    B -->|provide context| F
    
    C -->|useTransactions| B
    D -->|useTransactions| B
    E -->|useTransactions| B
    
    C -->|predictNextPurchase| G[ML API]
    D -->|uploadCSV| G
    E -->|predict| G
    
    style A fill:#e1f5ff
    style B fill:#ffe1e1
    style C fill:#fff4e1
    style D fill:#e1ffe1
```

## 9. 데이터 동기화 흐름

```mermaid
stateDiagram-v2
    [*] --> 앱시작
    앱시작 --> 캐시로드: loadCachedTransactions()
    캐시로드 --> 캐시있음: AsyncStorage 확인
    캐시로드 --> 캐시없음: 데이터 없음
    
    캐시있음 --> 화면표시: transactions 상태 업데이트
    캐시없음 --> 대기중: 빈 상태
    
    대기중 --> CSV업로드: 사용자 액션
    CSV업로드 --> API호출: POST /ml/upload
    API호출 --> 예측완료: ML 예측 수행
    예측완료 --> 저장: saveTransactions()
    저장 --> AsyncStorage저장
    AsyncStorage저장 --> 화면표시
    
    화면표시 --> 자동예측: loadNextPrediction()
    자동예측 --> API호출2: POST /ml/predict-next
    API호출2 --> 예측결과: 다음 소비 카테고리
    예측결과 --> 화면업데이트: Dashboard 리렌더링
    
    화면업데이트 --> [*]
```

## 10. 실행 스크립트 흐름

```mermaid
flowchart TD
    A[start_all.sh 실행]
    B{tmux 설치?}
    C[tmux 세션 생성]
    D[백그라운드 실행]
    
    E[윈도우 0: 백엔드]
    F[윈도우 1: 프론트엔드]
    
    G[start_backend.sh]
    H[start_frontend.sh]
    
    I[venv 활성화]
    J[의존성 설치]
    K[uvicorn 서버 시작]
    
    L[node_modules 확인]
    M[npm install]
    N[expo start]
    
    A --> B
    B -->|Yes| C
    B -->|No| D
    
    C --> E
    C --> F
    D --> G
    D --> H
    
    E --> G
    F --> H
    
    G --> I --> J --> K
    H --> L --> M --> N
    
    K --> O[localhost:8000]
    N --> P[localhost:8081]
    
    style A fill:#e1f5ff
    style K fill:#ffe1e1
    style N fill:#e1ffe1
```

## 11. 파일 이동 맵

```mermaid
graph LR
    subgraph "Before (루트)"
        A1[작업+백엔드연동.md]
        A2[BACKEND_INTEGRATION_GUIDE.md]
        A3[PROJECT_HANDOFF.md]
        A4[데이터베이스_테이블_스키마.md]
        A5[프로젝트_전체_진행상황.md]
    end
    
    subgraph "After (00_docs_core/)"
        B1[manuals/작업+백엔드연동.md]
        B2[manuals/BACKEND_INTEGRATION_GUIDE.md]
        B3[PROJECT_HANDOFF.md]
        B4[design/데이터베이스_테이블_스키마.md]
        B5[프로젝트_전체_진행상황.md]
    end
    
    A1 -.이동.-> B1
    A2 -.이동.-> B2
    A3 -.이동.-> B3
    A4 -.이동.-> B4
    A5 -.이동.-> B5
    
    style A1 fill:#ffe1e1
    style A2 fill:#ffe1e1
    style A3 fill:#ffe1e1
    style A4 fill:#ffe1e1
    style A5 fill:#ffe1e1
    style B1 fill:#e1ffe1
    style B2 fill:#e1ffe1
    style B3 fill:#e1ffe1
    style B4 fill:#e1ffe1
    style B5 fill:#e1ffe1
```

## 12. Context API 패턴

```mermaid
graph TD
    A[TransactionContext.js]
    B[createContext]
    C[TransactionProvider]
    D[useTransactions Hook]
    
    E[상태]
    F[transactions]
    G[loading]
    H[lastSyncTime]
    
    I[함수]
    J[saveTransactions]
    K[updateTransactionNote]
    L[clearTransactions]
    M[predictNextPurchase]
    
    N[컴포넌트들]
    O[DashboardScreen]
    P[TransactionScreen]
    Q[MLTestScreen]
    
    A --> B
    B --> C
    C --> E
    C --> I
    
    E --> F
    E --> G
    E --> H
    
    I --> J
    I --> K
    I --> L
    I --> M
    
    C --> D
    D --> N
    N --> O
    N --> P
    N --> Q
    
    style C fill:#e1f5ff
    style E fill:#ffe1e1
    style I fill:#fff4e1
    style N fill:#e1ffe1
```

## 13. 루트 디렉토리 정리 Before/After

```mermaid
graph TD
    subgraph "Before: 19개 파일"
        A1[문서 7개]
        A2[데이터 3개]
        A3[frontend/]
        A4[20_frontend_user/]
        A5[기타 6개]
    end
    
    B[정리 과정]
    
    subgraph "After: 7개 파일"
        C1[README.md]
        C2[docker-compose.yml]
        C3[.gitignore]
        C4[start_all.sh]
        C5[start_backend.sh]
        C6[start_frontend.sh]
        C7[stop_all.sh]
    end
    
    A1 -.이동.-> D[00_docs_core/]
    A2 -.이동.-> E[archive/]
    A3 -.삭제.-> F[Git 히스토리]
    
    A1 --> B
    A2 --> B
    A3 --> B
    
    B --> C1
    B --> C2
    B --> C3
    B --> C4
    B --> C5
    B --> C6
    B --> C7
    
    style A1 fill:#ffe1e1
    style A2 fill:#ffe1e1
    style A3 fill:#ffe1e1
    style C1 fill:#e1ffe1
    style C4 fill:#fff4e1
```

## 14. ML 예측 파이프라인

```mermaid
flowchart LR
    A[원본 CSV] --> B[데이터 로드]
    B --> C{인코딩 확인}
    C -->|UTF-8| D[DataFrame 생성]
    C -->|CP949| D
    
    D --> E[전처리]
    E --> F[Feature Engineering]
    F --> G[인코딩]
    G --> H[스케일링]
    
    H --> I[ML 모델]
    I --> J{예측 타입}
    
    J -->|단일| K[카테고리 반환]
    J -->|일괄| L[전체 거래 + 카테고리]
    J -->|다음| M[카테고리 + 신뢰도 + 확률]
    
    K --> N[JSON 응답]
    L --> N
    M --> N
    
    style A fill:#e1f5ff
    style E fill:#ffe1e1
    style I fill:#fff4e1
    style N fill:#e1ffe1
```

## 15. 변경사항 타임라인

```mermaid
gantt
    title Git 변경사항 구현 순서
    dateFormat YYYY-MM-DD
    
    section 구조 정리
    frontend/ 삭제           :done, 2024-12-01, 1d
    문서 이동 (00_docs_core/) :done, 2024-12-01, 1d
    archive/ 생성            :done, 2024-12-01, 1d
    
    section 백엔드
    requirements.txt 수정    :done, 2024-12-02, 1d
    main.py CORS 확장        :done, 2024-12-02, 1d
    ml.py 생성 (407줄)       :done, 2024-12-03, 2d
    preprocessing.py (433줄) :done, 2024-12-03, 2d
    
    section 프론트엔드
    TransactionContext 생성   :done, 2024-12-05, 1d
    MLTestScreen 추가         :done, 2024-12-05, 1d
    DashboardScreen MOCK 제거 :done, 2024-12-06, 1d
    ProfileScreen 개선        :done, 2024-12-06, 1d
    TransactionScreen 개선    :done, 2024-12-06, 1d
    
    section 운영
    start_all.sh 생성        :done, 2024-12-07, 1d
    stop_all.sh 생성         :done, 2024-12-07, 1d
```

## 요약

총 15개의 시각화로 프로젝트 구조를 다각도로 표현했습니다:

1. **시스템 아키텍처**: 전체 시스템 구성요소 관계
2. **데이터 흐름**: 프론트엔드 → 백엔드 → ML 순서도
3. **디렉토리 구조**: 계층형 폴더 트리
4. **ML API**: 3개 엔드포인트 구조
5. **변경 분포**: 파일 및 코드라인 통계
6. **Git 분석**: 삭제/추가/수정 분류
7. **모듈 의존성**: 백엔드 컴포넌트 관계
8. **컴포넌트 관계**: 프론트엔드 구조
9. **동기화 흐름**: 상태 머신
10. **실행 흐름**: 스크립트 로직
11. **파일 이동**: Before/After 매핑
12. **Context 패턴**: React Context 구조
13. **루트 정리**: 파일 개수 변화
14. **ML 파이프라인**: 예측 프로세스
15. **타임라인**: 구현 순서
