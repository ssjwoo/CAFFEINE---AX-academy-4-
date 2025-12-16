#  Caffeine App - Project Handoff Document
## 다른 기기에서 작업 이어하기 가이드

> ** 목적**: 이 문서는 프로젝트를 다른 컴퓨터나 개발자에게 인계할 때 필요한 모든 정보를 담고 있습니다.

**마지막 업데이트**: 2024-12-01  
**프로젝트 버전**: 1.0.0 (Frontend Complete)  
**프로젝트 위치**: `c:\Users\Jinwoo\Desktop\1129\caffeine-app`

---

##  목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [빠른 시작](#2-빠른-시작)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [완성된 기능](#4-완성된-기능)
5. [기술 스택](#5-기술-스택)
6. [환경 설정](#6-환경-설정)
7. [실행 방법](#7-실행-방법)
8. [Mock 데이터 위치](#8-mock-데이터-위치)
9. [다음 작업](#9-다음-작업)
10. [중요 문서](#10-중요-문서)
11. [문제 해결](#11-문제-해결)

---

## 1. 프로젝트 개요

### 프로젝트 이름
**Caffeine** - 스마트 금융 관리 앱

### 설명
사용자의 카드 거래를 분석하고 이상 거래를 탐지하는 React Native(Expo) 앱

### 현재 상태
 **프론트엔드 100% 완성**
- 모든 UI 화면 구현 완료
- Mock 데이터로 동작
- 백엔드 연결 준비 완료

⏳ **백엔드 개발 필요**
- API 서버 구축 필요
- 데이터베이스 설정 필요

### 개발 기간
- 시작: 2024-11-29
- 프론트엔드 완료: 2024-12-01

---

## 2. 빠른 시작

### 2.1 프로젝트 복사 (Git 사용 시)

```bash
# Git이 설정되어 있다면
git clone <repository-url>
cd caffeine-app
```

### 2.2 프로젝트 복사 (수동)

1. 전체 폴더 복사: `caffeine-app/`
2. 새 컴퓨터에 붙여넣기
3. 아래 설치 단계 진행

### 2.3 필수 프로그램 설치

```bash
# Node.js 확인 (18.x 이상)
node --version

# npm 확인
npm --version

# Node.js가 없다면 설치: https://nodejs.org/
```

### 2.4 프로젝트 설치

```bash
# 프로젝트 폴더로 이동
cd caffeine-app

# 패키지 설치 (5-10분 소요)
npm install

# Expo 앱 실행
npm start
```

### 2.5 실행 확인

- **웹 브라우저**: 자동으로 열림 또는 `http://localhost:19006`
- **터미널**: QR 코드 표시됨
- **Expo Go 앱**: QR 코드 스캔 (모바일에서 테스트 시)

---

## 3. 프로젝트 구조

```
caffeine-app/
│
├──  src/                          # 소스 코드
│   ├──  contexts/                 # Context API (전역 상태)
│   │   ├── AuthContext.js          #  인증 (상세 주석)
│   │   └── ThemeContext.js         # 테마/다크모드
│   │
│   ├──  screens/                  # 화면 컴포넌트
│   │   ├── LoginScreen.js          # 로그인
│   │   ├── SignupScreen.js         # 회원가입
│   │   ├── DashboardScreen.js      #  대시보드 (백엔드 중요)
│   │   ├── TransactionScreen.js    #  거래내역 (백엔드 중요)
│   │   ├── AnomalyDetectionScreen.js #  이상탐지 (백엔드 중요)
│   │   └── ProfileScreen.js        # 프로필/설정
│   │
│   └──  components/               # 재사용 컴포넌트
│       ├── EmptyState.js           # 빈 상태 UI
│       └── SkeletonCard.js         # 로딩 UI
│
├──  App.js                        # 앱 진입점
├──  package.json                  # 패키지 목록
├──  app.json                      # Expo 설정
│
├──  README.md                     # 프로젝트 소개
├──  BACKEND_INTEGRATION_GUIDE.md #  백엔드 연결 가이드
└──  PROJECT_HANDOFF.md           #  이 문서 (작업 인계 가이드)
```

### 중요 파일 설명

| 파일 | 역할 | 우선순위 |
|------|------|---------|
| `src/contexts/AuthContext.js` | 인증 관리, 상세 주석 있음 |  |
| `BACKEND_INTEGRATION_GUIDE.md` | 백엔드 연결 완벽 가이드 |  |
| `src/screens/DashboardScreen.js` | 대시보드, Mock 데이터 많음 |  |
| `src/screens/TransactionScreen.js` | 거래내역, 검색 기능 |  |
| `App.js` | Navigation 설정 |  |

---

## 4. 완성된 기능

### 4.1 인증 시스템 

**파일**: `src/contexts/AuthContext.js`, `LoginScreen.js`, `SignupScreen.js`

**기능**:
-  로그인 (Mock)
-  회원가입 (Mock)
-  로그아웃
-  자동 로그인 (AsyncStorage)
-  비밀번호 표시/숨김 토글 ()

**현재 상태**:
- Mock 인증 (가짜 데이터)
- AsyncStorage에만 저장
-  **백엔드 API 필요**

### 4.2 Dashboard 

**파일**: `src/screens/DashboardScreen.js`

**기능**:
-  요약 카드 (총 소비, 평균 거래액 등)
-  월별 추이 LineChart
-  카테고리별 PieChart
-  AI 인사이트 섹션
-  Pull-to-Refresh
-  인터랙티브 카드

**현재 상태**:
- Mock 데이터 사용 (Line 6-24)
-  **3개 API 필요**: summary, monthly-stats, category-stats

### 4.3 거래내역 

**파일**: `src/screens/TransactionScreen.js`

**기능**:
-  거래 목록 표시
-   실시간 검색
-  상세 정보 Modal
-  메모 편집
-  신용/체크 카드 구분
-  Empty State (검색 결과 없을 때)
-  이상거래로 표시 기능

**현재 상태**:
- Mock 데이터 8개 거래 (Line 6-15)
-  **API 필요**: GET /transactions, PATCH /note, POST /mark-anomaly

### 4.4 이상 탐지 

**파일**: `src/screens/AnomalyDetectionScreen.js`

**기능**:
-  의심 거래 목록
-  위험 수준 (높음/중간/낮음)
-  상세 정보 Modal
-  정상 거래로 표시
-  카드 정지 요청
-  Empty State (의심 거래 없을 때)

**현재 상태**:
- Mock 데이터 3개 (Line 5-9)
-  **API 필요**: GET /anomalies, POST /mark-normal, POST /block-card

### 4.5 프로필 

**파일**: `src/screens/ProfileScreen.js`

**기능**:
-  사용자 정보 표시
-  다크모드 토글
-  데이터 내보내기 (Mock alert)
-  데이터 동기화 (Mock alert)
-  캐시 삭제
-  앱 정보
-  약관/개인정보
-  로그아웃

**현재 상태**:
- Mock 알림만 표시
-  **API 필요**: GET /users/me, GET /export-data, POST /sync

### 4.6 공통 컴포넌트 

**EmptyState** (`src/components/EmptyState.js`):
- 빈 상태 UI
- 아이콘, 제목, 설명, 액션 버튼

**SkeletonCard** (`src/components/SkeletonCard.js`):
- 로딩 애니메이션
- 펄싱 효과

---

## 5. 기술 스택

### 5.1 Frontend

```json
{
  "플랫폼": "React Native (Expo)",
  "React 버전": "18.2.0",
  "React Native": "0.74.5",
  "Expo SDK": "~51.0.28"
}
```

### 5.2 Navigation

```json
{
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/bottom-tabs": "^6.6.1",
  "@react-navigation/stack": "^6.4.1",
  "react-native-gesture-handler": "설치됨"
}
```

### 5.3 UI/Chart

```json
{
  "react-native-chart-kit": "^6.12.0",
  "react-native-svg": "설치됨"
}
```

### 5.4 Storage

```json
{
  "@react-native-async-storage/async-storage": "1.23.1"
}
```

### 5.5 Web Support

```json
{
  "react-dom": "18.2.0",
  "react-native-web": "~0.19.10"
}
```

---

## 6. 환경 설정

### 6.1 필요한 소프트웨어

| 소프트웨어 | 버전 | 필수 | 다운로드 |
|-----------|------|------|----------|
| Node.js | 18.x 이상 |  필수 | https://nodejs.org/ |
| npm | 9.x 이상 |  필수 | Node.js 포함 |
| Git | 최신 | 선택 | https://git-scm.com/ |
| VS Code | 최신 | 권장 | https://code.visualstudio.com/ |

### 6.2 VS Code 확장 프로그램 (권장)

```
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- React Native Tools
```

### 6.3 환경 변수 (필요 시)

 `.env` (아직 생성 안 됨, 백엔드 연결 시 필요)

```env
API_BASE_URL=https://your-api.com/api
API_TIMEOUT=10000
```

---

## 7. 실행 방법

### 7.1 개발 모드 실행

```bash
# 프로젝트 폴더에서
npm start

# 또는
npx expo start
```

**옵션**:
```bash
npm start --web        # 웹만 실행
npm start --android    # 안드로이드만
npm start --ios        # iOS만 (Mac만 가능)
```

### 7.2 웹에서 실행

```bash
# 방법 1: npm start 후 'w' 키 누르기
npm start
# (터미널에서 'w' 입력)

# 방법 2: 직접 웹 실행
npx expo start --web

# 방법 3: 특정 포트
npx expo start --web --port 19006
```

**브라우저 자동 열림**: `http://localhost:19006`

### 7.3 모바일에서 테스트

1. **Expo Go 앱** 설치 (iOS/Android)
2. `npm start` 실행
3. QR 코드 스캔
4. 앱 실행

### 7.4 빌드 (Production)

```bash
# 웹 빌드
npx expo export:web

# 안드로이드 APK
npx eas build --platform android

# iOS (Mac 필요)
npx eas build --platform ios
```

---

## 8. Mock 데이터 위치

>  **중요**: 백엔드 연결 시 이 데이터를 API 호출로 교체해야 합니다!

### 8.1 AuthContext (인증)

 `src/contexts/AuthContext.js`

**Line 35-49**: `login` 함수
```javascript
const login = async (email, password) => {
    //  Mock 로그인 - 백엔드 API로 교체 필요!
    if (email && password) {
        const userData = { id: 1, name: '홍길동', email, ... };
        // ...
    }
};
```

**Line 51-65**: `signup` 함수
```javascript
const signup = async (name, email, password) => {
    //  Mock 회원가입 - 백엔드 API로 교체 필요!
    const userData = { id: Date.now(), name, email, ... };
    // ...
};
```

### 8.2 Dashboard

 `src/screens/DashboardScreen.js`

**Line 6-24**: `MOCK_DATA`
```javascript
const MOCK_DATA = {
    summary: {
        total_spending: 1250000,
        total_transactions: 81,
        average_transaction: 15432,
        most_used_category: '쇼핑',
        monthly_trend: '증가',
        anomaly_count: 3
    },
    monthlyData: [ /* 6개월 데이터 */ ],
    categoryData: [ /* 6개 카테고리 */ ]
};
```

**교체 방법**: BACKEND_INTEGRATION_GUIDE.md 참조

### 8.3 Transaction (거래내역)

 `src/screens/TransactionScreen.js`

**Line 6-15**: `MOCK_TRANSACTIONS`
```javascript
const MOCK_TRANSACTIONS = [
    { id: 1, merchant: '스타벅스', amount: 15000, ... },
    { id: 2, merchant: 'GS25', amount: 5000, ... },
    // ... 총 8개
];
```

**교체 방법**: BACKEND_INTEGRATION_GUIDE.md 참조

### 8.4 Anomaly (이상탐지)

 `src/screens/AnomalyDetectionScreen.js`

**Line 5-9**: `MOCK_ANOMALIES`
```javascript
const MOCK_ANOMALIES = [
    { id: 1, merchant: '명품관', amount: 500000, risk: '높음', ... },
    { id: 2, merchant: '알 수 없음', amount: 300000, risk: '높음', ... },
    { id: 3, merchant: '유흥업소', amount: 150000, risk: '중간', ... }
];
```

**교체 방법**: BACKEND_INTEGRATION_GUIDE.md 참조

---

## 9. 다음 작업

### 9.1 우선순위 1: 백엔드 개발 

**필요한 API 엔드포인트** (17개):

**인증 (3개)**:
1. `POST /auth/signup` - 회원가입
2. `POST /auth/login` - 로그인
3. `GET /auth/verify` - 토큰 검증

**Dashboard (3개)**:
4. `GET /dashboard/summary` - 요약 통계
5. `GET /dashboard/monthly-stats` - 월별 통계
6. `GET /dashboard/category-stats` - 카테고리 통계

**거래내역 (3개)**:
7. `GET /transactions` - 거래 목록
8. `PATCH /transactions/:id/note` - 메모 수정
9. `POST /transactions/:id/mark-anomaly` - 이상거래 표시

**이상탐지 (3개)**:
10. `GET /anomalies` - 의심 거래 목록
11. `POST /anomalies/:id/mark-normal` - 정상 처리
12. `POST /anomalies/:id/block-card` - 카드 정지

**프로필 (3개)**:
13. `GET /users/me` - 사용자 정보
14. `GET /users/export-data` - 데이터 내보내기
15. `POST /users/sync` - 데이터 동기화

**AI 분석 (선택, 2개)**:
16. `POST /ai/analyze-transaction` - 거래 분석
17. `GET /ai/insights` - AI 인사이트

** 상세 스펙: BACKEND_INTEGRATION_GUIDE.md**

### 9.2 우선순위 2: 백엔드 연결

**Step 1**: API 클라이언트 설정
```bash
npm install axios
# 또는
npm install @tanstack/react-query
```

**Step 2**: API 설정 파일 생성
```javascript
// src/config/api.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://your-api.com/api',
    timeout: 10000,
});

export default apiClient;
```

**Step 3**: 각 화면 수정
- AuthContext
- DashboardScreen
- TransactionScreen
- AnomalyDetectionScreen

** 상세 가이드: BACKEND_INTEGRATION_GUIDE.md**

### 9.3 우선순위 3: 추가 기능 (선택)

**기능 추가 아이디어**:
- [ ] 차트 애니메이션 (카운트업 효과)
- [ ] 날짜 범위 선택 필터
- [ ] 거래 정렬 옵션
- [ ] 카테고리 커스터마이징
- [ ] 푸시 알림
- [ ] 생체 인증 (지문/Face ID)
- [ ] 오프라인 모드
- [ ] 무한 스크롤 (페이지네이션)

### 9.4 우선순위 4: 배포

**Step 1**: Docker 설정
```dockerfile
# Dockerfile 생성 (백엔드용)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Step 2**: 서버 배포
- AWS / Heroku / DigitalOcean 선택
- 도메인 연결
- HTTPS 설정

**Step 3**: 앱 배포
- Google Play Store (안드로이드)
- App Store (iOS)
- Web 호스팅 (Vercel/Netlify)

---

## 10. 중요 문서

### 10.1 필수 문서 

| 문서 | 용도 | 우선순위 |
|------|------|---------|
| [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) | 백엔드 연결 완벽 가이드 |  |
| [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md) | 프로젝트 인계 (이 문서) |  |
| [README.md](./README.md) | 프로젝트 소개 |  |
| [src/contexts/AuthContext.js](./src/contexts/AuthContext.js) | 상세 주석 예시 |  |

### 10.2 Artifact 문서 (참고용)

프로젝트 중 생성된 문서들 (`.gemini/antigravity/brain/...`):
- `walkthrough.md` - 프로젝트 전체 개요
- `task.md` - 작업 체크리스트
- `implementation_plan.md` - 구현 계획
- 기타 프로젝트 진행 기록

---

## 11. 문제 해결

### 11.1 npm install 실패

**문제**: `npm install` 에러

**해결**:
```bash
# 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 11.2 Expo 실행 안 됨

**문제**: `expo: command not found`

**해결**:
```bash
# Expo 전역 설치
npm install -g expo-cli

# 또는 npx 사용
npx expo start
```

### 11.3 웹 실행 시 에러

**문제**: "Metro bundler crashing"

**해결**:
```bash
# 캐시 클리어
npx expo start --clear

# 포트 변경
npx expo start --web --port 19007
```

### 11.4 AsyncStorage 경고

**문제**: "AsyncStorage has been extracted from react-native"

**해결**: 이미 설치됨 (`@react-native-async-storage/async-storage`)
- 경고 무시 가능

### 11.5 Chart 에러

**문제**: "react-native-svg not found"

**해결**:
```bash
npm install react-native-svg
```

---

## 12. Git 설정 (선택)

### 12.1 Git 초기화

```bash
cd caffeine-app

# Git 초기화
git init

# .gitignore 확인 (이미 있음)
cat .gitignore

# 첫 커밋
git add .
git commit -m "Initial commit - Frontend complete"
```

### 12.2 원격 저장소 연결

```bash
# GitHub/GitLab 저장소 생성 후
git remote add origin <repository-url>
git branch -M main
git push -u origin main
```

### 12.3 .gitignore (이미 설정됨)

```
node_modules/
.expo/
.expo-shared/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
.env
```

---

## 13. 연락처 & 지원

### 13.1 프로젝트 정보

- **프로젝트명**: Caffeine
- **버전**: 1.0.0 (Frontend Complete)
- **개발 시작**: 2024-11-29
- **완료일**: 2024-12-01

### 13.2 참고 자료

- **React Native 공식 문서**: https://reactnative.dev/
- **Expo 공식 문서**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Chart Kit**: https://github.com/indiespirit/react-native-chart-kit

---

## 14. 체크리스트

### 14.1 새 기기 설정 시

- [ ] Node.js 설치 확인
- [ ] 프로젝트 폴더 복사
- [ ] `npm install` 실행
- [ ] `npm start` 실행
- [ ] 웹 브라우저에서 확인
- [ ] 주요 문서 읽기 (README, BACKEND_INTEGRATION_GUIDE)

### 14.2 백엔드 개발 전

- [ ] BACKEND_INTEGRATION_GUIDE.md 읽기
- [ ] API 스펙 확인
- [ ] 데이터베이스 설계
- [ ] 개발 환경 설정

### 14.3 배포 전

- [ ] 모든 Mock 데이터 제거 확인
- [ ] API 연결 테스트
- [ ] 에러 처리 확인
- [ ] 로딩 상태 확인
- [ ] Production 빌드 테스트

---

## 15. 요약

###  완성된 것
-  전체 Frontend UI
-  인증 시스템 (Mock)
-  Dashboard
-  거래내역 + 검색
-  이상 탐지
-  프로필/설정
-  다크모드
-  완벽한 백엔드 연결 가이드
-  상세 주석 (AuthContext)

### ⏳ 필요한 것
-  Backend API 개발
-  데이터베이스 설정
-  Mock 데이터  API 연결
-  Docker 설정
-  배포

###  핵심 문서
1. **BACKEND_INTEGRATION_GUIDE.md** - API 연결 가이드
2. **PROJECT_HANDOFF.md** - 이 문서
3. **AuthContext.js** - 상세 주석 예시

---

** 프론트엔드 개발 완료!**
** 다음: 백엔드 개발**

---

*마지막 업데이트: 2024-12-01*  
*버전: 1.0.0*
