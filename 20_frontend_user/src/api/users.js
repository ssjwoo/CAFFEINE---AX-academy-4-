import { apiClient } from './client';

// 내 정보 조회
export const getUserProfile = async () => {
    try {
        const response = await apiClient.get('/users/me');
        return response.data;
    } catch (error) {
        // 에러를 호출자에게 전파하여 UI에서 처리
        throw error;
    }
};

// 내 정보 수정
export const updateUserProfile = async (data) => {
    try {
        const response = await apiClient.patch('/users/me', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 푸시 토큰 업데이트
export const updateUserProfilePushToken = async (data) => {
    try {
        const response = await apiClient.patch('/users/me', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};
