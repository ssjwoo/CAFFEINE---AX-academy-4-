import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

/**
 * FadeInView 컴포넌트
 * 컴포넌트가 마운트될 때 페이드인 + 슬라이드 업 애니메이션
 * 
 * @param {ReactNode} props.children - 자식 컴포넌트
 * @param {number} props.duration - 애니메이션 지속시간 (ms, 기본: 600)
 * @param {number} props.delay - 애니메이션 시작 지연 (ms, 기본: 0)
 * @param {number} props.distance - 슬라이드 거리 (기본: 20)
 * @param {Object} props.style - 추가 스타일
 */
export default function FadeInView({
    children,
    duration = 600,
    delay = 0,
    distance = 20,
    style
}) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(distance)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: duration,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: duration,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

/**
 * FadeInList 컴포넌트
 * 여러 아이템을 순차적으로 페이드인
 * 
 * @param {Array} props.children - 자식 컴포넌트 배열
 * @param {number} props.stagger - 각 아이템 간 지연 시간 (ms, 기본: 100)
 */
export function FadeInList({ children, stagger = 100, ...props }) {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <FadeInView delay={index * stagger} {...props}>
                    {child}
                </FadeInView>
            ))}
        </>
    );
}
