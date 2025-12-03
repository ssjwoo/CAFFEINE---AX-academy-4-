# 🔌 Backend Integration Guide
## Caffeine App - 백엔드 연결 완벽 가이드

> **📌 이 문서의 목적**
> - Mock 데이터를 실제 Backend API로 교체하는 방법
> - 각 화면별 필요한 API 엔드포인트
> - 데이터 구조 및 연결 포인트
> - 단계별 마이그레이션 가이드

---

## 📚 목차
1. [시작하기 전에](#시작하기-전에)
2. [인증 시스템](#1-인증-시스템-authcontext)
3. [Dashboard 화면](#2-dashboard-화면)
4. [거래내역 화면](#3-거래내역-화면)
5. [이상 탐지 화면](#4-이상-탐지-화면)
6. [Profile 화면](#5-profile-화면)
7. [API 설정](#6-api-설정)
8. [마이그레이션 체크리스트](#7-마이그레이션-체크리스트)

---

## 시작하기 전에

### 필요한 패키지
```bash
npm install axios  # HTTP 요청
# 또는
npm install @tanstack/react-query  # 데이터 페칭 + 캐싱 (추천)
```

### API 설정 파일 생성
📁 `src/config/api.js`
```javascript
// API 기본 URL 설정
export const API_BASE_URL = 'https://your-api.com/api';  // 실제 API URL로 변경

// API 클라이언트 생성
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 - 모든 요청에 토큰 자동 추가
apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 토큰 만료 - 로그아웃 처리
            AsyncStorage.removeItem('token');
            AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
```

---

## 1. 인증 시스템 (AuthContext)

### 현재 상태 (Mock)
📁 `src/contexts/AuthContext.js`
- 가짜 로그인/회원가입
- AsyncStorage에만 저장

### 필요한 API

#### 1.1 회원가입
**Endpoint**: `POST /auth/signup`

**Request Body**:
```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "홍길동",
    "email": "user@example.com",
    "createdAt": "2024-11-30T00:00:00Z"
  }
}
```

**코드 변경 (AuthContext.js)**:
```javascript
const signup = async (name, email, password) => {
    try {
        // 🔴 API 호출로 변경
        const response = await apiClient.post('/auth/signup', {
            name,
            email,
            password
        });
        
        const { token, user } = response.data;
        
        // 토큰과 사용자 정보 저장
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.message || '회원가입 실패' 
        };
    }
};
```

#### 1.2 로그인
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: (회원가입과 동일)

**코드 변경**:
```javascript
const login = async (email, password) => {
    try {
        const response = await apiClient.post('/auth/login', {
            email,
            password
        });
        
        const { token, user } = response.data;
        
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.message || '로그인 실패' 
        };
    }
};
```

#### 1.3 토큰 검증
**Endpoint**: `GET /auth/verify`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "name": "홍길동",
    "email": "user@example.com"
  }
}
```

**코드 변경**:
```javascript
const checkLoginStatus = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        
        // 토큰 검증
        const response = await apiClient.get('/auth/verify');
        
        if (response.data.valid) {
            setUser(response.data.user);
        }
    } catch (error) {
        // 토큰 무효 - 삭제
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    } finally {
        setLoading(false);
    }
};
```

---

## 2. Dashboard 화면

### 현재 Mock 데이터 위치
📁 `src/screens/DashboardScreen.js` - Line 6-24

```javascript
const MOCK_DATA = {
    summary: { total_spending: 1250000, ... },
    monthlyData: [...],
    categoryData: [...]
};
```

### 필요한 API

#### 2.1 대시보드 요약 정보
**Endpoint**: `GET /dashboard/summary`

**Query Parameters**:
- `startDate`: 시작 날짜 (optional, default: 이번 달 1일)
- `endDate`: 종료 날짜 (optional, default: 오늘)

**Response**:
```json
{
  "total_spending": 1250000,
  "total_transactions": 81,
  "average_transaction": 15432,
  "most_used_category": "쇼핑",
  "monthly_trend": "증가",
  "anomaly_count": 3
}
```

#### 2.2 월별 통계
**Endpoint**: `GET /dashboard/monthly-stats`

**Query Parameters**:
- `months`: 가져올 개월 수 (default: 6)

**Response**:
```json
[
  {
    "month": "2024-06",
    "total_amount": 577000
  },
  {
    "month": "2024-07",
    "total_amount": 638000
  }
]
```

#### 2.3 카테고리별 통계
**Endpoint**: `GET /dashboard/category-stats`

**Response**:
```json
[
  {
    "category": "쇼핑",
    "total_amount": 1140000,
    "percentage": 37
  },
  {
    "category": "식비",
    "total_amount": 890000,
    "percentage": 29
  }
]
```

### 코드 변경 (DashboardScreen.js)

**Before (Mock)**:
```javascript
useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 가짜 로딩
        setSummary(MOCK_DATA.summary);
        setMonthlyData(MOCK_DATA.monthlyData);
        setCategoryData(MOCK_DATA.categoryData);
        setLoading(false);
    };
    loadData();
}, []);
```

**After (Real API)**:
```javascript
useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            // 병렬로 모든 데이터 가져오기
            const [summaryRes, monthlyRes, categoryRes] = await Promise.all([
                apiClient.get('/dashboard/summary'),
                apiClient.get('/dashboard/monthly-stats'),
                apiClient.get('/dashboard/category-stats')
            ]);
            
            setSummary(summaryRes.data);
            setMonthlyData(monthlyRes.data);
            setCategoryData(categoryRes.data);
        } catch (error) {
            console.error('Dashboard 데이터 로딩 실패:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };
    loadData();
}, []);
```

---

## 3. 거래내역 화면

### 현재 Mock 데이터
📁 `src/screens/TransactionScreen.js` - Line 6-15

### 필요한 API

#### 3.1 거래 내역 조회
**Endpoint**: `GET /transactions`

**Query Parameters**:
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 개수 (default: 20)
- `search`: 검색어 (optional)
- `category`: 카테고리 필터 (optional)
- `cardType`: 신용/체크 필터 (optional)
- `startDate`: 시작 날짜 (optional)
- `endDate`: 종료 날짜 (optional)

**Response**:
```json
{
  "transactions": [
    {
      "id": 1,
      "merchant": "스타벅스",
      "businessName": "스타벅스커피코리아(주)",
      "amount": 15000,
      "category": "식비",
      "date": "2024-11-29T10:00:00Z",
      "notes": "아메리카노",
      "cardType": "신용",
      "accumulated": 215000,
      "balance": null
    }
  ],
  "total": 81,
  "page": 1,
  "totalPages": 5
}
```

#### 3.2 거래 메모 수정
**Endpoint**: `PATCH /transactions/{id}/note`

**Request Body**:
```json
{
  "notes": "수정된 메모"
}
```

**Response**:
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "notes": "수정된 메모"
  }
}
```

#### 3.3 이상거래로 표시
**Endpoint**: `POST /transactions/{id}/mark-anomaly`

**Response**:
```json
{
  "success": true,
  "message": "이상 거래로 표시되었습니다"
}
```

### 코드 변경 (TransactionScreen.js)

**데이터 로딩**:
```javascript
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(true);
const [page, setPage] = useState(1);

useEffect(() => {
    loadTransactions();
}, [searchQuery, page]);

const loadTransactions = async () => {
    setLoading(true);
    try {
        const response = await apiClient.get('/transactions', {
            params: {
                page,
                limit: 20,
                search: searchQuery || undefined
            }
        });
        
        setTransactions(response.data.transactions);
    } catch (error) {
        console.error('거래내역 로딩 실패:', error);
    } finally {
        setLoading(false);
    }
};
```

**메모 수정**:
```javascript
const handleSaveNote = async () => {
    if (selectedTransaction) {
        try {
            await apiClient.patch(`/transactions/${selectedTransaction.id}/note`, {
                notes: editedNote
            });
            
            // 로컬 state 업데이트
            setTransactions(prev => prev.map(t =>
                t.id === selectedTransaction.id ? { ...t, notes: editedNote } : t
            ));
            
            setSelectedTransaction({ ...selectedTransaction, notes: editedNote });
            setIsEditingNote(false);
            alert('✅ 메모가 저장되었습니다.');
        } catch (error) {
            alert('❌ 메모 저장 실패');
        }
    }
};
```

**이상거래 표시**:
```javascript
const handleMarkAsAnomaly = async () => {
    if (selectedTransaction) {
        try {
            await apiClient.post(`/transactions/${selectedTransaction.id}/mark-anomaly`);
            
            setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
            setModalVisible(false);
            
            setTimeout(() => {
                alert('⚠️ 이상거래로 표시되었습니다.');
                navigation?.navigate('이상탐지');
            }, 300);
        } catch (error) {
            alert('❌ 요청 실패');
        }
    }
};
```

---

## 4. 이상 탐지 화면

### 현재 Mock 데이터
📁 `src/screens/AnomalyDetectionScreen.js` - Line 5-9

### 필요한 API

#### 4.1 의심 거래 조회
**Endpoint**: `GET /anomalies`

**Query Parameters**:
- `status`: 상태 (pending, resolved) (default: pending)
- `riskLevel`: 위험도 (높음, 중간, 낮음) (optional)

**Response**:
```json
{
  "anomalies": [
    {
      "id": 1,
      "merchant": "명품관",
      "amount": 500000,
      "date": "2024-11-09T03:30:00Z",
      "reason": "비정상 시간대 + 큰 금액",
      "risk": "높음",
      "details": "비정상적인 시간대 (새벽 3시)\\n평소 거래액보다 10배 높음\\n처음 이용하는 가맹점",
      "score": 0.95
    }
  ],
  "total": 3
}
```

#### 4.2 정상 거래로 표시
**Endpoint**: `POST /anomalies/{id}/mark-normal`

**Response**:
```json
{
  "success": true,
  "message": "정상 거래로 처리되었습니다"
}
```

#### 4.3 카드 정지 요청
**Endpoint**: `POST /anomalies/{id}/block-card`

**Response**:
```json
{
  "success": true,
  "message": "카드 정지 요청이 접수되었습니다",
  "request_id": "REQ-20241130-001"
}
```

### 코드 변경 (AnomalyDetectionScreen.js)

```javascript
const [anomalies, setAnomalies] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    loadAnomalies();
}, []);

const loadAnomalies = async () => {
    setLoading(true);
    try {
        const response = await apiClient.get('/anomalies', {
            params: { status: 'pending' }
        });
        
        setAnomalies(response.data.anomalies);
    } catch (error) {
        console.error('이상 거래 로딩 실패:', error);
    } finally {
        setLoading(false);
    }
};

const handleMarkAsNormal = async () => {
    if (selectedAnomaly) {
        try {
            await apiClient.post(`/anomalies/${selectedAnomaly.id}/mark-normal`);
            
            setAnomalies(prev => prev.filter(a => a.id !== selectedAnomaly.id));
            setModalVisible(false);
            
            setTimeout(() => {
                alert('✅ 정상 거래로 표시되었습니다.');
            }, 300);
        } catch (error) {
            alert('❌ 요청 실패');
        }
    }
};

const handleBlockCard = async () => {
    if (confirm('정말 카드를 정지하시겠습니까?')) {
        try {
            const response = await apiClient.post(`/anomalies/${selectedAnomaly.id}/block-card`);
            
            setModalVisible(false);
            
            setTimeout(() => {
                alert(`⚠️ 카드 정지 요청이 접수되었습니다.\\n요청 번호: ${response.data.request_id}`);
            }, 300);
        } catch (error) {
            alert('❌ 요청 실패');
        }
    }
};
```

---

## 5. Profile 화면

### 필요한 API

#### 5.1 사용자 정보 조회
**Endpoint**: `GET /users/me`

**Response**:
```json
{
  "id": 1,
  "name": "홍길동",
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00Z",
  "settings": {
    "darkMode": true,
    "notifications": true
  }
}
```

#### 5.2 데이터 내보내기
**Endpoint**: `GET /users/export-data`

**Response**: CSV 파일 다운로드

#### 5.3 데이터 동기화
**Endpoint**: `POST /users/sync`

**Response**:
```json
{
  "success": true,
  "lastSync": "2024-11-30T00:00:00Z"
}
```

---

## 6. API 설정

### Environment Variables
📁 `.env`
```
API_BASE_URL=https://your-api.com/api
API_TIMEOUT=10000
```

### API Client 사용법
```javascript
import apiClient from '../config/api';

// GET 요청
const response = await apiClient.get('/endpoint');

// POST 요청
const response = await apiClient.post('/endpoint', { data });

// PATCH 요청
const response = await apiClient.patch('/endpoint/:id', { data });

// DELETE 요청
const response = await apiClient.delete('/endpoint/:id');
```

---

## 7. 마이그레이션 체크리스트

### Phase 1: 인증 시스템 ✅
- [ ] API 클라이언트 설정 (`src/config/api.js`)
- [ ] AuthContext 수정
  - [ ] signup 함수
  - [ ] login 함수
  - [ ] checkLoginStatus 함수
  - [ ] logout 함수
- [ ] 토큰 저장/로딩 확인
- [ ] 로그인/로그아웃 테스트

### Phase 2: Dashboard ✅
- [ ] API 엔드포인트 3개 준비
  - [ ] `/dashboard/summary`
  - [ ] `/dashboard/monthly-stats`
  - [ ] `/dashboard/category-stats`
- [ ] DashboardScreen 수정
  - [ ] loadData 함수 변경
  - [ ] onRefresh 추가
  - [ ] 에러 처리
- [ ] 차트 데이터 표시 확인

### Phase 3: 거래내역 ✅
- [ ] API 엔드포인트 준비
  - [ ] `GET /transactions`
  - [ ] `PATCH /transactions/:id/note`
  - [ ] `POST /transactions/:id/mark-anomaly`
- [ ] TransactionScreen 수정
  - [ ] loadTransactions 함수
  - [ ] 검색/필터 쿼리
  - [ ] 메모 수정
  - [ ] 페이지네이션 (추가)
- [ ] 테스트

### Phase 4: 이상 탐지 ✅
- [ ] API 엔드포인트 준비
  - [ ] `GET /anomalies`
  - [ ] `POST /anomalies/:id/mark-normal`
  - [ ] `POST /anomalies/:id/block-card`
- [ ] AnomalyDetectionScreen 수정
  - [ ] loadAnomalies 함수
  - [ ] 액션 함수들
- [ ] 테스트

### Phase 5: Profile ✅
- [ ] API 엔드포인트 준비
  - [ ] `GET /users/me`
  - [ ] `GET /users/export-data`
  - [ ] `POST /users/sync`
- [ ] ProfileScreen 수정
  - [ ] 실제 데이터 내보내기
  - [ ] 동기화 기능
- [ ] 테스트

### Phase 6: 최종 테스트 ✅
- [ ] 전체 플로우 테스트
- [ ] 에러 핸들링 확인
- [ ] 로딩 상태 확인
- [ ] 오프라인 모드 처리 (optional)

---

## 8. 추가 팁

### 에러 처리
```javascript
try {
    const response = await apiClient.get('/endpoint');
    // 성공 처리
} catch (error) {
    if (error.response) {
        // 서버 응답 있음 (4xx, 5xx)
        alert(error.response.data.message);
    } else if (error.request) {
        // 요청 전송됐지만 응답 없음 (네트워크 오류)
        alert('네트워크 오류. 인터넷 연결을 확인하세요.');
    } else {
        // 기타 오류
        alert('오류가 발생했습니다.');
    }
}
```

### 로딩 상태 관리
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await apiClient.get('/endpoint');
        // 처리
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
};
```

### React Query 사용 (추천)
```javascript
import { useQuery, useMutation } from '@tanstack/react-query';

// 데이터 페칭
const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.get('/transactions').then(res => res.data)
});

// 데이터 변경
const mutation = useMutation({
    mutationFn: (note) => apiClient.patch(`/transactions/${id}/note`, note),
    onSuccess: () => {
        // 성공 후 처리
        queryClient.invalidateQueries(['transactions']);
    }
});
```

---

## 📞 도움이 필요하면

1. 각 화면의 코드 파일 확인
2. 이 가이드의 해당 섹션 참조
3. API 엔드포인트 문서 확인
4. 에러 메시지 확인

**모든 백엔드 연결 포인트는 🔴 표시되어 있습니다!**

---

**마지막 업데이트**: 2024-12-01
**버전**: 1.0.0
