import streamlit as st
import pandas as pd
from datetime import datetime

# 페이지 설정
st.set_page_config(
    page_title="관리자 앱 발표 자료",
    page_icon="🔐",
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
        background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
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
    .warning-badge {
        background-color: #f59e0b;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        display: inline-block;
        margin: 5px;
    }
</style>
""", unsafe_allow_html=True)

# 사이드바
st.sidebar.markdown("## 🔐 발표 목차")
page = st.sidebar.radio("", [
    "🏠 커버",
    "📊 프로젝트 개요",
    "🏗️ 아키텍처",
    "📱 페이지 구조",
    "🎨 컴포넌트",
    "🔌 API 연동",
    "📈 대시보드",
    "💳 소비 분석",
    "🚨 이상거래 탐지",
    "✨ 핵심 기능"
])

# 커버
if page == "🏠 커버":
    st.markdown('<p class="big-font">🔐 Caffeine 관리자 앱</p>', unsafe_allow_html=True)
    st.markdown("### Next.js 16 기반 AI 금융 관리 대시보드")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("""
        <div class="highlight-box">
            <h2>📊 실시간 분석</h2>
            <p>거래 데이터 시각화</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="highlight-box">
            <h2>🤖 AI 이상탐지</h2>
            <p>머신러닝 기반 탐지</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="highlight-box">
            <h2>📈 카테고리 분석</h2>
            <p>소비 패턴 분석</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("### 🛠️ 기술 스택")
    
    tech_cols = st.columns(4)
    with tech_cols[0]:
        st.info("**Frontend**\n- Next.js 16\n- React 19.2\n- TypeScript 5")
    with tech_cols[1]:
        st.success("**UI/UX**\n- Tailwind CSS 4\n- Lucide Icons\n- Recharts 3.5")
    with tech_cols[2]:
        st.warning("**패턴**\n- App Router\n- Server Components\n- Client Components")
    with tech_cols[3]:
        st.error("**날짜/시간**\n- date-fns 4.1\n- clsx 2.1\n- tailwind-merge")

# 프로젝트 개요
elif page == "📊 프로젝트 개요":
    st.markdown('<p class="medium-font">📊 프로젝트 개요</p>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### 🎯 프로젝트 목적")
        st.markdown("""
        <div class="feature-card">
        <h4>금융 데이터 관리 및 분석 대시보드</h4>
        <ul>
            <li>📊 실시간 거래 데이터 모니터링</li>
            <li>🤖 AI 기반 이상 거래 탐지</li>
            <li>💰 카테고리별 소비 패턴 분석</li>
            <li>📈 월별 거래 추이 시각화</li>
            <li>🎯 관리자 친화적 대시보드</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.metric("총 페이지 수", "5개", "+3")
        st.metric("컴포넌트", "10+", "+4")
        st.metric("완성도", "85%", "+15%")
    
    st.markdown("### 📁 프로젝트 구조")
    st.code("""
21_frontend_admin/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # 메인 대시보드 (/)
│   │   ├── layout.tsx          # 전체 레이아웃
│   │   ├── consumption/        # 소비 분석
│   │   │   ├── page.tsx
│   │   │   └── anomalies/      # 이상거래 탐지
│   │   │       └── page.tsx
│   │   ├── summary/            # 분석 요약
│   │   ├── settings/           # 설정
│   │   └── login/              # 로그인
│   │
│   ├── components/             # 재사용 컴포넌트
│   │   ├── Header.tsx
│   │   ├── SidebarNew.tsx
│   │   ├── ClientLayout.tsx
│   │   └── ui/                 # UI 컴포넌트
│   │       ├── DashboardStatCard.tsx
│   │       ├── CategoryTable.tsx
│   │       ├── ConsumptionItem.tsx
│   │       └── AnomalySummaryCard.tsx
│   │
│   ├── api/                    # API 클라이언트
│   │   ├── client.ts
│   │   └── types.ts
│   │
│   ├── types/                  # TypeScript 타입
│   └── utils/                  # 유틸리티 함수
│
└── package.json
    """, language="text")

# 아키텍처
elif page == "🏗️ 아키텍처":
    st.markdown('<p class="medium-font">🏗️ 시스템 아키텍처</p>', unsafe_allow_html=True)
    
    st.markdown("### Next.js App Router 구조")
    st.code("""
┌─────────────────────────────────────┐
│         App Router (Pages)          │
├─────────────────────────────────────┤
│  / (Dashboard) | /consumption       │
│  /consumption/anomalies | /summary  │
│  /settings | /login                 │
└─────────────────────────────────────┘
               ↓ Client/Server Components
┌─────────────────────────────────────┐
│      Layout Layer (Structure)       │
├─────────────────────────────────────┤
│  ClientLayout (Sidebar + Header)    │
│  Server Components (Data Fetching)  │
└─────────────────────────────────────┘
               ↓ Fetch API
┌─────────────────────────────────────┐
│      API Client (Network)           │
├─────────────────────────────────────┤
│  getFullAnalysis | getCategoryData  │
│  getAnomalies | getSummary          │
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
        st.markdown("#### 1. Server/Client 분리")
        st.code("""
// Server Component (기본)
export default async function Page() {
  const data = await fetchData();
  return <Display data={data} />
}

// Client Component (상호작용)
"use client";
export default function Interactive() {
  const [state, setState] = useState();
  return <Button onClick={...} />
}
        """, language="typescript")
    
    with col2:
        st.markdown("#### 2. Layout 공유")
        st.code("""
// layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
        """, language="typescript")
    
    st.markdown("### 📊 데이터 흐름")
    
    tab1, tab2, tab3 = st.tabs(["초기 로딩", "상태 관리", "에러 처리"])
    
    with tab1:
        st.code("""
// 1. 컴포넌트 마운트
useEffect(() => {
  fetchDashboardData();
}, [selectedMonth]);

// 2. API 호출
const analysis = await getFullAnalysis(year, month);

// 3. State 업데이트
setStats(transformedData);
setLineData(chartData);

// 4. UI 리렌더링
        """, language="typescript")
    
    with tab2:
        st.code("""
const [stats, setStats] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [selectedMonth, setSelectedMonth] = useState({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
});

// 월 변경 시 자동 갱신
<select onChange={(e) => setSelectedMonth(...)}>
        """, language="typescript")
    
    with tab3:
        st.code("""
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('데이터 로드 실패:', error);
  setDataSource('[ERROR]');
} finally {
  setLoading(false);
}
        """, language="typescript")

# 페이지 구조
elif page == "📱 페이지 구조":
    st.markdown('<p class="medium-font">📱 페이지 구조</p>', unsafe_allow_html=True)
    
    pages_data = pd.DataFrame({
        "경로": [
            "/",
            "/consumption",
            "/consumption/anomalies",
            "/summary",
            "/settings",
            "/login"
        ],
        "페이지명": [
            "메인 대시보드",
            "소비 분석",
            "이상 거래 탐지",
            "분석 요약",
            "설정",
            "로그인"
        ],
        "주요 기능": [
            "통계 카드, 차트, 카테고리 테이블",
            "파이 차트, 소비 항목 리스트",
            "이상 거래 감지 및 리포트",
            "전체 분석 요약",
            "관리자 설정",
            "로그인 폼"
        ],
        "컴포넌트": [
            "DashboardStatCard, LineChart, BarChart",
            "PieChart, ConsumptionItem",
            "AnomalySummaryCard, 필터",
            "요약 카드",
            "설정 폼",
            "로그인 폼"
        ],
        "상태": ["✅", "✅", "✅", "✅", "✅", "✅"]
    })
    
    st.dataframe(pages_data, use_container_width=True, hide_index=True)
    
    st.markdown("### 🎯 메인 대시보드 상세")
    
    tab1, tab2, tab3 = st.tabs(["데이터 로딩", "차트 구성", "테이블 렌더링"])
    
    with tab1:
        st.code("""
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const analysis = await getFullAnalysis(
      selectedMonth.year, 
      selectedMonth.month
    );
    
    setDataSource(analysis.data_source || 'DB');
    
    // 통계 카드 데이터 변환
    const summary = analysis.summary;
    setStats([
      {
        title: '총 거래 건수',
        value: summary.transaction_count.toLocaleString() + '건',
        trend: summary.transaction_count_mom_change + '% 전월 대비',
        icon: ShoppingCart,
        color: 'text-blue-600'
      },
      // ... more stats
    ]);
    
  } catch (error) {
    console.error('데이터 로드 실패:', error);
  } finally {
    setLoading(false);
  }
};
        """, language="typescript")
    
    with tab2:
        st.code("""
// 월별 추이 차트
const lineChartData = monthlyTrend.map((item) => ({
  name: item.month.split('-')[1] + '월',
  value: Math.round(item.total_amount / 10000),
}));

<ResponsiveContainer width="100%" height="100%">
  <LineChart data={lineData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="#3b82f6" 
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
        """, language="typescript")
    
    with tab3:
        st.code("""
// 카테고리 테이블 데이터
const tableRows = categories.map((item) => ({
  category: item.category,
  amount: '₩' + (item.total_amount >= 100000000
    ? (item.total_amount / 100000000).toFixed(1) + '억'
    : (item.total_amount / 10000).toFixed(1) + '만'),
  count: item.transaction_count.toLocaleString() + '건',
  ratio: item.percentage.toFixed(1) + '%'
}));

{tableData.length > 0 && <CategoryTable data={tableData} />}
        """, language="typescript")

# 컴포넌트
elif page == "🎨 컴포넌트":
    st.markdown('<p class="medium-font">🎨 재사용 컴포넌트</p>', unsafe_allow_html=True)
    
    components = pd.DataFrame({
        "컴포넌트": [
            "DashboardStatCard",
            "CategoryTable",
            "ConsumptionItem",
            "AnomalySummaryCard",
            "Header",
            "SidebarNew",
            "ClientLayout",
            "FilterPanel",
            "ExportButton",
            "ChartDetailModal"
        ],
        "타입": [
            "UI 컴포넌트",
            "UI 컴포넌트",
            "UI 컴포넌트",
            "UI 컴포넌트",
            "레이아웃",
            "레이아웃",
            "레이아웃",
            "기능",
            "기능",
            "기능"
        ],
        "용도": [
            "통계 표시 카드",
            "카테고리별 테이블",
            "소비 항목 표시",
            "이상거래 요약 카드",
            "상단 헤더",
            "사이드바 네비게이션",
            "클라이언트 레이아웃 래퍼",
            "필터 패널",
            "데이터 내보내기",
            "차트 상세 모달"
        ],
        "상태": ["✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"]
    })
    
    st.dataframe(components, use_container_width=True, hide_index=True)
    
    st.markdown("### 📦 주요 컴포넌트 상세")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### DashboardStatCard")
        st.code("""
interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  icon: any;
  color?: string;
  trendColor?: string;
}

export function DashboardStatCard({
  title, value, trend, icon: Icon,
  color = "text-blue-600",
  trendColor = "text-gray-500"
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl 
                    p-6 shadow-sm 
                    border border-gray-100">
      <div className="flex items-center 
                      justify-between mb-4">
        <h3 className="text-sm font-medium 
                       text-gray-500">
          {title}
        </h3>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
      <p className="text-3xl font-bold 
                    text-gray-800">
        {value}
      </p>
      <p className={`text-sm mt-2 ${trendColor}`}>
        {trend}
      </p>
    </div>
  );
}
        """, language="typescript")
    
    with col2:
        st.markdown("#### SidebarNew")
        st.code("""
const menuItems = [
  { 
    name: '대시보드', 
    href: '/', 
    icon: LayoutDashboard 
  },
  { 
    name: '소비 분석', 
    href: '/consumption', 
    icon: PieChart 
  },
  { 
    name: '이상 거래 탐지', 
    href: '/consumption/anomalies', 
    icon: AlertTriangle 
  },
  { 
    name: '분석 요약', 
    href: '/summary', 
    icon: FileText 
  },
  { 
    name: '설정', 
    href: '/settings', 
    icon: Settings 
  }
];

export default function SidebarNew() {
  const pathname = usePathname();
  
  return (
    <div className="w-64 bg-[#1e293b] 
                    text-white h-full">
      {menuItems.map((item) => (
        <Link 
          href={item.href}
          className={clsx(
            pathname === item.href && 
            'bg-blue-600 border-r-4'
          )}
        >
          <item.icon className="w-5 h-5" />
          {item.name}
        </Link>
      ))}
    </div>
  );
}
        """, language="typescript")

# API 연동
elif page == "🔌 API 연동":
    st.markdown('<p class="medium-font">🔌 API 연동</p>', unsafe_allow_html=True)
    
    st.markdown("### API 엔드포인트")
    
    apis = pd.DataFrame({
        "메서드": ["GET", "GET", "GET", "GET", "POST"],
        "엔드포인트": [
            "/api/analysis/full",
            "/api/analysis/categories",
            "/api/analysis/anomalies",
            "/api/analysis/summary",
            "/api/analysis/export"
        ],
        "설명": [
            "전체 분석 데이터",
            "카테고리별 분석",
            "이상 거래 목록",
            "분석 요약",
            "데이터 내보내기"
        ],
        "파라미터": [
            "year, month",
            "year, month",
            "start_date, end_date",
            "year, month",
            "format, filters"
        ],
        "상태": ["✅", "✅", "✅", "✅", "✅"]
    })
    
    st.dataframe(apis, use_container_width=True, hide_index=True)
    
    st.markdown("### 📡 API 클라이언트 구조")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### client.ts (API 함수)")
        st.code("""
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:8081';

export async function getFullAnalysis(
  year: number, 
  month: number
) {
  const response = await fetch(
    `${API_BASE_URL}/api/analysis/full?` +
    `year=${year}&month=${month}`,
    { cache: 'no-store' }
  );
  
  if (!response.ok) {
    throw new Error('분석 데이터 로드 실패');
  }
  
  return response.json();
}

export async function getCategoryBreakdown(
  year: number, 
  month: number
) {
  const response = await fetch(
    `${API_BASE_URL}/api/analysis/categories?` +
    `year=${year}&month=${month}`
  );
  
  return response.json();
}
        """, language="typescript")
    
    with col2:
        st.markdown("#### types.ts (타입 정의)")
        st.code("""
export interface AnalysisResponse {
  data_source: string;
  summary: {
    transaction_count: number;
    total_spending: number;
    average_transaction: number;
    top_category: string;
    month_over_month_change: number;
    transaction_count_mom_change: number;
  };
  monthly_trend: Array<{
    month: string;
    total_amount: number;
  }>;
  category_breakdown: Array<{
    category: string;
    total_amount: number;
    transaction_count: number;
    percentage: number;
  }>;
}

export interface AnomalyData {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  anomaly_score: number;
  date: string;
}
        """, language="typescript")

# 대시보드
elif page == "📈 대시보드":
    st.markdown('<p class="medium-font">📈 메인 대시보드 페이지</p>', unsafe_allow_html=True)
    
    st.markdown("### 전체 구조")
    st.code("""
대시보드 레이아웃
├── 헤더 섹션
│   ├── 페이지 제목 & 설명
│   ├── 월 선택 드롭다운
│   ├── 데이터 소스 배지 (DB/Cache)
│   └── 새로고침 버튼
│
├── 통계 카드 그리드 (4열)
│   ├── 총 거래 건수
│   ├── 총 거래액
│   ├── 평균 거래액
│   └── 최다 카테고리
│
├── 차트 그리드 (2열)
│   ├── 월별 거래 추이 (LineChart)
│   └── 카테고리별 소비 (BarChart)
│
└── 카테고리 테이블
    ├── 카테고리명
    ├── 거래액
    ├── 거래 건수
    └── 비율
    """, language="text")
    
    st.markdown("### 주요 기능")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        <div class="feature-card">
        <h3>📊 실시간 데이터</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>FastAPI 연동</li>
            <li>월별 필터링</li>
            <li>자동 갱신</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="feature-card">
        <h3>📈 시각화</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>Recharts 통합</li>
            <li>반응형 차트</li>
            <li>인터랙티브 툴팁</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="feature-card">
        <h3>🎯 통계</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>전월 대비 변화</li>
            <li>카테고리 분석</li>
            <li>거래 패턴</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("### 코드 예시: 통계 카드 생성")
    st.code("""
const summary = analysis.summary;

setStats([
  {
    title: '총 거래 건수',
    value: summary.transaction_count.toLocaleString() + '건',
    trend: `${summary.transaction_count_mom_change > 0 ? '+' : ''}${summary.transaction_count_mom_change.toFixed(1)}% 전월 대비`,
    icon: ShoppingCart,
    color: 'text-blue-600',
    trendColor: summary.transaction_count_mom_change > 0 
      ? 'text-green-500' 
      : 'text-red-500'
  },
  {
    title: '총 거래액',
    value: '₩' + (summary.total_spending / 10000).toFixed(1) + '만',
    trend: `${summary.month_over_month_change > 0 ? '+' : ''}${summary.month_over_month_change.toFixed(1)}% 전월 대비`,
    icon: DollarSign,
    color: 'text-blue-600',
    trendColor: summary.month_over_month_change > 0 
      ? 'text-green-500' 
      : 'text-red-500'
  }
]);
    """, language="typescript")

# 소비 분석
elif page == "💳 소비 분석":
    st.markdown('<p class="medium-font">💳 소비 분석 페이지</p>', unsafe_allow_html=True)
    
    st.markdown("### 페이지 구성")
    st.code("""
/consumption 페이지
├── 헤더 섹션
│   ├── 페이지 제목
│   ├── 월 선택
│   └── 새로고침
│
├── 파이 차트
│   ├── 카테고리별 비율
│   ├── 색상 구분
│   └── Legend
│
└── 소비 항목 리스트
    ├── ConsumptionItem 컴포넌트
    ├── 카테고리, 금액, 건수
    └── 비율 표시
    """, language="text")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 파이 차트 구현")
        st.code("""
const COLORS = [
  '#1e293b', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#f59e0b', '#10b981'
];

<ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie
      data={pieData}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={(entry) => entry.name}
      outerRadius={80}
      fill="#8884d8"
      dataKey="value"
    >
      {pieData.map((entry, index) => (
        <Cell 
          key={`cell-${index}`} 
          fill={COLORS[index % COLORS.length]} 
        />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
</ResponsiveContainer>
        """, language="typescript")
    
    with col2:
        st.markdown("#### 소비 항목 리스트")
        st.code("""
{items.map((item, index) => (
  <ConsumptionItem
    key={index}
    category={item.category}
    amount={item.amount}
    count={item.count}
    ratio={item.ratio}
    color={COLORS[index % COLORS.length]}
  />
))}

// ConsumptionItem 컴포넌트
export function ConsumptionItem({
  category, amount, count, ratio, color
}) {
  return (
    <div className="flex items-center 
                    justify-between p-4 
                    border-b">
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>{category}</span>
      </div>
      <div className="text-right">
        <p className="font-bold">{amount}</p>
        <p className="text-sm text-gray-500">
          {count} · {ratio}
        </p>
      </div>
    </div>
  );
}
        """, language="typescript")

# 이상거래 탐지
elif page == "🚨 이상거래 탐지":
    st.markdown('<p class="medium-font">🚨 이상 거래 탐지</p>', unsafe_allow_html=True)
    
    st.markdown("### AI 기반 이상거래 탐지")
    st.markdown("""
    <div class="feature-card">
    <h4>머신러닝 기반 탐지 시스템</h4>
    <ul>
        <li>🤖 XGBoost 모델 활용</li>
        <li>📊 Anomaly Score 기반 필터링</li>
        <li>🔍 실시간 거래 모니터링</li>
        <li>📝 상세 리포트 생성</li>
    </ul>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 페이지 구조")
    st.code("""
/consumption/anomalies 페이지
├── 헤더 섹션
│   ├── 페이지 제목 & 설명
│   └── 필터/정렬 컨트롤
│
├── 요약 카드 그리드
│   ├── 총 이상거래 건수
│   ├── 차단된 거래
│   ├── 평균 이상 점수
│   └── 최근 24시간 탐지
│
└── 이상거래 리스트
    ├── 거래 정보 (가맹점, 금액)
    ├── 이상 점수 배지
    ├── 날짜/시간
    └── 액션 버튼 (상세보기, 신고)
    """, language="text")
    
    tab1, tab2 = st.tabs(["주요 기능", "코드 예시"])
    
    with tab1:
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("""
            <div class="feature-card">
            <h3>🔍 탐지 기능</h3>
            <ul>
                <li>실시간 이상 패턴 감지</li>
                <li>임계값 기반 필터링</li>
                <li>카테고리별 분류</li>
                <li>시간대별 분석</li>
            </ul>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown("""
            <div class="feature-card">
            <h3>📊 리포트</h3>
            <ul>
                <li>상세 거래 내역</li>
                <li>이상 점수 시각화</li>
                <li>패턴 분석 차트</li>
                <li>CSV 내보내기</li>
            </ul>
            </div>
            """, unsafe_allow_html=True)
    
    with tab2:
        st.code("""
const fetchAnomalies = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analysis/anomalies?` +
      `start_date=${startDate}&end_date=${endDate}`
    );
    
    const data = await response.json();
    
    // 이상거래 필터링 (score > 0.7)
    const highRiskAnomalies = data.anomalies.filter(
      (item) => item.anomaly_score > 0.7
    );
    
    setAnomalies(highRiskAnomalies);
    
    // 요약 통계
    setSummary({
      total: highRiskAnomalies.length,
      blocked: highRiskAnomalies.filter(
        a => a.status === 'blocked'
      ).length,
      avgScore: (
        highRiskAnomalies.reduce(
          (sum, a) => sum + a.anomaly_score, 0
        ) / highRiskAnomalies.length
      ).toFixed(2)
    });
    
  } catch (error) {
    console.error('이상거래 로드 실패:', error);
  }
};

// 이상거래 카드 렌더링
{anomalies.map((anomaly) => (
  <AnomalySummaryCard
    key={anomaly.id}
    merchant={anomaly.merchant}
    amount={anomaly.amount}
    category={anomaly.category}
    score={anomaly.anomaly_score}
    date={anomaly.date}
    onReport={() => handleReport(anomaly.id)}
  />
))}
        """, language="typescript")

# 핵심 기능
else:  # 핵심 기능
    st.markdown('<p class="medium-font">✨ 핵심 기능</p>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        <div class="feature-card">
        <h3>🏗️ 아키텍처</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>Next.js 16 App Router</li>
            <li>Server/Client 분리</li>
            <li>TypeScript 전면 도입</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="feature-card">
        <h3>📊 데이터</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>실시간 API 연동</li>
            <li>월별 데이터 필터링</li>
            <li>캐시 최적화</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div class="feature-card">
        <h3>🎨 UI/UX</h3>
        <p><span class="success-badge">완료</span></p>
        <ul>
            <li>Tailwind CSS 4</li>
            <li>Recharts 차트</li>
            <li>반응형 디자인</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("### 🎯 구현 완료 항목")
    
    completed = [
        ("✅ Next.js App Router", "파일 기반 라우팅, 레이아웃 공유"),
        ("✅ TypeScript 통합", "타입 안전성, 인텔리센스"),
        ("✅ Tailwind CSS 4", "유틸리티 우선 스타일링"),
        ("✅ Recharts 통합", "LineChart, BarChart, PieChart"),
        ("✅ API 클라이언트", "getFullAnalysis, getCategoryData"),
        ("✅ 대시보드 페이지", "통계 카드, 차트, 테이블"),
        ("✅ 소비 분석 페이지", "파이 차트, 소비 항목"),
        ("✅ 이상거래 탐지", "ML 기반 탐지, 필터링"),
        ("✅ 컴포넌트 라이브러리", "10+ 재사용 컴포넌트"),
        ("✅ 반응형 레이아웃", "데스크톱/태블릿/모바일")
    ]
    
    for title, desc in completed:
        st.success(f"**{title}** - {desc}")
    
    st.markdown("### 📊 기술 스택 상세")

    
    tech_stack = pd.DataFrame({
        "카테고리": [
            "프레임워크",
            "언어",
            "UI 라이브러리",
            "차트",
            "아이콘",
            "날짜",
            "스타일링",
            "빌드"
        ],
        "기술": [
            "Next.js 16.0.6",
            "TypeScript 5",
            "React 19.2",
            "Recharts 3.5.1",
            "Lucide React 0.555",
            "date-fns 4.1.0",
            "Tailwind CSS 4",
            "Turbopack"
        ],
        "용도": [
            "App Router, SSR/SSG",
            "타입 안전성",
            "UI 컴포넌트",
            "데이터 시각화",
            "아이콘 라이브러리",
            "날짜 포맷팅",
            "유틸리티 CSS",
            "빠른 개발 빌드"
        ]
    })
    
    st.dataframe(tech_stack, use_container_width=True, hide_index=True)

# 푸터
st.markdown("---")
st.markdown("""
<div style='text-align: center; padding: 20px;'>
    <h3>🔐 Caffeine 관리자 앱</h3>
    <p>Next.js 16 | React 19 | TypeScript 5 | Tailwind CSS 4 | Recharts</p>
    <p><strong>2025-12-12</strong> | Version 1.0.0</p>
</div>
""", unsafe_allow_html=True)
