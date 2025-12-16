#  코드 리뷰 결과 - 1단계: 백엔드 ML API

**리뷰 일시**: 2025년 12월 12일  
**리뷰 대상**: `10_backend/app/routers/ml.py`, `preprocessing.py`, `main.py`  
**리뷰어**: AI Code Reviewer

---

##  1. `10_backend/app/routers/ml.py` (401줄)

**전체 평가**:  **수정 필요** (양호하나 몇 가지 개선점 존재)

###  잘된 점
1. **명확한 API 구조**: `/ml/predict`, `/ml/upload`, `/ml/predict-next` 3개의 엔드포인트로 깔끔하게 분리
2. **한글 인코딩 처리**: UTF-8  CP949 폴백 로직 (L132-135) - 한국어 CSV 호환성 확보
3. **상세한 docstring**: 각 엔드포인트의 역할, 처리 과정, 반환값을 명확히 문서화
4. **신뢰도 메트릭**: `calculate_confidence_metrics()` 함수로 예측 신뢰도 제공 (L224-246)
5. **프론트엔드 친화적 응답**: `transactions_formatted` 형태로 변환하여 UI에서 바로 사용 가능

###  개선 필요 사항

####  높음 (High Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L20-21** | 모델을 전역 변수로 관리 | 싱글톤 패턴 또는 FastAPI dependency injection 사용 권장 |
| **L84-87, L156-163, L305-308, L340-343** | `category_map` 4곳에 중복 정의 | 상수로 분리하여 한 곳에서 관리 |
| **L98-100** | import가 파일 중간에 위치 | 파일 상단으로 이동 (PEP8 위반) |

```python
#  현재 (L84-87)
category_map = {
    0: '교통', 1: '생활', 2: '쇼핑', 
    3: '식료품', 4: '외식', 5: '주유'
}

#  권장: 파일 상단에 상수로 정의
CATEGORY_MAP = {
    0: '교통', 1: '생활', 2: '쇼핑', 
    3: '식료품', 4: '외식', 5: '주유'
}
```

####  보통 (Medium Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L12** | 로깅 레벨이 WARNING으로 고정 | 환경변수로 제어 가능하게 변경 |
| **L66** | `get_preprocessor()` 호출 전 import 없음 | L100에서 import하지만 순서 혼란 |
| **L222** | `import numpy as np`가 파일 중간에 위치 | 파일 상단으로 이동 |

####  낮음 (Low Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L47** | 주석 "main.py에서 호출 예정"이 구현 완료 후에도 남아있음 | 주석 업데이트 또는 제거 |
| **L359** | `preprocessor_temp` 변수명이 의도 불명확 | `stats_preprocessor` 등으로 명명 |

###  코드 품질 체크리스트

- [x] 에러 핸들링: HTTPException으로 적절히 처리
- [x] 입력값 검증: Pydantic BaseModel 사용
- [ ] 로깅: WARNING 레벨 고정 (유연성 부족)
- [ ] DRY 원칙: category_map 중복 (위반)
- [x] 타입 힌트: Dict, Any 등 사용

---

##  2. `10_backend/app/services/preprocessing.py` (466줄)

**전체 평가**:  **승인** (양호한 구현)

###  잘된 점
1. **싱글톤 패턴**: `get_preprocessor()` 함수로 인스턴스 재사용 (L458-465)
2. **상세한 클래스 문서화**: 클래스와 메서드에 대한 명확한 docstring
3. **유연한 메타데이터 지원**: XGBoost와 LightGBM 형식 모두 지원 (L50-59)
4. **피처 엔지니어링**: 27개 파생변수 생성 로직 체계적 구현 (L306-425)
5. **다음 거래 예측용 별도 메서드**: `preprocess_for_next_prediction()` 분리

###  개선 필요 사항

####  보통 (Medium Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L156-160, L251-255, L386-388** | `category_map` 중복 정의 | 클래스 상수로 분리 |
| **L293** | 날짜+시간 병합 시 오류 가능성 | try-except로 예외 처리 추가 |
| **L361** | `np.isnan()` 대신 `pd.isna()` 권장 | pandas 일관성 유지 |

```python
#  현재 (L293)
df['CreateDate'] = pd.to_datetime(df['날짜'] + ' ' + df['시간'])

#  권장: 예외 처리 추가
try:
    df['CreateDate'] = pd.to_datetime(df['날짜'] + ' ' + df['시간'], errors='coerce')
except Exception as e:
    raise ValueError(f"날짜/시간 변환 실패: {e}")
```

####  낮음 (Low Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L453** | 주석 처리된 Warning 출력 | 로거 사용으로 변경 |
| **L161** | 원본 DataFrame 직접 수정 (`df['category_encoded']`) | 복사본에서 작업 권장 |

###  코드 품질 체크리스트

- [x] 싱글톤 패턴: 효율적 메모리 관리
- [x] 메타데이터 기반: JSON 설정 파일 활용
- [x] 타입 힌트: 명확한 타입 정의
- [ ] DRY 원칙: category_map 중복 (위반)
- [x] 확장성: XGBoost/LightGBM 모두 지원

---

##  3. `10_backend/app/main.py` (260줄)

**전체 평가**:  **승인** (우수한 구현)

###  잘된 점
1. **보안 미들웨어**: 보안 헤더 추가 (L100-114)
2. **Rate Limiting**: slowapi를 활용한 API 요청 제한 (L57-77)
3. **CORS 설정**: 환경변수 기반 유연한 도메인 설정 (L83-93)
4. **Audit 로그**: 모든 요청/응답 로깅 (L121-149)
5. **명확한 문서화**: 각 섹션별 상세 주석과 v2.0 로드맵 포함
6. **시작 시 모델 로드**: `startup_event`에서 ML 모델 사전 로드 (L224)

###  개선 필요 사항

####  보통 (Medium Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L49** | `audit.log` 경로가 상대 경로 | 절대 경로 또는 환경변수로 설정 권장 |
| **L213, L228** | `@app.on_event`가 deprecated 예정 | `lifespan` context manager로 마이그레이션 권장 (FastAPI 0.109+) |

```python
#  현재 (deprecated 예정)
@app.on_event("startup")
async def startup_event():
    ...

#  권장: lifespan 사용 (FastAPI 0.109+)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(" Caffeine API 시작됨")
    ml.load_model()
    yield
    # Shutdown
    logger.info(" Caffeine API 종료됨")

app = FastAPI(lifespan=lifespan, ...)
```

####  낮음 (Low Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L85** | ALLOWED_ORIGINS 기본값이 너무 김 | 개발용과 운영용 분리 권장 |

###  코드 품질 체크리스트

- [x] 보안: Rate Limiting, CORS, 보안 헤더 적용
- [x] 로깅: Audit 로그 미들웨어 구현
- [x] 문서화: Swagger/ReDoc 자동 생성
- [x] 환경 분리: dotenv 사용
- [ ] 최신 패턴: on_event 대신 lifespan 권장

---

##  4. `requirements.txt` (32줄)

**전체 평가**:  **승인**

###  잘된 점
1. **명확한 섹션 구분**: 주석으로 카테고리 분류
2. **버전 고정**: 주요 패키지 버전 명시
3. **XGBoost 포함**: ML 모델에 필요한 의존성 명시

###  경미한 개선 사항

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L28** | xgboost>=2.0.0  2.1.x에서 breaking change 가능 | `xgboost>=2.0.0,<3.0.0` 권장 |

---

##  1단계 종합 요약

| 파일 | 결과 | 주요 이슈 |
|-----|------|----------|
| `ml.py` |  수정 필요 | category_map 중복, import 위치 |
| `preprocessing.py` |  승인 | category_map 중복 (경미) |
| `main.py` |  승인 | on_event deprecated 예정 |
| `requirements.txt` |  승인 | 버전 범위 제한 권장 |

###  우선 수정 권장 사항 (Top 3)

1. **`ml.py`**: `CATEGORY_MAP` 상수로 통합 (4곳 중복 제거)
2. **`ml.py`**: import문을 파일 상단으로 이동
3. **`main.py`**: `lifespan` 패턴으로 마이그레이션 준비

---

---

#  코드 리뷰 결과 - 2단계: 프론트엔드 사용자앱

**리뷰 일시**: 2025년 12월 12일  
**리뷰 대상**: `20_frontend_user/src/` 핵심 파일들  
**리뷰어**: AI Code Reviewer

---

##  1. `MLTestScreen.js` (176줄)

**전체 평가**:  **수정 필요**

###  잘된 점
1. **깔끔한 폼 구조**: Object.keys로 동적 폼 렌더링 (L61-71)
2. **로딩 상태 관리**: loading 상태로 버튼 비활성화 (L75-80)
3. **에러 핸들링**: API 에러 메시지를 Alert로 표시 (L49-50)
4. **스타일 분리**: StyleSheet로 스타일 정의

###  개선 필요 사항

####  높음 (High Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L37** | API URL 하드코딩 (`localhost:8001`) | 환경변수 또는 설정 파일로 분리 |
| **L87** | 결과 해석 로직이 현재 모델과 불일치 | 카테고리 문자열 표시로 수정 |

```javascript
//  현재 (L87) - 0/1 이진 분류 가정
{prediction === 0 ? "정상 거래" : prediction === 1 ? "이상 거래" : "알 수 없음"}

//  권장 - 모델이 6개 카테고리 반환하므로:
{prediction}  // 이미 "외식", "교통" 등 문자열 반환됨
```

####  보통 (Medium Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L3** | axios 직접 import | `../api/client.js` 사용 권장 |
| **L31-32** | 주석이 코드 내에 남아있음 | 필요 없으면 제거 |

---

##  2. `TransactionContext.js` (218줄)

**전체 평가**:  **승인** (우수한 구현)

###  잘된 점
1. **완전한 Context 구조**: Provider + useTransactions 훅 패턴
2. **캐싱 전략**: AsyncStorage로 오프라인 지원 (L20-33)
3. **자동 동기화**: 앱 시작 시 캐시 로드 + 서버 동기화 (L14-18)
4. **CSV 변환**: 거래 데이터를 CSV로 변환하여 예측 API 호출 (L147-176)
5. **에러 처리**: try-catch로 모든 비동기 작업 보호

###  경미한 개선 사항

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L148** | CSV 헤더 하드코딩 | 상수로 분리 권장 |
| **L172** | Blob 생성이 React Native에서 호환성 이슈 가능 | FormData 직접 사용 권장 |

---

##  3. `TransactionScreen.js` (656줄)

**전체 평가**:  **수정 필요** (기능적이나 개선점 존재)

###  잘된 점
1. **풍부한 UI**: 검색, 모달, AI 예측 카드 등 완성도 높은 UI
2. **상세 모달**: 거래 상세, 메모 편집, 이상거래 신고 기능
3. **테마 지원**: `useTheme()` 훅으로 다크모드 대응
4. **검색 기능**: 가맹점, 카테고리, 메모로 필터링 (L53-62)

###  개선 필요 사항

####  높음 (High Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L43** | API URL 하드코딩 (`localhost:8001`) | 환경변수로 분리 |
| **L136** | `setTransactions` 정의 없음 (오류) | Context의 함수 사용 또는 제거 |

```javascript
//  현재 (L136) - setTransactions가 정의되지 않음
setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));

//  권장 - Context에서 clearTransaction 함수 추가 또는 로컬 상태 사용
// 또는 TODO 주석의 백엔드 연결 코드 완성
```

####  보통 (Medium Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L3** | axios 직접 import | `../api/client.js` 사용 권장 |
| **L78-130** | 주석 처리된 백엔드 연결 코드가 너무 김 | 별도 문서로 분리 또는 실제 구현 |
| **L440-656** | 스타일 정의가 파일 절반 차지 (216줄) | 별도 파일로 분리 권장 |

---

##  4. `DashboardScreen.js` (894줄)

**전체 평가**:  **수정 필요** (기능적이나 파일이 너무 큼)

###  잘된 점
1. **풍부한 대시보드**: 요약, 차트, 카테고리, AI 인사이트 섹션
2. **애니메이션**: FadeInView, CountUpNumber 등 애니메이션 적용
3. **반응형**: 화면 크기에 따른 차트 너비 조정 (L210-211)
4. **예측 통합**: ML 예측 결과를 UI에 표시 (L437-505)
5. **인터랙티브 차트**: 데이터 포인트 클릭 시 툴팁 표시

###  개선 필요 사항

####  높음 (High Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **파일 전체** | 894줄로 너무 큼 | 컴포넌트 분리 필요 |
| **L388** | 이모지가 빈 문자열로 렌더링 | 실제 이모지 추가 |

```javascript
//  현재 (L388) - 빈 문자열
{index === 0 ? '' : index === 1 ? '' : ...}

//  권장 - 카테고리별 이모지 매핑
const CATEGORY_EMOJI = {
  '교통': '', '생활': '', '쇼핑': '', 
  '식료품': '', '외식': '', '주유': ''
};
{CATEGORY_EMOJI[item.category] || ''}
```

####  보통 (Medium Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L14-83** | 계산 함수들이 컴포넌트 파일 내에 있음 | `utils/` 또는 `hooks/`로 분리 |
| **L513-894** | 스타일이 381줄 (파일의 43%) | 별도 파일로 분리 |

###  파일 분리 권장 구조

```
 screens/Dashboard/
├── index.js                    # 메인 컴포넌트
├── components/
│   ├── SummarySection.js       # 요약 카드
│   ├── ChartSection.js         # 차트 영역
│   ├── CategorySection.js      # 카테고리별 소비
│   ├── InsightSection.js       # AI 인사이트
│   └── PredictionCard.js       # 예측 카드
├── hooks/
│   └── useDashboardData.js     # 데이터 로딩/계산 로직
└── styles.js                   # 스타일 정의
```

---

##  2단계 종합 요약

| 파일 | 결과 | 주요 이슈 |
|-----|------|----------|
| `MLTestScreen.js` |  수정 필요 | API URL 하드코딩, 결과 해석 불일치 |
| `TransactionContext.js` |  승인 | 잘 구현됨 |
| `TransactionScreen.js` |  수정 필요 | setTransactions 미정의, 스타일 분리 필요 |
| `DashboardScreen.js` |  수정 필요 | 파일 크기 과대 (894줄), 컴포넌트 분리 권장 |

###  우선 수정 권장 사항 (Top 3)

1. **API URL 상수화**: 모든 파일에서 `localhost:8001` 하드코딩  환경설정으로 분리
2. **`TransactionScreen.js` L136**: `setTransactions` 오류 수정
3. **`DashboardScreen.js`**: 컴포넌트 분리 (894줄  여러 파일로)

---

#  코드 리뷰 결과 - 3단계: 인프라 (docker-compose.yml)

**리뷰 일시**: 2025년 12월 12일  
**리뷰 대상**: `docker-compose.yml` (129줄)  
**리뷰어**: AI Code Reviewer

---

##  `docker-compose.yml` (129줄)

**전체 평가**:  **수정 필요** (보안 이슈 존재)

###  잘된 점
1. **명확한 섹션 구분**: 주석으로 각 서비스 구분
2. **헬스체크**: PostgreSQL 헬스체크 구현 (L18-22)
3. **의존성 관리**: `depends_on` + `condition: service_healthy` 사용
4. **포트 매핑 체계**: 서비스별 포트 구분 명확
5. **핫 리로드**: 백엔드 볼륨 마운트로 개발 편의성 확보 (L52)

###  개선 필요 사항

####  높음 - 보안 이슈 (Critical)

| 라인 | 문제 | 심각도 | 권장 수정 |
|-----|------|--------|----------|
| **L12** | DB 비밀번호 하드코딩 (`caffeineapprds`) |  높음 | 환경변수 파일(`.env`) 사용 |
| **L37-38** | AWS RDS 접속 정보 노출 |  높음 | 환경변수로 분리 |
| **L48** | SECRET_KEY 하드코딩 |  높음 | 환경변수로 분리 |
| **L128** | **Gemini API 키 노출** |  매우 높음 | **즉시 교체 및 환경변수 사용** |

```yaml
#  현재 (L128) - API 키가 그대로 노출됨
GEMINI_API_KEY: AIzaSyDQ4GpW4Vs6eyYvqFi_GNevT5v9Bx50zhM

#  권장
GEMINI_API_KEY: ${GEMINI_API_KEY}  # .env 파일에서 읽기
```

####  즉시 조치 필요
1. **Gemini API 키 교체**: 위 키는 이미 Git에 커밋되어 노출됨
2. `.env` 파일 생성 및 `.gitignore`에 추가
3. `docker-compose.yml`에서 환경변수 참조로 변경

```bash
# .env 파일 예시 (절대 Git에 커밋하지 말 것!)
POSTGRES_PASSWORD=your-strong-password
DB_PASSWORD=your-rds-password
SECRET_KEY=your-super-secret-key-256-bit
GEMINI_API_KEY=your-new-gemini-api-key
```

```yaml
# docker-compose.yml 수정
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  
  backend:
    environment:
      DB_PASSWORD: ${DB_PASSWORD}
      SECRET_KEY: ${SECRET_KEY}
  
  llm_analysis:
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
```

####  보통 (Medium Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L1** | `version: "3.9"` deprecated | 제거 권장 (Docker Compose V2) |
| **L17** | postgres_data 로컬 볼륨 | 운영 환경에서는 named volume 권장 |
| **L97** | 모델 파일 경로가 절대 경로 | 상대 경로 그대로 OK, 하지만 파일 존재 확인 필요 |

####  낮음 (Low Priority)

| 라인 | 문제 | 권장 수정 |
|-----|------|----------|
| **L58-64** | 주석 처리된 서비스 | 사용 안하면 제거 권장 |
| **전체** | 리소스 제한 없음 | `deploy.resources` 추가 권장 (운영 환경) |

###  권장 구조

```yaml
# docker-compose.yml (보안 강화 버전)
version: "3.9"

services:
  db:
    image: postgres:15
    container_name: caf_db
    env_file:
      - .env  # 환경변수 파일 참조
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-caffeine_db}
    # ... 이하 동일
```

---

##  3단계 종합 요약

| 파일 | 결과 | 주요 이슈 |
|-----|------|----------|
| `docker-compose.yml` |  수정 필요 | **Gemini API 키 노출** (Critical) |

###  즉시 조치 필요 사항

1. **Gemini API 키 교체** (현재 키는 폐기)
2. `.env` 파일 생성 후 민감 정보 이동
3. `docker-compose.yml`에서 `${VAR}` 형식으로 참조
4. `.gitignore`에 `.env` 추가 확인

---

*다음 단계: 4단계 - 부가 도구 (git_review_dashboard.py) 리뷰 (선택)*

---

#  전체 리뷰 최종 요약

## 리뷰 결과 총괄

| 단계 | 영역 | 파일 수 | 승인 | 수정 필요 | 심각 |
|-----|------|--------|-----|----------|-----|
| 1단계 | 백엔드 ML API | 4 | 2 | 2 | 0 |
| 2단계 | 프론트엔드 | 4 | 1 | 3 | 0 |
| 3단계 | 인프라 | 1 | 0 | 0 | **1** |
| **합계** | | **9** | **3** | **5** | **1** |

##  Critical 이슈 (즉시 수정)

1. **`docker-compose.yml` L128**: Gemini API 키 노출
   - 현재 키 폐기 후 새 키 발급
   - `.env` 파일로 이동

##  High Priority (우선 수정)

1. **`ml.py`**: `CATEGORY_MAP` 4곳 중복  상수로 통합
2. **`ml.py`**: import문 파일 상단으로 이동
3. **프론트엔드**: API URL 하드코딩  환경설정 분리
4. **`TransactionScreen.js`**: `setTransactions` 미정의 오류

##  Medium Priority (권장 수정)

1. **`main.py`**: `lifespan` 패턴으로 마이그레이션
2. **`DashboardScreen.js`**: 컴포넌트 분리 (894줄)
3. **`docker-compose.yml`**: 모든 민감 정보 `.env`로 분리

##  잘된 점

1. ML 전처리 파이프라인 잘 구현 (싱글톤 패턴)
2. TransactionContext의 캐싱 전략 우수
3. 보안 미들웨어 적용 (Rate Limiting, CORS)
4. Docker 헬스체크 및 의존성 관리

---

**리뷰 완료일**: 2025년 12월 12일  
**총 리뷰 시간**: 약 4시간 예상 (실제 코드 수정 포함 시)

