import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient, API_BASE_URL } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth는 AuthProvider 안에서만 사용 가능합니다!');
    }
    return context;
};

// AuthProvider
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
                await AsyncStorage.setItem('authToken', access_token);



                const userResponse = await apiClient.get('/users/me', {

                    headers: { 'Authorization': `Bearer ${access_token}` },
                });

                if (userResponse.data) {
                    const userData = userResponse.data;

                    // 이전 사용자 캐시 삭제 (다른 사용자 데이터 격리)
                    const prevUserJson = await AsyncStorage.getItem('user');
                    const prevUser = prevUserJson ? JSON.parse(prevUserJson) : null;
                    if (prevUser?.id && prevUser.id !== userData.id) {
                        // 다른 사용자로 로그인한 경우 이전 캐시 삭제
                        await AsyncStorage.removeItem(`transactions_cache_${prevUser.id}`);
                        await AsyncStorage.removeItem(`last_sync_time_${prevUser.id}`);
                    }

                    await AsyncStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                    return { success: true };
                }
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
                phone: '000-0000-0000', // 필수 필드 기본값
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
        
        // 다크모드 설정 초기화 (라이트모드로 복원)
        await AsyncStorage.removeItem('theme');

        setUser(null);

        // 페이지 새로고침으로 모든 React state 초기화
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };
    // 카카오 로그인
    const kakaoLogin = async (code) => {
        try {
            const redirect_uri = typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/kakao/callback`
                : 'http://localhost:8081/auth/kakao/callback';

            const response = await fetch(`${API_BASE_URL}/auth/kakao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirect_uri }),
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
            const redirect_uri = typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/kakao/signup/callback`
                : 'http://localhost:8081/auth/kakao/signup/callback';

            const response = await fetch(`${API_BASE_URL}/auth/kakao/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirect_uri }),
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

    // 구글 로그인
    const googleLogin = async (code) => {
        try {
            const redirect_uri = typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/google/callback`
                : 'http://localhost:8081/auth/google/callback';

            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirect_uri }),
            });
            
            if (response.ok) {
                const data = await response.json();
                const userData = {
                    id: data.user?.id || Date.now(),
                    name: data.user?.nickname || '구글 사용자',
                    email: data.user?.email || 'google@user.com',
                    avatar: data.user?.profile_image || 'https://via.placeholder.com/100?text=G',
                    provider: 'google',
                    birth_date: data.user?.birth_date || null,
                };
                
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                if (data.access_token) {
                    await AsyncStorage.setItem('authToken', data.access_token);
                }
                if (data.refresh_token) {
                    await AsyncStorage.setItem('refreshToken', data.refresh_token);
                }
                
                setUser(userData);
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return { success: false, error: errorData.detail || '구글 로그인에 실패했습니다.' };
            }
        } catch (error) {
            console.error('구글 로그인 오류:', error);
            return { success: false, error: '네트워크 오류가 발생했습니다.' };
        }
    };

    // 구글 회원가입
    const googleSignup = async (code) => {
        try {
            const redirect_uri = typeof window !== 'undefined' 
                ? `${window.location.origin}/auth/google/signup/callback`
                : 'http://localhost:8081/auth/google/signup/callback';

            const response = await fetch(`${API_BASE_URL}/auth/google/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirect_uri }),
            });
            
            if (response.ok) {
                const data = await response.json();
                const userData = {
                    id: data.user?.id || Date.now(),
                    name: data.user?.nickname || '구글 사용자',
                    email: data.user?.email || 'google@user.com',
                    avatar: data.user?.profile_image || 'https://via.placeholder.com/100?text=G',
                    provider: 'google',
                    birth_date: data.user?.birth_date || null,
                };
                
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                if (data.access_token) {
                    await AsyncStorage.setItem('authToken', data.access_token);
                }
                if (data.refresh_token) {
                    await AsyncStorage.setItem('refreshToken', data.refresh_token);
                }
                
                setUser(userData);
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return { success: false, error: errorData.detail || '구글 회원가입에 실패했습니다.' };
            }
        } catch (error) {
            console.error('구글 회원가입 오류:', error);
            return { success: false, error: '네트워크 오류가 발생했습니다.' };
        }
    };

    // AuthContext.Provider - 사용자 인증 상태 제공
    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, kakaoLogin, kakaoSignup, googleLogin, googleSignup }}>
            {children}
        </AuthContext.Provider>
    );
};
