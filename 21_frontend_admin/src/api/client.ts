// API Client for Admin Dashboard
// 환경에 따라 API URL 자동 결정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface FetchOptions extends RequestInit {
    timeout?: number;
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}) {
    const { timeout = 30000, headers = {}, ...fetchOptions } = options;  // Increased to 30s for analytics APIs

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    // Auto-inject token
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const authHeaders: Record<string, string> = {};
    if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers: {
                ...headers,
                ...authHeaders,
            },
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export const apiClient = {
    async get(endpoint: string) {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    },

    async post(endpoint: string, data: any) {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    },

    async put(endpoint: string, data: any) {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    },

    async patch(endpoint: string, data: any) {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API Error:${response.status}`);
        }
        return response.json();
    },

    async delete(endpoint: string) {
        const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    },
};

// Analysis API
export async function getFullAnalysis(year?: number, month?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const queryString = params.toString();
    return apiClient.get(`/api/analysis/full${queryString ? '?' + queryString : ''}`);
}

export async function getDashboardStats() {
    return apiClient.get('/api/analysis/summary');
}


export async function getCategoryBreakdown(userId?: number, months = 1, year?: number, month?: number) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    params.append('months', months.toString());
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const queryString = params.toString();
    return apiClient.get(`/api/analysis/categories${queryString ? '?' + queryString : ''}`);
}


export async function getMonthlyTrend(months = 6) {
    return apiClient.get(`/api/analysis/monthly-trend?months=${months}`);
}

// Transactions API (확장)
export async function getTransactions(filters?: {
    user_id?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
    search?: string;
    page?: number;
    page_size?: number;
}) {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
    }
    const queryString = params.toString();
    return apiClient.get(`/api/transactions${queryString ? '?' + queryString : ''}`);
}

export async function getTransactionDetail(transactionId: number) {
    return apiClient.get(`/api/transactions/${transactionId}`);
}

export async function updateTransactionNote(transactionId: number, description: string) {
    return apiClient.patch(`/api/transactions/${transactionId}/note`, { description });
}

export async function reportTransactionAnomaly(transactionId: number, reason: string, severity: string = 'medium') {
    return apiClient.post(`/api/transactions/${transactionId}/anomaly-report`, { reason, severity });
}

export async function getTransactionStats(userId?: number) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    const queryString = params.toString();
    return apiClient.get(`/api/transactions/stats/summary${queryString ? '?' + queryString : ''}`);
}

// Settings API
export async function getAdminSettings() {
    return apiClient.get('/api/admin/settings');
}

export async function updateAdminSettings(settings: any) {
    return apiClient.put('/api/admin/settings', settings);
}

// Reports API
export async function sendWeeklyReport() {
    return apiClient.post('/api/admin/reports/send-weekly', {});
}

export async function sendMonthlyReport() {
    return apiClient.post('/api/admin/reports/send-monthly', {});
}

// Anomalies API
export async function getAnomalies(status?: string, riskLevel?: string, days: number = 30) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (riskLevel) params.append('risk_level', riskLevel);
    params.append('days', days.toString());
    const queryString = params.toString();
    return apiClient.get(`/api/anomalies${queryString ? '?' + queryString : ''}`);
}

export async function approveAnomaly(anomalyId: number) {
    return apiClient.post(`/api/anomalies/${anomalyId}/approve`, {});
}

export async function rejectAnomaly(anomalyId: number) {
    return apiClient.post(`/api/anomalies/${anomalyId}/reject`, {});
}

// Users API
export async function getAllUsers() {
    return apiClient.get('/users');
}

export async function getCurrentUser() {
    return apiClient.get('/users/me');
}

export async function createUser(userData: { email: string; name: string; password: string }) {
    return apiClient.post('/users/signup', userData);
}

export async function updateUser(userData: { name?: string; email?: string }) {
    return apiClient.patch('/users/me', userData);
}

export async function deleteUser() {
    return apiClient.delete('/users/me');
}

// ========================================
// User Analytics & Demographics APIs
// ========================================

export async function getNewSignups(days: number = 30) {
    return apiClient.get(`/api/admin/users/new-signups?days=${days}`);
}

export async function getChurnedUsers(days: number = 30) {
    return apiClient.get(`/api/admin/users/churned?days=${days}`);
}

export async function getChurnMetrics(churnDays: number = 30, signupDays: number = 30) {
    return apiClient.get(`/api/admin/users/stats/churn-rate?churn_days=${churnDays}&signup_days=${signupDays}`);
}

export async function getAgeDistribution() {
    return apiClient.get('/api/analytics/demographics/age-groups');
}

export async function getConsumptionByAge() {
    return apiClient.get('/api/analytics/demographics/consumption-by-age');
}

export async function getCategoryPreferencesByAge() {
    return apiClient.get('/api/analytics/demographics/category-preferences');
}

