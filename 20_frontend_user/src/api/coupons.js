import { apiClient } from './client';

// 사용자 쿠폰 목록 조회
export const getCoupons = async (status = null) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/api/coupons', { params });
    return response.data;
};

// 쿠폰 발급 (AI 예측 기반)
export const issueCoupon = async (merchantName, discountValue) => {
    const response = await apiClient.post('/api/coupons/issue', {
        merchant_name: merchantName,
        discount_value: discountValue
    });
    return response.data;
};

// 쿠폰 사용
export const useCoupon = async (couponId) => {
    const response = await apiClient.post(`/api/coupons/${couponId}/use`);
    return response.data;
};

// 사용자 쿠폰 일괄 삭제 (데이터 초기화용)
export const deleteAllCoupons = async () => {
    const response = await apiClient.delete('/api/coupons');
    return response.data;
};

