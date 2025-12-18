import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// API_BASE_URL - API 요청 URL
const LOCAL_BASE_URL = "http://localhost:8001";
const PROD_BASE_URL = "https://d26uyg5darllja.cloudfront.net";
const isLocal = Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname?.includes("localhost");
const API_BASE_URL = isLocal ? LOCAL_BASE_URL : PROD_BASE_URL;
const AuthContext = createContext();

// useAuth - AuthContext 사용
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth는 AuthProvider 안에서만 사용 가능합니다!');
    }
    return context;
};

// AuthProvider - 사용자 인증 상태 관리
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // 로그인 상태 확인
    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('로그인 상태 확인 실패:', error);
        } finally {
            setLoading(false);
        }
    };
    // 로그인
    const login = async (email, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            if (response.ok) {
                const tokenData = await response.json();
                await AsyncStorage.setItem('authToken', tokenData.access_token);
                await AsyncStorage.setItem('refreshToken', tokenData.refresh_token);

                const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    await AsyncStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                    return { success: true };
                }
            }

            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.detail || '이메일 또는 비밀번호가 올바르지 않습니다.' };
        } catch (error) {
            console.error('로그인 에러:', error);
            return { success: false, error: '서버 연결에 실패했습니다.' };
        }
    };
    // 회원가입
    const signup = async (name, email, password, birthDate = null) => {
        try {
            const body = { name, email, password };
            if (birthDate) {
                body.birth_date = birthDate;
            }
            
            const response = await fetch(`${API_BASE_URL}/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                return { success: true, message: '회원가입이 완료되었습니다. 로그인해주세요.' };
            }

            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.detail || '회원가입에 실패했습니다.' };
        } catch (error) {
            console.error('회원가입 에러:', error);
            return { success: false, error: '서버 연결에 실패했습니다.' };
        }
    };
    // 로그아웃
    const logout = async () => {
        // 사용자별 캐시 삭제를 위해 먼저 user 정보 가져오기
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        
        // 사용자별 거래 캐시 삭제
        if (user?.id) {
            await AsyncStorage.removeItem(`transactions_cache_${user.id}`);
            await AsyncStorage.removeItem(`last_sync_time_${user.id}`);
        }
        // 레거시 캐시도 삭제 (이전 버전 호환)
        await AsyncStorage.removeItem('transactions_cache');
        await AsyncStorage.removeItem('last_sync_time');
        
        setUser(null);
    };
    // 카카오 로그인
    const kakaoLogin = async (code) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/kakao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            // 카카오 로그인 응답 처리
            if (response.ok) {
                const data = await response.json();
                const userData = {
                    id: data.user?.id || Date.now(),
                    name: data.user?.nickname || '카카오 사용자',
                    email: data.user?.email || 'kakao@user.com',
                    avatar: data.user?.profile_image || 'https://via.placeholder.com/100?text=K',
                    provider: 'kakao',
                    birth_date: data.user?.birth_date || null,
                };
                // 로컬 스토리지에 사용자 정보 저장
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                if (data.access_token) {
                    await AsyncStorage.setItem('authToken', data.access_token);
                }
                if (data.refresh_token) {
                    await AsyncStorage.setItem('refreshToken', data.refresh_token);
                }
                // 로컬 스토리지에 사용자 정보 저장
                setUser(userData);
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return { success: false, error: errorData.detail || '카카오 로그인에 실패했습니다.' };
            }
        } catch (error) {
            console.error('카카오 로그인 오류:', error);
            return { success: false, error: '네트워크 오류가 발생했습니다.' };
        }
    };

    // 카카오 회원가입
    const kakaoSignup = async (code) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/kakao/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            // 카카오 회원가입 응답 처리
            if (response.ok) {
                const data = await response.json();
                const userData = {
                    id: data.user?.id || Date.now(),
                    name: data.user?.nickname || '카카오 사용자',
                    email: data.user?.email || 'kakao@user.com',
                    avatar: data.user?.profile_image || 'https://via.placeholder.com/100?text=K',
                    provider: 'kakao',
                };
                // 로컬 스토리지에 사용자 정보 저장
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                if (data.access_token) {
                    await AsyncStorage.setItem('authToken', data.access_token);
                }
                if (data.refresh_token) {
                    await AsyncStorage.setItem('refreshToken', data.refresh_token);
                }
                // 로컬 스토리지에 사용자 정보 저장
                setUser(userData);
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return { success: false, error: errorData.detail || '카카오 회원가입에 실패했습니다.' };
            }
        } catch (error) {
            console.error('카카오 회원가입 오류:', error);
            return { success: false, error: '네트워크 오류가 발생했습니다.' };
        }
    };
    // AuthContext.Provider - 사용자 인증 상태 제공
    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, kakaoLogin, kakaoSignup }}>
            {children}
        </AuthContext.Provider>
    );
};
