/**
 * ═══════════════════════════════════════════════════════════════
 * AnimatedButton.js - 터치 피드백이 있는 애니메이션 버튼
 * ═══════════════════════════════════════════════════════════════
 * 
 * 📌 이 컴포넌트의 역할:
 * - 터치 시 스케일(크기) 애니메이션 제공
 * - Opacity(투명도) 변화로 시각적 피드백
 * - Spring 애니메이션으로 부드러운 반동 효과
 * 
 * 🎬 애니메이션 효과:
 * 1. Press In (누르는 순간):
 *    - 크기: 100% → 95% (살짝 작아짐)
 *    - 투명도: 100% → 80% (살짝 투명해짐)
 * 
 * 2. Press Out (뗄 때):
 *    - 크기: 95% → 100% (원래대로, 통통 튀는 효과)
 *    - 투명도: 80% → 100% (원래대로)
 * 
 * 🌐 사용 방법:
 * ```javascript
 * import AnimatedButton from '../components/AnimatedButton';
 * 
 * <AnimatedButton 
 *     style={styles.myButton}
 *     onPress={() => console.log('clicked')}
 * >
 *     <Text>클릭하세요</Text>
 * </AnimatedButton>
 * ```
 */

import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';

/**
 * AnimatedButton 컴포넌트
 * 
 * @param {Object} props.style - 추가 스타일 (View 스타일)
 * @param {Function} props.onPress - 버튼 클릭 핸들러 함수
 * @param {ReactNode} props.children - 버튼 내부에 표시할 내용 (Text, Icon 등)
 * @param {boolean} props.disabled - 비활성화 여부 (기본: false)
 * @param {number} props.scaleValue - 눌렀을 때 스케일 값 (기본: 0.95)
 *                                    0.95 = 95% 크기, 0.9 = 90% 크기
 * @param {...any} props.rest - TouchableOpacity에 전달할 기타 props
 * 
 * @example
 * // 기본 사용
 * <AnimatedButton onPress={handleClick}>
 *     <Text>버튼</Text>
 * </AnimatedButton>
 * 
 * @example
 * // 커스텀 스케일 값
 * <AnimatedButton scaleValue={0.9} onPress={handleClick}>
 *     <Text>더 많이 줄어드는 버튼</Text>
 * </AnimatedButton>
 */
export default function AnimatedButton({
    style,
    onPress,
    children,
    disabled = false,
    scaleValue = 0.95,
    ...rest
}) {
    // ═══ Animation Values (애니메이션 값 관리) ═══

    /**
     * scaleAnim - 크기 조절 애니메이션 값
     * 초기값: 1 (100% 크기)
     * 
     * useRef를 사용하는 이유:
     * - 컴포넌트가 리렌더링되어도 값이 유지됨
     * - 애니메이션 값이 바뀌어도 불필요한 리렌더링 방지
     */
    const scaleAnim = useRef(new Animated.Value(1)).current;

    /**
     * opacityAnim - 투명도 애니메이션 값
     * 초기값: 1 (100% 불투명)
     */
    const opacityAnim = useRef(new Animated.Value(1)).current;

    /**
     * handlePressIn - 버튼을 누르는 순간 실행되는 함수
     * 
     * 📱 동작:
     * 1. 크기 줄이기 (100% → 95%)
     * 2. 투명도 낮추기 (100% → 80%)
     * 3. 두 애니메이션을 동시에 실행 (parallel)
     * 
     * ⚡ 사용된 애니메이션:
     * - Animated.spring: 통통 튀는 느낌의 애니메이션
     * - Animated.timing: 일정한 속도의 애니메이션
     */
    const handlePressIn = () => {
        // 두 애니메이션을 동시에 실행
        Animated.parallel([
            // 크기 애니메이션 (Spring = 통통 튀는 효과)
            Animated.spring(scaleAnim, {
                toValue: scaleValue,      // 목표값: 0.95 (95%)
                useNativeDriver: true,    // 네이티브 레벨에서 실행 (성능 향상)
                speed: 50,                // 애니메이션 속도
                bounciness: 4,            // 튀는 정도 (낮을수록 덜 튐)
            }),
            // 투명도 애니메이션 (Timing = 일정한 속도)
            Animated.timing(opacityAnim, {
                toValue: 0.8,             // 목표값: 0.8 (80%)
                duration: 100,            // 100ms 동안 실행
                useNativeDriver: true,
            }),
        ]).start();
    };

    /**
     * handlePressOut - 버튼에서 손을 뗄 때 실행되는 함수
     * 
     * 📱 동작:
     * 1. 크기 원래대로 (95% → 100%)
     * 2. 투명도 원래대로 (80% → 100%)
     * 3. Spring 효과로 통통 튀면서 돌아옴
     */
    const handlePressOut = () => {
        Animated.parallel([
            // 크기를 원래대로 (Spring 효과로 통통 튀면서)
            Animated.spring(scaleAnim, {
                toValue: 1,               // 목표값: 1 (100%)
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }),
            // 투명도를 원래대로
            Animated.timing(opacityAnim, {
                toValue: 1,               // 목표값: 1 (100%)
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <TouchableOpacity
            // ═══ TouchableOpacity 설정 ═══

            // activeOpacity={1}: 기본 터치 효과 비활성화
            // (우리가 직접 만든 애니메이션을 사용하기 위해)
            activeOpacity={1}

            // 터치 이벤트 핸들러
            onPressIn={handlePressIn}   // 누르는 순간
            onPressOut={handlePressOut} // 뗄 때
            onPress={onPress}           // 클릭 완료 시

            // 비활성화 여부
            disabled={disabled}

            // 기타 props 전달 (예: testID, accessible 등)
            {...rest}
        >
            {/* ═══ 애니메이션이 적용되는 View ═══ */}
            <Animated.View
                style={[
                    // 사용자가 전달한 스타일 먼저 적용
                    style,
                    // 애니메이션 스타일 적용 (덮어쓰기)
                    {
                        // transform: 크기, 회전, 이동 등의 변환
                        // scale: 크기 조절 (scaleAnim 값 사용)
                        transform: [{ scale: scaleAnim }],

                        // opacity: 투명도 (opacityAnim 값 사용)
                        opacity: opacityAnim,
                    },
                ]}
            >
                {/* 버튼 내부 콘텐츠 (Text, Icon 등) */}
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * 📌 Quick Reference - 빠른 참조
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. 기본 사용:
 *    <AnimatedButton onPress={handleClick}>
 *        <Text>클릭</Text>
 *    </AnimatedButton>
 * 
 * 2. 커스텀 스케일:
 *    <AnimatedButton scaleValue={0.9} onPress={handleClick}>
 *        <Text>더 작아짐</Text>
 *    </AnimatedButton>
 * 
 * 3. 스타일 적용:
 *    <AnimatedButton style={styles.myButton} onPress={handleClick}>
 *        <View>...</View>
 *    </AnimatedButton>
 * 
 * 4. 비활성화:
 *    <AnimatedButton disabled={loading} onPress={handleClick}>
 *        <Text>{loading ? '처리중...' : '제출'}</Text>
 *    </AnimatedButton>
 * 
 * 5. 카드 전체를 버튼으로:
 *    <AnimatedButton style={styles.card} onPress={openDetail}>
 *        <View>
 *            <Text>제목</Text>
 *            <Text>내용</Text>
 *        </View>
 *    </AnimatedButton>
 * 
 * ⚡ 성능 최적화:
 * - useNativeDriver: true로 네이티브 레벨 실행 (60fps)
 * - useRef 사용으로 불필요한 리렌더링 방지
 * - Spring 애니메이션으로 자연스러운 피드백
 * 
 * ═══════════════════════════════════════════════════════════════
 */
