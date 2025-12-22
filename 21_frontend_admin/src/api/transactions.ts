import { apiClient } from './baseClient';

// Transactions API
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
