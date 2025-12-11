// API Services - ML Prediction

import { apiClient } from './client';

/**
 * 다음 소비 예측
 */
export const predictNextTransaction = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/ml/predict-next', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('다음 소비 예측 실패:', error);
        throw error;
    }
};

/**
 * CSV 일괄 예측
 */
export const uploadAndPredict = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/ml/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('CSV 예측 실패:', error);
        throw error;
    }
};

/**
 * 단일 거래 예측
 */
export const predictSingle = async (transactionData) => {
    try {
        const response = await apiClient.post('/ml/predict', transactionData);
        return response.data;
    } catch (error) {
        console.error('단일 예측 실패:', error);
        throw error;
    }
};
