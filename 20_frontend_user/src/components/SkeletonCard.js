import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export function SkeletonCard() {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles(colors).card, { opacity }]}>
            <View style={styles(colors).header} />
            <View style={styles(colors).line} />
            <View style={[styles(colors).line, { width: '60%' }]} />
        </Animated.View>
    );
}

export function SkeletonList({ count = 3 }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </View>
    );
}

// 차트용 스켈레톤
export function SkeletonChart() {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles(colors).card, { opacity, height: 220 }]}>
            <View style={styles(colors).header} />
            <View style={styles(colors).chartPlaceholder} />
        </Animated.View>
    );
}

// 거래내역용 스켈레톤
export function SkeletonTransaction() {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles(colors).card, { opacity }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={[styles(colors).header, { width: '40%' }]} />
                <View style={[styles(colors).header, { width: '30%' }]} />
            </View>
            <View style={[styles(colors).line, { width: '70%' }]} />
        </Animated.View>
    );
}

// 통계 카드용 스켈레톤
export function SkeletonStats() {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles(colors).statCard, { opacity }]}>
            <View style={[styles(colors).line, { width: '40%', marginBottom: 12 }]} />
            <View style={[styles(colors).header, { width: '60%', height: 32 }]} />
        </Animated.View>
    );
}

const styles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    header: {
        height: 20,
        backgroundColor: colors.border,
        borderRadius: 4,
        marginBottom: 12,
        width: '40%',
    },
    line: {
        height: 12,
        backgroundColor: colors.border,
        borderRadius: 4,
        marginBottom: 8,
    },
    chartPlaceholder: {
        height: 150,
        backgroundColor: colors.border,
        borderRadius: 8,
        marginTop: 8,
    },
    statCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 100,
    },
});
