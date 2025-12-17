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

export interface AgeGroupData {
    age_group: string;
    count: number;
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
