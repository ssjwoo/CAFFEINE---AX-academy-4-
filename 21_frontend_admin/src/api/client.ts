// API Client for Admin Dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface FetchOptions extends RequestInit {
    timeout?: number;
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}) {
    const { timeout = 10000, ...fetchOptions } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
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
};

// Analysis API
export async function getFullAnalysis() {
    return apiClient.get('/api/analysis/full');
}

export async function getDashboardStats() {
    return apiClient.get('/api/analysis/summary');
}

export async function getCategoryBreakdown(months = 1) {
    return apiClient.get(`/api/analysis/categories?months=${months}`);
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
