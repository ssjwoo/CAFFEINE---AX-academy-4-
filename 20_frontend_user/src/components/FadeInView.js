import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// 단일 아이템에 페이드인 애니메이션 적용
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

// 여러 아이템을 순차적으로 페이드인 애니메이션으로 표시
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
