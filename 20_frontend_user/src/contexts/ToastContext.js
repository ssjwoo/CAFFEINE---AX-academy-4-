import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;

    const showToast = (message, duration = null) => {  // duration 무시, 수동 닫기만 허용
        setToast({ message });
    };

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 100,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setToast(null);
            slideAnim.setValue(100);
        });
    };

    useEffect(() => {
        if (toast) {
            // 애니메이션: 페이드인 + 슬라이드업
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // 자동 사라짐 제거 - 사용자가 수동으로 닫을 때까지 유지
        }
    }, [toast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.toastContent}>
                        <Text style={styles.toastIcon}>💬</Text>
                        <View style={styles.toastTextContainer}>
                            <Text style={styles.toastTitle}>잠깐만 AI</Text>
                            <Text style={styles.toastMessage}>{toast.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        zIndex: 9999,
        elevation: 10,
    },
    toastContent: {
        flexDirection: 'row',
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#6366F1',
    },
    toastIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    toastTextContainer: {
        flex: 1,
    },
    toastTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    toastMessage: {
        fontSize: 13,
        color: '#E5E7EB',
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#9CA3AF',
        fontWeight: '700',
    },
});
