import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

/**
 * ============================================================
 * 에러 바운더리 컴포넌트
 * ============================================================
 * 
 * 역할:
 * - React 컴포넌트 트리에서 발생하는 예기치 않은 에러를 포착
 * - 앱 전체가 크래시되는 대신 친절한 에러 화면 표시
 * - 사용자에게 재시도 옵션 제공
 * 
 * 사용법:
 * App.js에서 최상위 컴포넌트를 감싸기
 * 
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * 
 * 백엔드 연동:
 * - hasError 상태가 true일 때 에러 로그를 서버로 전송
 * - Sentry, LogRocket 같은 에러 트래킹 서비스 연동 가능
 * ============================================================
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    /**
     * 에러 발생 시 호출되는 라이프사이클 메서드
     * 에러 상태를 업데이트하여 폴백 UI 표시
     */
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    /**
     * 에러 정보를 캡처하고 로깅
     * 
     * TODO: 백엔드 API 연동
     * - 에러 정보를 서버로 전송
     * - 사용자 정보, 디바이스 정보 포함
     * 
     * @example
     * // 백엔드 연동 예시:
     * componentDidCatch(error, errorInfo) {
     *   this.setState({ error, errorInfo });
     *   
     *   // 서버로 에러 전송
     *   fetch('/api/errors/report', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({
     *       error: error.toString(),
     *       errorInfo: errorInfo.componentStack,
     *       timestamp: new Date().toISOString(),
     *       userId: getCurrentUserId(), // 현재 사용자 ID
     *       deviceInfo: getDeviceInfo(), // 디바이스 정보
     *     }),
     *   });
     * }
     */
    componentDidCatch(error, errorInfo) {
        // 에러 정보 저장
        this.setState({
            error,
            errorInfo,
        });

        // 개발 환경에서는 콘솔에 에러 출력
        if (__DEV__) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // TODO: 프로덕션 환경에서는 에러 트래킹 서비스로 전송
        // 예: Sentry.captureException(error, { extra: errorInfo });
    }

    /**
     * 에러 상태 초기화 및 재시도
     */
    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // 에러 발생 시 표시할 폴백 UI
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.emoji}>😵</Text>
                        <Text style={styles.title}>앗! 문제가 발생했어요</Text>
                        <Text style={styles.description}>
                            예기치 않은 오류가 발생했습니다.{'\n'}
                            잠시 후 다시 시도해주세요.
                        </Text>

                        {/* 개발 모드에서만 에러 상세 정보 표시 */}
                        {__DEV__ && this.state.error && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>에러 상세 정보 (개발 모드)</Text>
                                <Text style={styles.errorText}>
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* 재시도 버튼 */}
                        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                            <Text style={styles.buttonText}>다시 시도하기</Text>
                        </TouchableOpacity>

                        {/* 추가 도움말 */}
                        <Text style={styles.helpText}>
                            문제가 계속되면 앱을 재시작해주세요.
                        </Text>
                    </ScrollView>
                </View>
            );
        }

        // 에러가 없으면 children을 정상적으로 렌더링
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    errorDetails: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginVertical: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#495057',
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    errorStack: {
        fontSize: 10,
        color: '#6c757d',
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: '#bfa094',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    helpText: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 20,
        textAlign: 'center',
    },
});

export default ErrorBoundary;
