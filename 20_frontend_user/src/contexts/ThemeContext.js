import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// ThemeProvider - 테마 제공
export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    // loadTheme - 저장된 테마 로드
    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === 'dark');
            }
        } catch (error) {
            console.error('테마 로드 실패:', error);
        }
    };

    // toggleTheme - 테마 전환
    const toggleTheme = async () => {
        try {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
        } catch (error) {
            console.error('테마 저장 실패:', error);
        }
    };

    // colors - 테마 색상
    const colors = isDarkMode ? {
        // Primary Colors
        primary: '#9C27B0',
        primaryDark: '#7B1FA2',
        primaryLight: '#E1BEE7',
        accent: '#E91E63',
        accentLight: '#FCE4EC',

        // Background Colors
        background: '#1a1a1a',
        cardBackground: '#2d2d2d',

        // Text Colors
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        textTertiary: '#808080',

        // Border Colors
        border: '#404040',
        borderLight: '#505050',

        // Status Colors
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
        positive: '#4CAF50',
        negative: '#E91E63',

        // Special Backgrounds
        warningBackground: '#2d2416',
        successBackground: '#1a2d1a',
        errorBackground: '#2d1a1a',
        infoBackground: '#1a232d',

        // Chart Colors
        chartColors: ['#E91E63', '#9C27B0', '#AB47BC', '#F48FB1', '#CE93D8', '#FF80AB'],

        // Gradients
        primaryGradient: ['#9C27B0', '#E91E63'],
        backgroundGradient: ['#1a1a1a', '#2d2d2d'],
        screenGradient: ['#1E293B', '#0F172A', '#0F172A'],
        cardGradient: ['#1E40AF', '#1E3A8A', '#172554'],

        // UI Colors
        headerBackground: '#1E293B',
        tabBarBackground: '#1E293B',
        tabBarBorder: '#334155',
        tabBarActive: '#60A5FA',
        tabBarInactive: '#94A3B8',

        // Interactive
        disabled: '#666666',
        placeholder: '#808080',

    } : {
        // 라이트 모드 색상
        // Primary Colors (보라색/마젠타 테마)
        primary: '#9C27B0',          // 보라색
        primaryDark: '#7B1FA2',      // 어두운 보라
        primaryLight: '#F3E5F5',     // 밝은 보라 배경
        accent: '#E91E63',           // 마젠타/핑크
        accentLight: '#FCE4EC',      // 밝은 핑크

        // Background Colors
        background: '#FAFAFA',       // 밝은 회색 배경
        cardBackground: '#ffffff',   // 하얀색 카드

        // Text Colors
        text: '#212121',             // 진한 회색 텍스트
        textSecondary: '#757575',    // 중간 회색 텍스트
        textTertiary: '#9E9E9E',     // 연회색 텍스트

        // Border Colors
        border: '#E0E0E0',
        borderLight: '#F5F5F5',

        // Status Colors
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
        positive: '#4CAF50',         // 수익 (녹색)
        negative: '#E91E63',         // 지출 (핑크)

        // Special Backgrounds (밝은 파스텔 톤)
        warningBackground: '#fff3e0',
        successBackground: '#e8f5e9',
        errorBackground: '#ffebee',
        infoBackground: '#e3f2fd',

        // Chart Colors (보라색/핑크 계열)
        chartColors: [
            '#E91E63',  // 1. 마젠타/핑크
            '#9C27B0',  // 2. 보라
            '#AB47BC',  // 3. 밝은 보라
            '#F48FB1',  // 4. 연핑크
            '#CE93D8',  // 5. 연보라
            '#FF80AB'   // 6. 핫핑크
        ],

        // Gradients
        primaryGradient: ['#9C27B0', '#E91E63'],
        backgroundGradient: ['#ffffff', '#F3E5F5'],
        screenGradient: ['#DBEAFE', '#EFF6FF', '#F8FAFC'], // 화면 배경 그라디언트
        cardGradient: ['#2563EB', '#1D4ED8', '#1E40AF'], // 카드 그라디언트

        // UI Colors (블루 테마)
        headerBackground: '#F0F7FF',
        tabBarBackground: '#F0F7FF',
        tabBarBorder: '#DBEAFE',
        tabBarActive: '#2563EB',
        tabBarInactive: '#64748B',

        // Interactive
        disabled: '#BDBDBD',
        placeholder: '#9E9E9E',
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

// useTheme - 테마 사용
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
