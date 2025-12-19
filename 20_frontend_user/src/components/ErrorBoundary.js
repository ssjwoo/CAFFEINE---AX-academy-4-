import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

// ErrorBoundary 컴포넌트
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        if (__DEV__) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };
    // 에러가 발생했을 때
    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.emoji}>😵</Text>
                        <Text style={styles.title}>앗! 문제가 발생했어요</Text>
                        <Text style={styles.description}>
                            예기치 않은 오류가 발생했습니다.{'\n'}
                            잠시 후 다시 시도해주세요.
                        </Text>

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

                        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                            <Text style={styles.buttonText}>다시 시도하기</Text>
                        </TouchableOpacity>

                        <Text style={styles.helpText}>
                            문제가 계속되면 앱을 재시작해주세요.
                        </Text>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}

// 스타일
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
