/**
 * ═══════════════════════════════════════════════════════════════
 * AuthContext.js - 사용자 인증 관리 시스템
 * ═══════════════════════════════════════════════════════════════
 * 
 * 📌 이 파일의 역할:
 * - 사용자 로그인/회원가입/로그아웃 기능 제공
 * - 앱 전체에서 사용자 정보 공유 (Context API 사용)
 * - 로그인 상태를 AsyncStorage에 저장 (앱 재시작해도 유지)
 * 
 * 🔴 백엔드 연결 포인트:
 * - login() 함수 - API 호출로 변경 필요
 * - signup() 함수 - API 호출로 변경 필요
 * - checkLoginStatus() - 토큰 검증 API 추가 필요
 * 
 * 🌐 사용 방법:
 * ```javascript
 * import { useAuth } from './contexts/AuthContext';
 * 
 * function MyComponent() {
 *     const { user, login, logout } = useAuth();
 *     // user: 현재 로그인한 사용자 정보
 *     // login: 로그인 함수
 *     // logout: 로그아웃 함수
 * }
 * ```
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══ Context 생성 ═══
// Context = 데이터 공유 창고 (앱 전체에서 접근 가능)
const AuthContext = createContext();

/**
 * useAuth Hook - 어디서든 인증 기능 사용하기
 * 
 * 사용 예시:
 * const { user, login } = useAuth();
 * 
 * ⚠️ 주의: AuthProvider 안에서만 사용 가능
 */
export const useAuth = () => {
    // Context에서 값 가져오기
    const context = useContext(AuthContext);

    // Context가 없으면 에러 (AuthProvider 밖에서 사용한 경우)
    if (!context) {
        throw new Error('useAuth는 AuthProvider 안에서만 사용 가능합니다!');
    }

    return context;
};

/**
 * AuthProvider - 인증 시스템 제공자
 * 
 * 이 컴포넌트로 감싸진 모든 하위 컴포넌트에서
 * useAuth()를 사용할 수 있습니다.
 * 
 * 예시:
 * <AuthProvider>
 *     <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
    // ═══ State 변수들 ═══

    /**
     * user - 현재 로그인한 사용자 정보
     * null = 로그인 안 됨
     * 객체 = 로그인 됨 { id, name, email, createdAt }
     */
    const [user, setUser] = useState(null);

    /**
     * loading - 로그인 상태 확인 중인지 여부
     * true = 확인 중 (로딩 화면 표시)
     * false = 확인 완료
     */
    const [loading, setLoading] = useState(true);

    // ═══ 앱 시작 시 실행 ═══
    useEffect(() => {
        // 저장된 로그인 정보 확인
        checkLoginStatus();
    }, []); // [] = 앱 시작할 때 한 번만 실행

    /**
     * checkLoginStatus - 저장된 로그인 정보 확인
     * 
     * 📱 동작:
     * 1. AsyncStorage에서 저장된 사용자 정보 가져오기
     * 2. 있으면 -> 자동 로그인
     * 3. 없으면 -> 로그인 화면 표시
     * 
     * 🔴 백엔드 연결 시 변경사항:
     * - AsyncStorage에서 토큰 가져오기
     * - API로 토큰 유효성 검증
     * - 유효하면 사용자 정보 받아오기
     * 
     * 예시 코드 (백엔드 연결 시):
     * ```javascript
     * const token = await AsyncStorage.getItem('token');
     * const response = await fetch('/api/auth/verify', {
     *     headers: { Authorization: `Bearer ${token}` }
     * });
     * if (response.ok) {
     *     const userData = await response.json();
     *     setUser(userData);
     * }
     * ```
     */
    const checkLoginStatus = async () => {
        try {
            // ⚠️ TODO: 백엔드 연결 시 토큰 검증 추가 필요
            // const token = await AsyncStorage.getItem('authToken');
            // if (!token) {
            //     setLoading(false);
            //     return;
            // }
            // const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            // if (response.ok) {
            //     const userData = await response.json();
            //     setUser(userData);
            // } else {
            //     await AsyncStorage.removeItem('authToken');
            //     await AsyncStorage.removeItem('user');
            // }
            // 현재는 저장된 사용자 정보만 확인 (토큰 검증 없음)
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

    /**
     * login - 로그인 함수
     * 
     * @param {string} email - 사용자 이메일
     * @param {string} password - 비밀번호
     * @returns {Object} { success: true/false, error?: string }
     * 
     * 📱 현재 동작 (Mock):
     * - 이메일과 비밀번호만 있으면 성공
     * - 가짜 사용자 정보 생성
     * - AsyncStorage에 저장
     * 
     * 🔴 백엔드 연결 시 변경사항:
     * 1. API 호출로 교체
     * 2. 서버에서 토큰 받기
     * 3. 토큰을 AsyncStorage에 저장
     * 4. 사용자 정보도 함께 저장
     * 
     * 백엔드 연결 예시:
     * ```javascript
     * const response = await fetch('https://your-api.com/auth/login', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ email, password })
     * });
     * 
     * if (response.ok) {
     *     const { token, user } = await response.json();
     *     await AsyncStorage.setItem('token', token);
     *     await AsyncStorage.setItem('user', JSON.stringify(user));
     *     setUser(user);
     *     return { success: true };
     * } else {
     *     const error = await response.json();
*     return { success: false, error: error.message };
 * }
 * ```
 * 
 * ⚠️ 중요: 위 예시 코드에서 반드시 토큰을 저장해야 합니다!
 * - 토큰은 모든 API 호출 시 Authorization 헤더에 필요
 * - AsyncStorage.setItem('authToken', token) 또는
 * - SecureStore.setItemAsync('authToken', token) 사용
 */
    const login = async (email, password) => {
        // ⚠️ 현재는 Mock (가짜) 로그인
        // 🔴 백엔드 연결 시 이 부분을 API 호출로 교체하세요!

        if (email && password) {
            // 가짜 사용자 정보 생성
            const userData = {
                id: 1,
                name: '홍길동',
                email: email,
                createdAt: new Date().toISOString()
            };

            // AsyncStorage에 저장 (앱 재시작해도 유지됨)
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            // State 업데이트 (화면 자동 전환)
            setUser(userData);

            // 성공 반환
            return { success: true };
        }

        // 실패 반환
        return { success: false, error: '이메일과 비밀번호를 확인해주세요.' };
    };

    /**
     * signup - 회원가입 함수
     * 
     * @param {string} name - 사용자 이름
     * @param {string} email - 이메일
     * @param {string} password - 비밀번호
     * @returns {Object} { success: true/false, error?: string }
     * 
     * 📱 현재 동작 (Mock):
     * - 모든 필드가 있으면 성공
     * - 가짜 사용자 정보 생성
     * - AsyncStorage에 저장
     * - 자동 로그인
     * 
     * 🔴 백엔드 연결 시 변경사항:
     * 1. API 호출로 교체
     * 2. 서버에 회원가입 요청
     * 3. 성공하면 자동으로 login() 호출
     * 
     * 백엔드 연결 예시:
     * ```javascript
     * const response = await fetch('https://your-api.com/auth/signup', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ name, email, password })
     * });
     * 
     * if (response.ok) {
     *     // 회원가입 성공 -> 자동 로그인
     *     return await login(email, password);
     * } else {
     *     const error = await response.json();
     *     return { success: false, error: error.message };
     * }
     * ```
     */
    const signup = async (name, email, password, birthDate) => {
        // ⚠️ 현재는 Mock (가짜) 회원가입
        // 🔴 백엔드 연결 시 이 부분을 API 호출로 교체하세요!

        if (name && email && password && birthDate) {
            // 가짜 사용자 정보 생성
            const userData = {
                id: Date.now(), // 현재 시간을 ID로 사용 (임시)
                name: name,
                email: email,
                birth_date: birthDate, // NEW: Include birth_date
                createdAt: new Date().toISOString()
            };

            // AsyncStorage에 저장
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            // State 업데이트
            setUser(userData);

            // 성공 반환
            return { success: true };
        }

        // 실패 반환
        return { success: false, error: '모든 필드를 입력해주세요.' };
    };

    /**
     * logout - 로그아웃 함수
     * 
     * 📱 동작:
     * 1. AsyncStorage에서 사용자 정보 삭제
     * 2. State를 null로 설정
     * 3. 자동으로 로그인 화면으로 이동
     * 
     * 🔴 백엔드 연결 시 변경사항:
     * - 서버에 로그아웃 요청 (optional)
     * - 토큰도 함께 삭제
     * 
     * 백엔드 연결 예시:
     * ```javascript
     * // 서버에 로그아웃 알림 (optional)
     * await fetch('https://your-api.com/auth/logout', {
     *     method: 'POST',
     *     headers: { Authorization: `Bearer ${token}` }
     * });
     * 
     * // 로컬 저장소 정리
     * await AsyncStorage.removeItem('token');
     * await AsyncStorage.removeItem('user');
     * setUser(null);
     * ```
     */
    const logout = async () => {
        // ⚠️ TODO: 백엔드 연결 시 서버에 로그아웃 알림 (선택사항)
        // const token = await AsyncStorage.getItem('authToken');
        // await fetch(`${API_BASE_URL}/auth/logout`, {
        //     method: 'POST',
        //     headers: { 'Authorization': `Bearer ${token}` }
        // });
        // AsyncStorage에서 삭제
        await AsyncStorage.removeItem('user');
        // 🔴 백엔드 연결 시 토큰도 삭제:
        // await AsyncStorage.removeItem('authToken');
        // State 초기화 (null = 로그인 안 됨)
        setUser(null);
    };

    // ═══ Context 제공 ═══
    /**
     * Provider를 통해 하위 컴포넌트에 값 전달
     * 
     * 제공되는 값:
     * - user: 현재 로그인한 사용자 (null 또는 객체)
     * - loading: 로그인 확인 중 여부 (true/false)
     * - login: 로그인 함수
     * - signup: 회원가입 함수
     * - logout: 로그아웃 함수
     */
    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * ═══════════════════════════════════════════════════════════════
 * 📌 Quick Reference - 빠른 참조
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. 사용 방법:
 *    const { user, login, logout } = useAuth();
 * 
 * 2. 로그인 확인:
 *    if (user) { ... } // 로그인 됨
 *    else { ... }      // 로그인 안 됨
 * 
 * 3. 로그인 실행:
 *    const result = await login(email, password);
 *    if (result.success) { ... }
 * 
 * 4. 백엔드 연결 필요한 함수:
 *    ⚠️ login() - API 호출로 변경
 *    ⚠️ signup() - API 호출로 변경
 *    ⚠️ checkLoginStatus() - 토큰 검증 추가
 *    ⚠️ logout() - 토큰 삭제 추가
 * 
 * ═══════════════════════════════════════════════════════════════
 */
