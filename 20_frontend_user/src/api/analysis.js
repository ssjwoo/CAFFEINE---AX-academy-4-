import { apiClient } from './client';

// 대시보드 요약 통계
export const getDashboardSummary = async (userId = null) => {
    try {
        const params = userId ? { user_id: userId } : {};
        const response = await apiClient.get('/analysis/summary', { params });
        return response.data;
    } catch (error) {
        console.error('대시보드 요약 조회 실패:', error);
        throw error;
    }
};

// 카테고리별 소비 분석
export const getCategoryBreakdown = async (userId = null, months = 1) => {
    try {
        const params = { months };
        if (userId) params.user_id = userId;
        const response = await apiClient.get('/analysis/categories', { params });
        return response.data;
    } catch (error) {
        console.error('카테고리 분석 조회 실패:', error);
        throw error;
    }
};

// 월별 지출 추이
export const getMonthlyTrend = async (userId = null, months = 6) => {
    try {
        const params = { months };
        if (userId) params.user_id = userId;
        const response = await apiClient.get('/analysis/monthly-trend', { params });
        return response.data;
    } catch (error) {
        console.error('월별 추이 조회 실패:', error);
        throw error;
    }
};

// AI 소비 인사이트
export const getSpendingInsights = async (userId = null) => {
    try {
        const params = userId ? { user_id: userId } : {};
        const response = await apiClient.get('/analysis/insights', { params });
        return response.data;
    } catch (error) {
        console.error('인사이트 조회 실패:', error);
        throw error;
    }
};

// 전체 분석 데이터 (통합)
export const getFullAnalysis = async (userId = null) => {
    try {
        const params = userId ? { user_id: userId } : {};
        const response = await apiClient.get('/analysis/full', { params });
        return response.data;
    } catch (error) {
        console.error('전체 분석 조회 실패:', error);
        throw error;
    }
};
