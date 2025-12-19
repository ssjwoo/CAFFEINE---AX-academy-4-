import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';

// 애니메이션 버튼
export default function AnimatedButton({
    style,
    onPress,
    children,
    disabled = false,
    scaleValue = 0.95,
    ...rest
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: scaleValue,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };
    // 버튼 떨어짐
    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled}
            {...rest}
        >
            <Animated.View
                style={[
                    style,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    },
                ]}
            >
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
}
