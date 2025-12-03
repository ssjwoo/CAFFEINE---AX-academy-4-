/**
 * ═══════════════════════════════════════════════════════════════
 * ThemeContext.js - 다크모드/라이트모드 테마 관리 시스템
 * ═══════════════════════════════════════════════════════════════
 * 
 * 📌 이 파일의 역할:
 * - 앱 전체의 색상 테마 관리 (다크모드/라이트모드)
 * - 테마 전환 기능 제공
 * - AsyncStorage에 테마 설정 저장 (앱 재시작해도 유지)
 * 
 * 🎨 색상 팔레트:
 * - Primary: 브랜드 색상 (#bfa094 - 베이지 브라운)
 * - Background: 배경색
 * - Text: 텍스트 색상 (3단계: primary, secondary, tertiary)
 * - Status: 상태 색상 (success, warning, error, info)
 * - Chart: 차트 전용 색상 배열
 * 
 * 🌐 사용 방법:
 * ```javascript
 * import { useTheme } from './contexts/ThemeContext';
 * 
 * function MyComponent() {
 *     const { colors, isDarkMode, toggleTheme } = useTheme();
 *     // colors: 현재 테마의 색상 객체
 *     // isDarkMode: 다크모드 여부 (true/false)
 *     // toggleTheme: 테마 전환 함수
 * }
 * ```
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══ Context 생성 ═══
// Context = 테마 데이터 공유 창고 (앱 전체에서 접근 가능)
const ThemeContext = createContext();

/**
 * ThemeProvider - 테마 시스템 제공자
 * 
 * 이 컴포넌트로 감싸진 모든 하위 컴포넌트에서
 * useTheme()를 사용할 수 있습니다.
 * 
 * 예시:
 * <ThemeProvider>
 *     <App />
 * </ThemeProvider>
 */
export const ThemeProvider = ({ children }) => {
    // ═══ State 변수 ═══
    /**
     * isDarkMode - 다크모드 활성화 여부
     * true = 다크모드, false = 라이트모드
     */
    const [isDarkMode, setIsDarkMode] = useState(false);

    // ═══ 앱 시작 시 실행 ═══
    useEffect(() => {
        // 저장된 테마 설정 불러오기
        loadTheme();
    }, []); // [] = 앱 시작할 때 한 번만 실행

    /**
     * loadTheme - 저장된 테마 설정 불러오기
     * 
     * 📱 동작:
     * 1. AsyncStorage에서 저장된 테마 설정 가져오기
     * 2. 'dark' → 다크모드 활성화
     * 3. 'light' 또는 없음 → 라이트모드 활성화
     */
    const loadTheme = async () => {
        try {
            // AsyncStorage에서 테마 설정 읽기
            const savedTheme = await AsyncStorage.getItem('theme');

            if (savedTheme !== null) {
                // 저장된 값이 'dark'면 다크모드 활성화
                setIsDarkMode(savedTheme === 'dark');
            }
        } catch (error) {
            // 에러 발생 시 콘솔에 출력 (기본값: 라이트모드)
            console.error('테마 로드 실패:', error);
        }
    };

    /**
     * toggleTheme - 테마 전환 함수
     * 
     * 📱 동작:
     * 1. 현재 테마 반전 (다크 ↔ 라이트)
     * 2. State 업데이트 (화면 즉시 변경)
     * 3. AsyncStorage에 저장 (영구 저장)
     * 
     * 사용 예시:
     * <TouchableOpacity onPress={toggleTheme}>
     *     <Text>테마 전환</Text>
     * </TouchableOpacity>
     */
    const toggleTheme = async () => {
        try {
            // 현재 테마 반전
            const newMode = !isDarkMode;

            // State 업데이트 (화면 즉시 변경)
            setIsDarkMode(newMode);

            // AsyncStorage에 저장 (앱 재시작해도 유지)
            await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
        } catch (error) {
            // 에러 발생 시 콘솔에 출력
            console.error('테마 저장 실패:', error);
        }
    };

    /**
     * ═══════════════════════════════════════════════════════════
     * 색상 팔레트 정의
     * ═══════════════════════════════════════════════════════════
     * 
     * 다크모드와 라이트모드에 따라 다른 색상을 제공합니다.
     * 삼항 연산자: isDarkMode ? 다크모드색상 : 라이트모드색상
     */
    const colors = isDarkMode ? {
        // ═══ Primary Colors (브랜드 색상) ═══
        primary: '#bfa094',          // 메인 브랜드 색상 (베이지 브라운)
        primaryDark: '#9a7d72',      // 어두운 primary (호버 효과 등)
        primaryLight: '#d4b8ad',     // 밝은 primary (배경 등)

        // ═══ Background Colors (배경) ═══
        background: '#1a1a1a',       // 메인 배경 (거의 검정)
        cardBackground: '#2d2d2d',   // 카드 배경 (약간 밝은 회색)

        // ═══ Text Colors (텍스트) ═══
        text: '#ffffff',             // 메인 텍스트 (하얀색)
        textSecondary: '#b0b0b0',    // 보조 텍스트 (회색)
        textTertiary: '#808080',     // 3차 텍스트 (어두운 회색)

        // ═══ Border Colors (테두리) ═══
        border: '#404040',           // 기본 테두리
        borderLight: '#505050',      // 밝은 테두리

        // ═══ Status Colors (상태 표시) ═══
        success: '#4caf50',          // 성공 (녹색)
        warning: '#ff9800',          // 경고 (주황색)
        error: '#f44336',            // 에러/위험 (빨강색)
        info: '#2196f3',             // 정보 (파랑색)

        // ═══ Special Backgrounds (특수 배경) ═══
        // Alert나 상태별 카드에 사용되는 반투명 배경색
        warningBackground: '#2d2416',  // 경고 배경 (어두운 주황)
        successBackground: '#1a2d1a',  // 성공 배경 (어두운 녹색)
        errorBackground: '#2d1a1a',    // 에러 배경 (어두운 빨강)
        infoBackground: '#1a232d',     // 정보 배경 (어두운 파랑)

        // ═══ Chart Colors (차트 전용 색상 배열) ═══
        // 파이차트, 막대그래프 등에서 사용
        // 순서대로 카테고리에 할당됨
        chartColors: [
            '#bfa094',  // 1. Primary (베이지 브라운)
            '#ff9800',  // 2. 주황
            '#4caf50',  // 3. 녹색
            '#2196f3',  // 4. 파랑
            '#9c27b0',  // 5. 보라
            '#ff5722'   // 6. 적갈색
        ],

        // ═══ Gradients (그라데이션) ═══
        // LinearGradient 등에서 사용
        primaryGradient: ['#bfa094', '#9a7d72'],      // Primary 그라데이션
        backgroundGradient: ['#1a1a1a', '#2d2d2d'],   // Background 그라데이션

        // ═══ Interactive (상호작용 요소) ═══
        disabled: '#666666',         // 비활성화된 요소
        placeholder: '#808080',      // Input placeholder 색상

    } : {
        // ═══ 라이트 모드 색상 ═══
        // (구조는 동일, 색상만 밝게)

        // Primary Colors
        primary: '#bfa094',
        primaryDark: '#9a7d72',
        primaryLight: '#d4b8ad',

        // Background Colors
        background: '#f5f5f5',       // 밝은 회색 배경
        cardBackground: '#ffffff',   // 하얀색 카드

        // Text Colors
        text: '#000000',             // 검정 텍스트
        textSecondary: '#666666',    // 회색 텍스트
        textTertiary: '#999999',     // 연회색 텍스트

        // Border Colors
        border: '#e0e0e0',
        borderLight: '#f0f0f0',

        // Status Colors (다크모드와 동일한 색상 사용)
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',

        // Special Backgrounds (밝은 파스텔 톤)
        warningBackground: '#fff3e0',
        successBackground: '#e8f5e9',
        errorBackground: '#ffebee',
        infoBackground: '#e3f2fd',

        // Chart Colors (다크모드와 동일)
        chartColors: [
            '#bfa094', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#ff5722'
        ],

        // Gradients
        primaryGradient: ['#bfa094', '#d4b8ad'],
        backgroundGradient: ['#ffffff', '#f5f5f5'],

        // Interactive
        disabled: '#cccccc',
        placeholder: '#999999',
    };

    /**
     * ═══ Context 제공 ═══
     * 
     * Provider를 통해 하위 컴포넌트에 값 전달
     * 
     * 제공되는 값:
     * - isDarkMode: 다크모드 여부 (true/false)
     * - toggleTheme: 테마 전환 함수
     * - colors: 현재 테마의 색상 객체 (위에서 정의한 colors)
     */
    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * useTheme Hook - 어디서든 테마 사용하기
 * 
 * 사용 예시:
 * ```javascript
 * const { colors, isDarkMode, toggleTheme } = useTheme();
 * 
 * // 색상 사용
 * <View style={{ backgroundColor: colors.background }}>
 *     <Text style={{ color: colors.text }}>Hello</Text>
 * </View>
 * 
 * // 다크모드 확인
 * if (isDarkMode) { ... }
 * 
 * // 테마 전환
 * <Button onPress={toggleTheme}>테마 변경</Button>
 * ```
 * 
 * ⚠️ 주의: ThemeProvider 안에서만 사용 가능
 */
export const useTheme = () => {
    // Context에서 값 가져오기
    const context = useContext(ThemeContext);

    // Context가 없으면 에러 (ThemeProvider 밖에서 사용한 경우)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }

    return context;
};

/**
 * ═══════════════════════════════════════════════════════════════
 * 📌 Quick Reference - 빠른 참조
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. 색상 사용:
 *    const { colors } = useTheme();
 *    style={{ backgroundColor: colors.primary }}
 * 
 * 2. 다크모드 확인:
 *    const { isDarkMode } = useTheme();
 *    if (isDarkMode) { ... }
 * 
 * 3. 테마 전환:
 *    const { toggleTheme } = useTheme();
 *    <Button onPress={toggleTheme}>전환</Button>
 * 
 * 4. 색상 카테고리:
 *    - colors.primary: 브랜드 색상
 *    - colors.text: 텍스트 색상
 *    - colors.background: 배경색
 *    - colors.success/warning/error: 상태 색상
 *    - colors.chartColors[i]: 차트 색상
 * 
 * 5. 동적 스타일:
 *    const styles = (colors) => StyleSheet.create({
 *        container: { backgroundColor: colors.background }
 *    });
 *    // 사용: styles(colors).container
 * 
 * ═══════════════════════════════════════════════════════════════
 */
