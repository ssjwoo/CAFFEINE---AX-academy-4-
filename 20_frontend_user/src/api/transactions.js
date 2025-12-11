// API Services - Transactions

import { apiClient } from './client';

/**
 * 거래 목록 조회
 */
export const getTransactions = async (params = {}) => {
    try {
        const response = await apiClient.get('/api/transactions', { params });
        return response.data;
    } catch (error) {
        console.error('거래 목록 조회 실패:', error);
        throw error;
    }
};

/**
 * 거래 상세 조회
 */
export const getTransaction = async (id) => {
    try {
        const response = await apiClient.get(`/api/transactions/${id}`);
        return response.data;
    } catch (error) {
        console.error('거래 상세 조회 실패:', error);
        throw error;
    }
};

/**
 * 거래 메모 수정
 */
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

/**
 * 이상거래 신고
 */
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

/**
 * 거래 통계
 */
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
