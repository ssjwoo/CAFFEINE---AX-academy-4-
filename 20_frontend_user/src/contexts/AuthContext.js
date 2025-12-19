import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient } from '../api';

// API_BASE_URL - API 요청 URL (apiClient에서 이미 관리 중일 수 있으나 레거시 호환용)
const LOCAL_BASE_URL = "http://localhost:8001";
const PROD_BASE_URL = "https://d26uyg5darllja.cloudfront.net";
const isLocal = Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname?.includes("localhost");
const API_BASE_URL = isLocal ? LOCAL_BASE_URL : PROD_BASE_URL;

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth는 AuthProvider 안에서만 사용 가능합니다!');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            // FastAPI OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);

            const response = await apiClient.post('/users/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data) {
                const { access_token, refresh_token } = response.data;

                // 토큰 저장 (accessToken, refreshToken으로 통일)
                await AsyncStorage.setItem('accessToken', access_token);
                await AsyncStorage.setItem('refreshToken', refresh_token);
                // 이전 레거시 호환을 위해 authToken도 저장 가능하나 여기선 정리
                await AsyncStorage.setItem('authToken', access_token);

                // 사용자 정보 가져오기 (/users/me)
                const userResponse = await apiClient.get('/users/me', {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                });

                const userData = userResponse.data;
                await AsyncStorage.setItem('user', JSON.stringify(userData));

                // State 업데이트
                setUser(userData);

                return { success: true };
            }

            return { success: false, error: '로그인에 실패했습니다.' };
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMessage = detail.map(err => {
                        const field = err.loc ? err.loc[err.loc.length - 1] : 'error';
                        return `${field}: ${err.msg}`;
                    }).join('\n');
                } else {
                    errorMessage = detail;
                }
            }
            return { success: false, error: errorMessage };
        }
    };

    // 회원가입
    const signup = async (name, email, password, birthDate) => {
        try {
            // 실제 백엔드 API 호출
            const response = await apiClient.post('/users/signup', {
                name: name,
                email: email,
                password: password,
                birth_date: birthDate
            });

            if (response.data) {
                // 회원가입 성공 -> 바로 자동 로그인 시도
                return await login(email, password);
            }

            return { success: false, error: '회원가입에 실패했습니다.' };
        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = '회원가입 중 오류가 발생했습니다.';
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMessage = detail.map(err => {
                        const field = err.loc ? err.loc[err.loc.length - 1] : 'error';
                        return `${field}: ${err.msg}`;
                    }).join('\n');
                } else {
                    errorMessage = detail;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;

        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('authToken');

        if (user?.id) {
            await AsyncStorage.removeItem(`transactions_cache_${user.id}`);
            await AsyncStorage.removeItem(`last_sync_time_${user.id}`);
        }
        await AsyncStorage.removeItem('transactions_cache');
        await AsyncStorage.removeItem('last_sync_time');

        setUser(null);
    };

    // 카카오 로그인/회원가입 레거시 유지 (필요시 apiClient로 전환 가능하나 현재 유지)
    const kakaoLogin = async (code) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/kakao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            if (response.ok) {
                const data = await response.json();
                const userData = {
                    id: data.user?.id || Date.now(),
                    name: data.user?.nickname || '카카오 사용자',
                    email: data.user?.email || 'kakao@user.com',
                    provider: 'kakao',
                };
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                if (data.access_token) {
                    await AsyncStorage.setItem('accessToken', data.access_token);
                    await AsyncStorage.setItem('authToken', data.access_token);
                }
                setUser(userData);
                return { success: true };
            }
            return { success: false, error: '카카오 로그인 실패' };
        } catch (error) {
            return { success: false, error: '네트워크 오류' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, kakaoLogin }}>
            {children}
        </AuthContext.Provider>
    );
};
