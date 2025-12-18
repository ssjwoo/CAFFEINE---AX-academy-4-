import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, 
        KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '../api/client';

export default function ResetPasswordScreen({ navigation }) {
    const { colors } = useTheme();
    
    // 상태 관리
    const [step, setStep] = useState(1);                    // 현재 단계 (1: 이메일, 2: 인증코드, 3: 새 비밀번호)
    const [email, setEmail] = useState('');                 // 이메일 입력
    const [code, setCode] = useState('');                   // 인증 코드 입력
    const [newPassword, setNewPassword] = useState('');     // 새 비밀번호
    const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인
    const [showPassword, setShowPassword] = useState(false);    // 비밀번호 표시 토글
    const [loading, setLoading] = useState(false);              // 로딩 상태
    
    // 1단계: 인증 코드 발송 요청
    const handleRequestCode = async () => {
        // 이메일 입력 검증
        if (!email.trim()) {
            Alert.alert('알림', '이메일을 입력해주세요.');
            return;
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
            return;
        }
        
        setLoading(true);
        
        try {
            await apiClient.post('/auth/request-password-reset', { email });
            Alert.alert('발송 완료', '인증 코드가 이메일로 발송되었습니다.\n이메일을 확인해주세요.');
            setStep(2);  // 2단계로 이동
        } catch (error) {
            console.error('인증 코드 발송 오류:', error);
            const message = error.response?.data?.detail || '서버 연결에 실패했습니다.';
            Alert.alert('오류', message);
        } finally {
            setLoading(false);
        }
    };
    
    // 2단계: 인증 코드 확인
    const handleVerifyCode = async () => {
        // 인증 코드 입력 검증
        if (!code.trim() || code.length !== 6) {
            Alert.alert('알림', '6자리 인증 코드를 입력해주세요.');
            return;
        }
        
        setLoading(true);
        
        try {
            await apiClient.post('/auth/verify-reset-code', { email, code });
            setStep(3);  // 3단계로 이동
        } catch (error) {
            console.error('인증 코드 확인 오류:', error);
            const message = error.response?.data?.detail || '인증 코드가 올바르지 않습니다.';
            Alert.alert('오류', message);
        } finally {
            setLoading(false);
        }
    };
    
    // 3단계: 비밀번호 변경
    const handleResetPassword = async () => {
        // 비밀번호 길이 검증
        if (!newPassword || newPassword.length < 8) {
            Alert.alert('알림', '비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        
        // 비밀번호 일치 검증
        if (newPassword !== confirmPassword) {
            Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
            return;
        }
        
        setLoading(true);
        
        try {
            await apiClient.post('/auth/reset-password', { 
                email, 
                code, 
                new_password: newPassword 
            });
            // 성공 알림 표시 후 로그인 페이지로 이동
            alert('✅ 비밀번호가 성공적으로 변경되었습니다!\n로그인해주세요.');
            navigation.navigate('Login');
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            const message = error.response?.data?.detail || '비밀번호 변경에 실패했습니다.';
            Alert.alert('오류', message);
        } finally {
            setLoading(false);
        }
    };
    
    // 인증 코드 재발송
    const handleResendCode = async () => {
        setLoading(true);
        try {
            await apiClient.post('/auth/request-password-reset', { email });
            Alert.alert('발송 완료', '인증 코드가 다시 발송되었습니다.');
        } catch (error) {
            Alert.alert('오류', '인증 코드 재발송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };
    
    // 단계별 아이콘 반환
    const getStepIcon = () => {
        switch(step) {
            case 1: return 'mail';
            case 2: return 'shield';
            case 3: return 'lock';
            default: return 'mail';
        }
    };
    
    // 단계별 제목 반환
    const getStepTitle = () => {
        switch(step) {
            case 1: return '이메일 입력';
            case 2: return '인증 코드 확인';
            case 3: return '새 비밀번호 설정';
            default: return '비밀번호 재설정';
        }
    };
    
    // 화면 렌더링
    return (
        <LinearGradient
            colors={colors.screenGradient}
            style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}>
                
                {/* 헤더 영역 */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => {
                            // 뒤로가기: 이전 단계 또는 화면 닫기
                            if (step > 1) {
                                setStep(step - 1);
                            } else {
                                navigation.goBack();
                            }
                        }}
                        style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        비밀번호 재설정
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
                
                {/* 진행 상태 표시 */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3].map((s) => (
                        <View key={s} style={styles.progressItem}>
                            <View style={[
                                styles.progressDot,
                                { backgroundColor: s <= step ? '#2563EB' : '#E5E7EB' }
                            ]}>
                                {s < step && <Feather name="check" size={12} color="#fff" />}
                                {s === step && <Text style={styles.progressNumber}>{s}</Text>}
                            </View>
                            {s < 3 && (
                                <View style={[
                                    styles.progressLine,
                                    { backgroundColor: s < step ? '#2563EB' : '#E5E7EB' }
                                ]} />
                            )}
                        </View>
                    ))}
                </View>
                
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    
                    {/* 안내 문구 */}
                    <View style={styles.infoSection}>
                        <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                            <Feather name={getStepIcon()} size={32} color="#2563EB" />
                        </View>
                        <Text style={[styles.infoTitle, { color: colors.text }]}>
                            {getStepTitle()}
                        </Text>
                    </View>
                    
                    {/* 입력 폼 카드 */}
                    <View style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
                        
                        {/* 1단계: 이메일 입력 */}
                        {step === 1 && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        가입한 이메일
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { 
                                            color: colors.text, 
                                            borderColor: colors.border,
                                            backgroundColor: colors.background 
                                        }]}
                                        placeholder="example@email.com"
                                        placeholderTextColor={colors.textSecondary}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                                        가입 시 사용한 이메일로 인증 코드가 발송됩니다.
                                    </Text>
                                </View>
                                
                                {/* 인증 코드 발송 버튼 */}
                                <TouchableOpacity
                                    onPress={handleRequestCode}
                                    disabled={loading}
                                    activeOpacity={0.8}>
                                    <LinearGradient
                                        colors={['#2563EB', '#60A5FA']}
                                        style={styles.submitButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}>
                                        <Text style={styles.submitButtonText}>
                                            {loading ? '발송 중...' : '인증 코드 발송'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                        
                        {/* 2단계: 인증 코드 입력 */}
                        {step === 2 && (
                            <>
                                {/* 발송된 이메일 표시 */}
                                <View style={styles.emailInfo}>
                                    <Feather name="mail" size={16} color="#6B7280" />
                                    <Text style={styles.emailInfoText}>{email}</Text>
                                </View>
                                
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        인증 코드 (6자리)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, styles.codeInput, { 
                                            color: colors.text, 
                                            borderColor: colors.border,
                                            backgroundColor: colors.background 
                                        }]}
                                        placeholder="000000"
                                        placeholderTextColor={colors.textSecondary}
                                        value={code}
                                        onChangeText={setCode}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>
                                
                                {/* 인증 코드 확인 버튼 */}
                                <TouchableOpacity
                                    onPress={handleVerifyCode}
                                    disabled={loading}
                                    activeOpacity={0.8}>
                                    <LinearGradient
                                        colors={['#2563EB', '#60A5FA']}
                                        style={styles.submitButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}>
                                        <Text style={styles.submitButtonText}>
                                            {loading ? '확인 중...' : '인증 코드 확인'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                
                                {/* 재발송 버튼 */}
                                <TouchableOpacity 
                                    onPress={handleResendCode}
                                    style={styles.resendButton}
                                    disabled={loading}>
                                    <Text style={styles.resendButtonText}>
                                        인증 코드 재발송
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                        
                        {/* 3단계: 새 비밀번호 입력 */}
                        {step === 3 && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        새 비밀번호
                                    </Text>
                                    <View style={styles.passwordWrapper}>
                                        <TextInput
                                            style={[styles.passwordInput, { 
                                                color: colors.text, 
                                                borderColor: colors.border,
                                                backgroundColor: colors.background 
                                            }]}
                                            placeholder="8자 이상"
                                            placeholderTextColor={colors.textSecondary}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeButton}>
                                            <Feather 
                                                name={showPassword ? 'eye' : 'eye-off'} 
                                                size={20} 
                                                color="#9E9E9E" 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        비밀번호 확인
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { 
                                            color: colors.text, 
                                            borderColor: colors.border,
                                            backgroundColor: colors.background 
                                        }]}
                                        placeholder="비밀번호 재입력"
                                        placeholderTextColor={colors.textSecondary}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    {/* 비밀번호 불일치 경고 */}
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <Text style={styles.errorText}>
                                            비밀번호가 일치하지 않습니다.
                                        </Text>
                                    )}
                                </View>
                                
                                {/* 비밀번호 변경 버튼 */}
                                <TouchableOpacity
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                    activeOpacity={0.8}>
                                    <LinearGradient
                                        colors={['#2563EB', '#60A5FA']}
                                        style={styles.submitButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}>
                                        <Text style={styles.submitButtonText}>
                                            {loading ? '변경 중...' : '비밀번호 변경'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                    
                    {/* 아이디 찾기 링크 */}
                    <View style={styles.linkSection}>
                        <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                            이메일을 잊으셨나요?
                        </Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('FindEmail')}>
                            <Text style={styles.linkButton}>아이디 찾기</Text>
                        </TouchableOpacity>
                    </View>
                    
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

// 스타일 정의
const styles = StyleSheet.create({
    // 컨테이너
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    
    // 헤더
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 10,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    
    // 진행 상태 표시
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 16,
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressNumber: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    progressLine: {
        width: 60,
        height: 3,
        marginHorizontal: 4,
    },
    
    // 스크롤 컨텐츠
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    
    // 안내 섹션
    infoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    
    // 폼 카드
    formCard: {
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    
    // 이메일 정보 표시
    emailInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    emailInfoText: {
        color: '#374151',
        fontSize: 14,
    },
    
    // 입력 필드
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    codeInput: {
        textAlign: 'center',
        fontSize: 24,
        letterSpacing: 8,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        marginTop: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    
    // 비밀번호 입력
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 0,
    },
    eyeButton: {
        padding: 12,
    },
    
    // 제출 버튼
    submitButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    
    // 재발송 버튼
    resendButton: {
        alignItems: 'center',
        marginTop: 16,
        padding: 8,
    },
    resendButtonText: {
        color: '#6B7280',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    
    // 하단 링크
    linkSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        gap: 8,
    },
    linkText: {
        fontSize: 14,
    },
    linkButton: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
    },
});
