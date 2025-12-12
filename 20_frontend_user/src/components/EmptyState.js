import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmptyState({ icon = '📊', title, description, actionText, onAction }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <LinearGradient
            colors={['#DBEAFE', '#EFF6FF', '#F8FAFC']}
            style={styles.gradientContainer}
        >
            <Animated.View
                style={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: scaleAnim },
                            { translateY: slideAnim }
                        ],
                    },
                ]}
            >
                {/* Icon Container */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>{icon}</Text>
                    </View>
                </View>

                {/* Text Content */}
                <Text style={styles.title}>{title}</Text>
                {description && (
                    <Text style={styles.description}>{description}</Text>
                )}

                {/* Action Button */}
                {actionText && onAction && (
                    <TouchableOpacity 
                        style={styles.buttonContainer}
                        onPress={onAction}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#2563EB', '#1D4ED8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>{actionText}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Decorative Elements */}
                <View style={styles.decorativeContainer}>
                    <View style={[styles.decorativeDot, { backgroundColor: '#BFDBFE' }]} />
                    <View style={[styles.decorativeDot, { backgroundColor: '#93C5FD', width: 8, height: 8 }]} />
                    <View style={[styles.decorativeDot, { backgroundColor: '#60A5FA' }]} />
                </View>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    icon: {
        fontSize: 56,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        letterSpacing: 0.5,
    },
    decorativeContainer: {
        flexDirection: 'row',
        marginTop: 48,
        gap: 8,
    },
    decorativeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
