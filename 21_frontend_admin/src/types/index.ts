export interface AnomalyData {
    id: number;
    category: string;
    amount: number;
    date: string;
    reason: string;
    riskLevel: '위험' | '경고' | '주의';
    status: 'pending' | 'approved' | 'rejected';
    userId: string;
    userName: string;
}

// 사용자 관리
export interface UserData {
    id: number;
    email: string;
    name: string;
    birth_date?: string; // ISO date string (YYYY-MM-DD)
    created_at: string;
    is_active: boolean;
    is_superuser: boolean;
    has_recent_activity?: boolean; // 최근 30일 내 거래 여부
}

// 거래 관리
export interface TransactionData {
    id: number;
    merchant: string;
    amount: number;
    category: string;
    transaction_date: string;
    description?: string;
    status: string;
    currency: string;
}

export interface TransactionListResponse {
    total: number;
    page: number;
    page_size: number;
    transactions: TransactionData[];
    data_source: string;
}

export interface TransactionFilters {
    user_id?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
    search?: string;
    page?: number;
    page_size?: number;
}

// ============================================
// Demographics & Churn Analysis Types
// ============================================

export interface ChurnMetrics {
    churn_rate: number;
    total_churned: number;
    active_users: number;
    new_signups: number;
    total_users: number;
}

export interface CategoryAmount {
    category: string;
    amount: number;
}

export interface ConsumptionByAge {
    age_group: string;
    user_count: number;
    total_spending: number;
    avg_transaction_amount: number;
    top_categories: CategoryAmount[];
}

export interface CategoryPreferenceByAge {
    age_group: string;
    top_category: string;
    second_category: string;
    third_category: string;
}

// ============================================
// Analytics Summary Types
// ============================================

export interface AnalyticsSummary {
    total_amount: number;
    total_transactions: number;
    avg_amount: number;
    active_users: number;
    period_start: string;
    period_end: string;
}

export interface TopCategory {
    category: string;
    amount: number;
    percentage: number;
    transaction_count: number;
}

export interface MonthlyTrend {
    month: string;
    amount: number;
    transaction_count: number;
    change_percent: number | null;
}

export interface HourlyData {
    hour: number;
    count: number;
}

export interface DayHeatmap {
    day: string;
    hourly_data: HourlyData[];
}

export interface Insight {
    type: string; // trend, pattern, alert, recommendation
    title: string;
    description: string;
    severity: string; // info, warning, critical
}
