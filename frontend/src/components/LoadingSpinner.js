import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * LoadingSpinner 컴포넌트
 * 브랜드 색상을 사용한 커스텀 로딩 스피너
 * 
 * @param {string} props.size - 크기 ('small' | 'medium' | 'large', 기본: 'medium')
 * @param {string} props.message - 로딩 메시지 (선택)
 * @param {string} props.color - 커스텀 색상 (선택)
 */
export default function LoadingSpinner({
    size = 'medium',
    message,
    color: customColor
}) {
    const { colors } = useTheme();
    const spinValue = useRef(new Animated.Value(0)).current;

    const sizeMap = {
        small: 20,
        medium: 40,
        large: 60,
    };

    const spinnerSize = sizeMap[size] || sizeMap.medium;
    const color = customColor || colors.primary;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.spinner,
                    {
                        width: spinnerSize,
                        height: spinnerSize,
                        borderRadius: spinnerSize / 2,
                        borderTopColor: color,
                        borderRightColor: `${color}40`,
                        borderBottomColor: `${color}40`,
                        borderLeftColor: `${color}40`,
                        borderWidth: spinnerSize / 10,
                        transform: [{ rotate: spin }],
                    },
                ]}
            />
            {message && (
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                    {message}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    spinner: {
        borderStyle: 'solid',
    },
    message: {
        marginTop: 16,
        fontSize: 14,
        textAlign: 'center',
    },
});

/**
 * FullScreenLoading 컴포넌트
 * 전체 화면을 덮는 로딩 오버레이
 */
export function FullScreenLoading({ message }) {
    const { colors } = useTheme();

    return (
        <View style={[fullScreenStyles.overlay, { backgroundColor: `${colors.background}E6` }]}>
            <LoadingSpinner size="large" message={message} />
        </View>
    );
}

const fullScreenStyles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
});
