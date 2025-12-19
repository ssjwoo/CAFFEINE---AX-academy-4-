import streamlit as st
import pandas as pd
from datetime import datetime

# 페이지 설정
st.set_page_config(
    page_title="사용자 앱 발표 자료",
    page_icon="📱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS 스타일
st.markdown("""
<style>
    .big-font {
        font-size:50px !important;
        font-weight: bold;
        color: #1e3a8a;
        text-align: center;
        margin-bottom: 30px;
    }
    .medium-font {
        font-size:30px !important;
        font-weight: 600;
        color: #2563eb;
        margin-top: 20px;
    }
    .highlight-box {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 15px;
        color: white;
        margin: 10px 0;
    }
    .code-box {
        background-color: #1e293b;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
    }
    .feature-card {
        background-color: #f0f9ff;
        border-left: 5px solid #3b82f6;
        padding: 15px;
        margin: 10px 0;
        border-radius: 5px;
    }
    .success-badge {
        background-color: #10b981;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        display: inline-block;
        margin: 5px;
    }
</style>
""", unsafe_allow_html=True)

# 사이드바
st.sidebar.markdown("## 📱 발표 목차")
page = st.sidebar.radio("", [
    "🏠 커버",
    "📊 프로젝트 개요",
    "🏗️ 아키텍처",
    "🔐 인증 시스템",
    "💳 거래 관리",
    "📱 화면 구성",
    "🔌 API 연동",
    "✨ 핵심 기능",
    "📈 데이터 시각화"
])

# 커버
if page == "🏠 커버":
    st.markdown('<p class="big-font">📱 Caffeine 사용자 앱</p>', unsafe_allow_html=True)
    st.markdown("### React Native 기반 AI 금융 관리 앱")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("""
        <div class="highlight-box">
            <h2>📊 대시보드</h2>
            <p>실시간 소비 분석</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="highlight-box">
            <h2>🤖 AI 예측</h2>
            <p>맞춤 쿠폰 추천</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="highlight-box">
            <h2>💳 거래 관리</h2>
            <p>스마트 거래 추적</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("### 🛠️ 기술 스택")
    
    tech_cols = st.columns(4)
    with tech_cols[0]:
        st.info("**Frontend**\n- React Native\n- Expo SDK 54\n- React Navigation")
    with tech_cols[1]:
        st.success("**상태 관리**\n- Context API\n- AsyncStorage\n- Custom Hooks")
    with tech_cols[2]:
        st.warning("**네트워크**\n- Axios\n- REST API\n- FormData")
    with tech_cols[3]:
        st.error("**UI/UX**\n- Custom Components\n- Charts\n- Animations")

# 프로젝트 개요
elif page == "📊 프로젝트 개요":
    st.markdown('<p class="medium-font">📊 프로젝트 개요</p>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### 🎯 프로젝트 목적")
        st.markdown("""
        <div class="feature-card">
        <h4>AI 기반 스마트 금융 관리</h4>
        <ul>
            <li>💰 실시간 거래 분석 및 시각화</li>
            <li>🤖 ML 기반 다음 소비 예측</li>
            <li>🎟️ 개인화된 쿠폰 추천</li>
            <li>📊 월별/카테고리별 소비 분석</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.metric("총 화면 수", "7개", "+2")
        st.metric("API 엔드포인트", "15+", "+5")
        st.metric("완성도", "90%", "+20%")
    
    st.markdown("### 📁 프로젝트 구조")
    st.code("""
20_frontend_user/
├── App.js                 # 앱 엔트리
├── src/
│   ├── api/              # API 계층
│   │   ├── client.js
│   │   ├── transactions.js
│   │   └── ml.js
│   ├── contexts/         # 상태 관리
│   │   ├── AuthContext.js
│   │   └── TransactionContext.js
│   ├── screens/          # 화면
│   │   ├── DashboardScreen.js
│   │   ├── TransactionScreen.js
│   │   └── ProfileScreen.js
│   ├── components/       # 재사용 컴포넌트
│   └── utils/           # 유틸리티
    """, language="text")

# 아키텍처
elif page == "🏗️ 아키텍처":
    st.markdown('<p class="medium-font">🏗️ 시스템 아키텍처</p>', unsafe_allow_html=True)
    
    st.markdown("### 전체 구조")
    st.code("""
┌─────────────────────────────────────┐
│        UI Layer (Screens)           │
├─────────────────────────────────────┤
│  LoginScreen | DashboardScreen      │
│  TransactionScreen | ProfileScreen  │
└─────────────────────────────────────┘
              ↓ useContext
┌─────────────────────────────────────┐
│      Context Layer (State)          │
├─────────────────────────────────────┤
│  AuthContext | TransactionContext   │
│  ThemeContext                        │
└─────────────────────────────────────┘
              ↓ API Calls
┌─────────────────────────────────────┐
│      API Layer (Network)            │
├─────────────────────────────────────┤
│  client.js | transactions.js        │
│  ml.js | analysis.js                │
└─────────────────────────────────────┘
              ↓ HTTP
┌─────────────────────────────────────┐
│      Backend (FastAPI)              │
│      PostgreSQL (Data)              │
└─────────────────────────────────────┘
    """, language="text")
    
    st.markdown("### 🔑 핵심 패턴")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 1. Context API 패턴")
        st.code("""
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

// 사용
const { user } = useAuth();
        """, language="javascript")
    
    with col2:
        st.markdown("#### 2. AsyncStorage 캐싱")
        st.code("""
useEffect(() => {
  // 캐시 먼저 로드
  loadCachedData();
  
  // 서버에서 최신 데이터
  fetchFromServer();
}, []);

// 빠른 초기 화면 표시
// 오프라인 지원
        """, language="javascript")

# 인증 시스템
elif page == "🔐 인증 시스템":
    st.markdown('<p class="medium-font">🔐 인증 시스템</p>', unsafe_allow_html=True)
    
    st.markdown("### AuthContext 구조")
    
    tab1, tab2, tab3 = st.tabs(["로그인", "회원가입", "세션 관리"])
    
    with tab1:
        st.code("""
const login = async (email, password) => {
  // 1. API 호출 (향후)
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  const { token, user } = await response.json();
  
  // 2. 토큰 저장
  await AsyncStorage.setItem('authToken', token);
  
  // 3. 사용자 정보 저장
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  // 4. State 업데이트 → 자동 화면 전환
  setUser(user);
  
  return { success: true };
};
        """, language="javascript")
    
    with tab2:
        st.code("""
const signup = async (name, email, password) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  
  if (response.ok) {
    // 회원가입 성공 → 자동 로그인
    return await login(email, password);
  }
};
        """, language="javascript")
    
    with tab3:
        st.code("""
// 앱 시작 시 실행
const checkLoginStatus = async () => {
  const userData = await AsyncStorage.getItem('user');
  
  if (userData) {
    // 자동 로그인
    setUser(JSON.parse(userData));
  }
  
  setLoading(false);
};
        """, language="javascript")
    
    st.markdown("### 🔄 인증 흐름")
    st.code("""
1. 사용자 로그인 → login(email, password)
2. API 호출 → 토큰 받기
3. AsyncStorage 저장 → 세션 유지
4. setUser(userData) → state 업데이트
5. AppContent 감지 → AuthStack → MainTabs 전환
    """, language="text")

# 거래 관리
elif page == "💳 거래 관리":
    st.markdown('<p class="medium-font">💳 거래 데이터 관리</p>', unsafe_allow_html=True)
    
    st.markdown("### TransactionContext")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 데이터 로드")
        st.code("""
const loadTransactions = async () => {
  // API 호출
  const response = await getTransactions({
    user_id: 1,
    page_size: 100
  });
  
  // 데이터 변환
  const formatted = response.transactions.map(t => ({
    id: String(t.id),
    merchant: t.merchant,
    amount: t.amount,
    category: t.category,
    date: t.transaction_date
  }));
  
  // 캐시 저장
  await AsyncStorage.setItem(
    'transactions',
    JSON.stringify(formatted)
  );
  
  setTransactions(formatted);
};
        """, language="javascript")
    
    with col2:
        st.markdown("#### Optimistic Update")
        st.code("""
const updateNote = async (id, note) => {
  // 1. 즉시 UI 업데이트
  setTransactions(prev => 
    prev.map(t => 
      t.id === id 
        ? { ...t, notes: note } 
        : t
    )
  );
  
  try {
    // 2. 서버 저장
    await apiUpdateNote(id, note);
  } catch (error) {
    // 3. 실패 시 롤백
    loadTransactions();
  }
};
        """, language="javascript")
    
    st.markdown("### 📊 AI 예측 기능")
    st.code("""
const predictNextPurchase = async () => {
  // 1. CSV 변환
  const csvContent = transactions.map(t => [
    t.date, t.merchant, t.amount, t.category
  ].join(',')).join('\\n');
  
  // 2. Blob 생성
  const blob = new Blob([csvContent], { type: 'text/csv' });
  
  // 3. ML API 호출
  const formData = new FormData();
  formData.append('file', blob);
  
  const result = await apiClient.post('/ml/predict-next', formData);
  
  return result.data; // 예측된 다음 소비 + 쿠폰 정보
};
    """, language="javascript")

# 화면 구성
elif page == "📱 화면 구성":
    st.markdown('<p class="medium-font">📱 화면 구성</p>', unsafe_allow_html=True)
    
    screens = pd.DataFrame({
        "화면": ["대시보드", "거래내역", "쿠폰함", "프로필", "로그인", "회원가입"],
        "주요 기능": [
            "요약 통계, 월별 차트",
            "거래 리스트, 검색",
            "AI 쿠폰 목록",
            "설정, 다크모드",
            "이메일 로그인",
            "회원가입 폼"
        ],
        "상태": ["✅", "✅", "✅", "✅", "✅", "✅"]
    })
    
    st.dataframe(screens, use_container_width=True, hide_index=True)
    
    st.markdown("### 🎨 DashboardScreen 상세")
    
    tab1, tab2, tab3 = st.tabs(["요약 계산", "월별 집계", "차트 렌더링"])
    
    with tab1:
        st.code("""
const calculateSummary = (txns) => {
  const totalSpending = txns.reduce(
    (sum, t) => sum + Math.abs(t.amount), 0
  );
  
  const categoryMap = {};
  txns.forEach(t => {
    categoryMap[t.category] = 
      (categoryMap[t.category] || 0) + t.amount;
  });
  
  return {
    total_spending: totalSpending,
    total_transactions: txns.length,
    average_transaction: totalSpending / txns.length,
    most_used_category: Object.keys(categoryMap)[0]
  };
};
        """, language="javascript")
    
    with tab2:
        st.code("""
const calculateMonthlyData = (txns) => {
  const monthlyMap = {};
  
  txns.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM
    monthlyMap[month] = (monthlyMap[month] || 0) + t.amount;
  });
  
  return Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)  // 최근 6개월
    .map(([month, amount]) => ({ month, total_amount: amount }));
};
        """, language="javascript")
    
    with tab3:
        st.code("""
<LineChart
  data={{
    labels: monthlyData.map(d => d.month),
    datasets: [{
      data: monthlyData.map(d => d.amount / 10000)
    }]
  }}
  width={screenWidth}
  height={200}
  chartConfig={{
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`
  }}
  bezier
  onDataPointClick={(data) => showTooltip(data)}
/>
        """, language="javascript")

# API 연동
elif page == "🔌 API 연동":
    st.markdown('<p class="medium-font">🔌 API 연동</p>', unsafe_allow_html=True)
    
    st.markdown("### API 엔드포인트")
    
    apis = pd.DataFrame({
        "메서드": ["GET", "PATCH", "POST", "POST", "GET"],
        "엔드포인트": [
            "/api/transactions",
            "/api/transactions/:id/note",
            "/api/transactions/:id/anomaly-report",
            "/ml/predict-next",
            "/api/analysis/categories"
        ],
        "설명": [
            "거래 목록 조회",
            "메모 수정",
            "이상거래 신고",
            "AI 다음 소비 예측",
            "카테고리별 분석"
        ],
        "상태": ["✅", "✅", "✅", "✅", "✅"]
    })
    
    st.dataframe(apis, use_container_width=True, hide_index=True)
    
    st.markdown("### 📡 API 클라이언트")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### client.js")
        st.code("""
import axios from 'axios';

const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://localhost:8081';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});
        """, language="javascript")
    
    with col2:
        st.markdown("#### transactions.js")
        st.code("""
export const getTransactions = async (params) => {
  const response = await apiClient.get(
    '/api/transactions',
    { params }
  );
  return response.data;
};

export const updateTransactionNote = async (id, note) => {
  const response = await apiClient.patch(
    `/api/transactions/${id}/note`,
    { description: note }
  );
  return response.data;
};
        """, language="javascript")

# 핵심 기능
elif page == "✨ 핵심 기능":
    st.markdown('<p class="medium-font">✨ 핵심 기능</p>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        <div class="feature-card">
        <h3>🔐 인증</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>Context API 기반</li>
            <li>AsyncStorage 세션</li>
            <li>자동 로그인</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="feature-card">
        <h3>💳 거래 관리</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>실시간 동기화</li>
            <li>Optimistic Update</li>
            <li>오프라인 캐싱</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="feature-card">
        <h3>🤖 AI 예측</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>CSV 변환</li>
            <li>ML API 연동</li>
            <li>쿠폰 추천</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("### 🎯 구현 완료 항목")
    
    completed = [
        ("✅ AuthContext 구현", "로그인, 회원가입, 로그아웃"),
        ("✅ TransactionContext 구현", "거래 데이터 캐싱 및 동기화"),
        ("✅ API 계층 분리", "client, transactions, ml 모듈"),
        ("✅ 대시보드 구현", "요약 통계, 차트, 카테고리 분석"),
        ("✅ Pull-to-Refresh", "새로고침 기능"),
        ("✅ AI 예측 기능", "CSV 변환 및 ML API 호출"),
        ("✅ UI 컴포넌트", "AnimatedButton, EmptyState, Skeleton"),
        ("✅ 입력 검증", "이메일, 비밀번호, 카드번호")
    ]
    
    for title, desc in completed:
        st.success(f"**{title}** - {desc}")

# 데이터 시각화
else:  # 데이터 시각화
    st.markdown('<p class="medium-font">📈 데이터 시각화</p>', unsafe_allow_html=True)
    
    st.markdown("### 📊 데이터 흐름")
    st.code("""
┌─────────────┐
│ 사용자 조작  │
└──────┬──────┘
       ↓
┌─────────────┐
│ UI 이벤트    │  (버튼 클릭, Pull-to-Refresh)
└──────┬──────┘
       ↓
┌─────────────────────┐
│ Context Hook 호출    │  useAuth(), useTransactions()
└──────┬──────────────┘
       ↓
┌─────────────────┐
│ State 업데이트   │  setUser(), setTransactions()
└──────┬──────────┘
       ↓
┌─────────────────┐
│ API 호출        │  getTransactions(), predictNext()
└──────┬──────────┘
       ↓
┌─────────────────┐
│ Backend         │  FastAPI
└──────┬──────────┘
       ↓
┌─────────────────┐
│ Database        │  PostgreSQL
└──────┬──────────┘
       ↓
┌─────────────────┐
│ Response        │  JSON
└──────┬──────────┘
       ↓
┌─────────────────┐
│ UI 렌더링       │  React Native Components
└─────────────────┘
    """, language="text")
    
    st.markdown("### 🎨 컴포넌트 구조")
    
    components = pd.DataFrame({
        "컴포넌트": [
            "DashboardScreen",
            "TransactionScreen",
            "CouponScreen",
            "ProfileScreen"
        ],
        "상태": ["Context", "Props, State", "Context", "Context, State"],
        "데이터": ["거래 요약", "거래 리스트", "쿠폰 리스트", "사용자 정보"],
        "차트": ["LineChart", "-", "-", "-"]
    })
    
    st.dataframe(components, use_container_width=True, hide_index=True)

# 푸터
st.markdown("---")
st.markdown("""
<div style='text-align: center; padding: 20px;'>
    <h3>📱 Caffeine 사용자 앱</h3>
    <p>React Native (Expo) | Context API | AsyncStorage | Axios</p>
    <p><strong>2025-12-12</strong> | Version 1.0.0</p>
</div>
""", unsafe_allow_html=True)
