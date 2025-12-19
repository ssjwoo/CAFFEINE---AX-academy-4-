import { apiClient } from './client';

// 거래 목록 조회
export const getTransactions = async (params = {}) => {
    try {
        const response = await apiClient.get('/api/transactions', { params });
        return response.data;
    } catch (error) {
        console.error('거래 목록 조회 실패:', error);
        throw error;
    }
};

// 거래 상세 조회
export const getTransaction = async (id) => {
    try {
        const response = await apiClient.get(`/api/transactions/${id}`);
        return response.data;
    } catch (error) {
        console.error('거래 상세 조회 실패:', error);
        throw error;
    }
};

// 거래 메모 수정
export const updateTransactionNote = async (id, description) => {
    try {
        const response = await apiClient.patch(`/api/transactions/${id}/note`, {
            description
        });
        return response.data;
    } catch (error) {
        console.error('거래 메모 수정 실패:', error);
        throw error;
    }
};

// 이상거래 신고
export const reportAnomaly = async (id, reason, severity = 'medium') => {
    try {
        const response = await apiClient.post(`/api/transactions/${id}/anomaly-report`, {
            reason,
            severity
        });
        return response.data;
    } catch (error) {
        console.error('이상거래 신고 실패:', error);
        throw error;
    }
};

// 거래 통계
export const getTransactionStats = async (userId = null) => {
    try {
        const params = userId ? { user_id: userId } : {};
        const response = await apiClient.get('/api/transactions/stats/summary', { params });
        return response.data;
    } catch (error) {
        console.error('거래 통계 조회 실패:', error);
        throw error;
    }
};

// 거래 일괄 생성 (CSV 업로드용)
export const createTransactionsBulk = async (userId, transactions) => {
    try {
        const response = await apiClient.post('/api/transactions/bulk', {
            user_id: userId,
            transactions: transactions.map(t => ({
                merchant: t.merchant || t.businessName,
                amount: Math.abs(t.amount),
                category: t.category || t.originalCategory || '기타',
                transaction_date: t.date || new Date().toISOString(),
                description: t.notes || t.description || '',
                currency: 'KRW'
            }))
        });
        return response.data;
    } catch (error) {
        console.error('거래 일괄 생성 실패:', error);
        throw error;
    }
};

// 사용자의 모든 거래 삭제
export const deleteAllTransactions = async (userId) => {
    try {
        const response = await apiClient.delete('/api/transactions', {
            params: { user_id: userId }
        });
        return response.data;
    } catch (error) {
        console.error('거래 삭제 실패:', error);
        throw error;
    }
};
