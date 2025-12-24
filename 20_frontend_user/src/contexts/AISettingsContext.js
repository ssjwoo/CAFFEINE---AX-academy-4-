import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AISettingsContext = createContext();

export const useAISettings = () => {
    const context = useContext(AISettingsContext);
    if (!context) {
        throw new Error('useAISettings must be used within AISettingsProvider');
    }
    return context;
};

export const AISettingsProvider = ({ children }) => {
    const [aiEnabled, setAiEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    // AsyncStorage에서 설정 불러오기
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const value = await AsyncStorage.getItem('ai_evaluation_enabled');
            if (value !== null) {
                setAiEnabled(JSON.parse(value));
            }
        } catch (error) {
            console.error('AI 설정 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAI = async () => {
        try {
            const newValue = !aiEnabled;
            setAiEnabled(newValue);
            await AsyncStorage.setItem('ai_evaluation_enabled', JSON.stringify(newValue));
            console.log(`AI 평가: ${newValue ? 'ON' : 'OFF'}`);
        } catch (error) {
            console.error('AI 설정 저장 실패:', error);
        }
    };

    return (
        <AISettingsContext.Provider value={{ aiEnabled, toggleAI, loading }}>
            {children}
        </AISettingsContext.Provider>
    );
};
