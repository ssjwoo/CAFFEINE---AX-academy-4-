// 쿠폰 API
import { apiClient } from './client';

/**
 * 사용자 쿠폰 목록 조회
 * @param {string} status - 쿠폰 상태 필터 (available/used/expired)
 * @returns {Promise<Array>} 쿠폰 목록
 */
export const getCoupons = async (status = null) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/coupons', { params });
    return response.data;
};

/**
 * 쿠폰 발급 (AI 예측 기반)
 * @param {string} merchantName - 가맹점명
 * @param {number} discountValue - 할인 금액
 * @returns {Promise<Object>} 발급 결과
 */
export const issueCoupon = async (merchantName, discountValue) => {
    const response = await apiClient.post('/coupons/issue', {
        merchant_name: merchantName,
        discount_value: discountValue
    });
    return response.data;
};

/**
 * 쿠폰 사용
 * @param {number} couponId - 쿠폰 ID
 * @returns {Promise<Object>} 사용 결과
 */
export const useCoupon = async (couponId) => {
    const response = await apiClient.post(`/coupons/${couponId}/use`);
    return response.data;
};
