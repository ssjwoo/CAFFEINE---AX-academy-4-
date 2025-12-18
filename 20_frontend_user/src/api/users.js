import { apiClient } from './client';

/**
 * 사용자 API (Users Service)
 * 
 * 사용자 정보 조회 및 수정 기능을 제공합니다.
 */

/**
 * 내 정보 조회
 * GET /users/me
 * 
 * @returns {Promise<Object>} 사용자 프로필 정보
 */
export const getUserProfile = async () => {
    try {
        const response = await apiClient.get('/users/me');
        return response.data;
    } catch (error) {
        // 에러를 호출자에게 전파하여 UI에서 처리
        throw error;
    }
};

/**
 * 내 정보 수정
 * PATCH /users/me
 * 
 * 푸시 토큰, 예산 한도 등 사용자 정보를 업데이트합니다.
 * 
 * @param {Object} data - 수정할 데이터
 * @param {string} [data.push_token] - Expo Push Token
 * @param {number} [data.budget_limit] - 월 예산 한도
 * @param {string} [data.nickname] - 닉네임
 * @returns {Promise<Object>} 수정된 사용자 정보
 */
export const updateUserProfile = async (data) => {
    try {
        const response = await apiClient.patch('/users/me', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};
