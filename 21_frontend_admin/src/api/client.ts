// API Client for Admin Dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

interface FetchOptions extends RequestInit {
    timeout?: number;
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}) {
    const { timeout = 10000, headers = {}, ...fetchOptions } = options;

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

// Transactions API
export async function getTransactions() {
    return apiClient.get('/api/transactions');
}

export async function getTransactionStats() {
    return apiClient.get('/api/transactions/stats/summary');
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

