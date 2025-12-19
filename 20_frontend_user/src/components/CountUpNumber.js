import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated } from 'react-native';

/**
 * CountUpNumber 컴포넌트
 * 숫자가 0부터 목표값까지 카운트업하는 애니메이션
 * 
 * @param {number} props.value - 최종 목표 값
 * @param {number} props.duration - 애니메이션 지속시간 (ms, 기본: 1000)
 * @param {Function} props.formatter - 숫자 포맷팅 함수
 * @param {Object} props.style - 텍스트 스타일
 */
export default function CountUpNumber({
    value,
    duration = 1000,
    formatter = (num) => num.toString(),
    style,
    ...rest
}) {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayText, setDisplayText] = useState(formatter(0));

    useEffect(() => {
        // value가 0이면 즉시 표시
        if (value === 0) {
            setDisplayText(formatter(0));
            return;
        }

        // 애니메이션 리스너 설정
        const listener = animatedValue.addListener(({ value: currentValue }) => {
            setDisplayText(formatter(Math.floor(currentValue)));
        });

        // 애니메이션 시작값 리셋
        animatedValue.setValue(0);

        // 카운트업 애니메이션 시작
        Animated.timing(animatedValue, {
            toValue: value,
            duration: duration,
            useNativeDriver: false, // Text 업데이트는 native driver 사용 불가
        }).start();

        return () => {
            animatedValue.removeListener(listener);
        };
    }, [value, duration, formatter]);

    return (
        <Text style={style} {...rest}>
            {displayText}
        </Text>
    );
}

