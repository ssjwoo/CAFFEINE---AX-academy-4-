import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function EmptyState({ icon = '📭', title, description, actionText, onAction }) {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles(colors).container,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <Text style={styles(colors).icon}>{icon}</Text>
            <Text style={styles(colors).title}>{title}</Text>
            <Text style={styles(colors).description}>{description}</Text>
            {actionText && onAction && (
                <TouchableOpacity style={styles(colors).button} onPress={onAction}>
                    <Text style={styles(colors).buttonText}>{actionText}</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    icon: {
        fontSize: 72,
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
