# 프로젝트 기술 요약

## 1. JWT (OAuth2)

| 항목 | 내용 |
|-----|------|
| **라이브러리** | `python-jose[cryptography]==3.3.0` |
| **인증 방식** | OAuth2 Password Bearer |
| **토큰 URL** | `/users/login` |
| **토큰 타입** | JWT (JSON Web Token) |
| **기능** | 로그인, 토큰 발급, 토큰 검증, 블랙리스트(로그아웃) |

### 관련 파일
- `10_backend/app/core/jwt.py` - JWT 생성/검증
- `10_backend/app/routers/user.py` - OAuth2 로그인 엔드포인트

---

## 2. RAG (Retrieval-Augmented Generation)

| 항목 | 내용 |
|-----|------|
| **사용 여부** | 미사용 |
| **현재 LLM 방식** | Direct Prompting (Gemini API) |
| **서비스** | `51_llm_analysis` - 소비 분석 조언 |

> 현재 프로젝트는 RAG를 사용하지 않고, Gemini API에 직접 프롬프트를 전송하여 응답을 생성하는 방식입니다.

---

## 3. ML 모델

| 모델명 | 파일명 | 정확도 | 용도 |
|-------|-------|-------|------|
| **XGBoost** | `model_xgboost_acc_73.47.joblib` | 73.47% | 소비 카테고리 예측 (6개 클래스) |
| LightGBM (백업) | `lightgbm_cuda_production_20251205.joblib` | - | 이전 버전 (현재 미사용) |

### 예측 카테고리 (6개)
- 교통, 생활, 쇼핑, 식료품, 외식, 주유

---

## 4. 데이터베이스 테이블

| 테이블명 | 설명 | 비고 |
|---------|------|------|
| **users** | 사용자 정보 | v1.0 |
| **transactions** | 거래 내역 | v1.0 |
| **anomalies** | 이상 거래 | v1.0 |
| **coupons** | 쿠폰 | v1.0 |
| **sessions** | 세션 관리 | v1.0 |
| audit_logs | 감사 로그 | v2.0 예정 |
| jwt_blacklist | JWT 블랙리스트 | v2.0 예정 |

**총 테이블 수: 7개** (v1.0 구현: 5개, v2.0 예정: 2개)

---

## 요약

| 항목 | 값 |
|-----|---|
| JWT 인증 | OAuth2 + python-jose |
| RAG | 미사용 (Direct Prompting) |
| ML 모델 | XGBoost (73.47%) |
| LLM 모델 | Gemini 1.5 Flash |
| 테이블 수 | 7개 (구현 5개 + 예정 2개) |
