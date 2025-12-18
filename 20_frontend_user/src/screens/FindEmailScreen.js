import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, 
        Platform, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '../api/client';

export default function FindEmailScreen({ navigation }) {
    const { colors } = useTheme();
    
    // 상태 관리
    const [name, setName] = useState('');           // 이름 입력
    const [phone, setPhone] = useState('');         // 전화번호 입력
    const [loading, setLoading] = useState(false);  // 로딩 상태
    const [result, setResult] = useState(null);     // 조회 결과
    
    // 전화번호 포맷팅 (010-1234-5678 형식)
    const formatPhone = (text) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        
        if (cleaned.length >= 4 && cleaned.length < 8) {
            formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
        } else if (cleaned.length >= 8) {
            formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7, 11);
        }
        
        return formatted;
    };
    
    // 전화번호 입력 핸들러
    const handlePhoneChange = (text) => {
        setPhone(formatPhone(text));
    };
    
    // 이메일 찾기 API 호출
    const handleFindEmail = async () => {
        // 입력값 검증
        if (!name.trim()) {
            Alert.alert('알림', '이름을 입력해주세요.');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('알림', '전화번호를 입력해주세요.');
            return;
        }
        
        setLoading(true);
        setResult(null);
        
        try {
            const response = await apiClient.post('/auth/find-email', {
                name: name.trim(),
                phone: phone.replace(/-/g, '')  // 하이픈 제거하여 전송
            });
            
            setResult(response.data);
        } catch (error) {
            console.error('이메일 찾기 오류:', error);
            Alert.alert('오류', '서버 연결에 실패했습니다.');
        } finally {
            setLoading(false);
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
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        아이디 찾기
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
                
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    
                    {/* 안내 문구 */}
                    <View style={styles.infoSection}>
                        <Feather name="user" size={48} color="#2563EB" />
                        <Text style={[styles.infoTitle, { color: colors.text }]}>
                            가입된 이메일 찾기
                        </Text>
                        <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                            회원가입 시 입력한 이름과 전화번호를{'\n'}입력해주세요.
                        </Text>
                    </View>
                    
                    {/* 입력 폼 카드 */}
                    <View style={[styles.formCard, { backgroundColor: colors.cardBackground }]}>
                        {/* 이름 입력 */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                이름
                            </Text>
                            <TextInput
                                style={[styles.input, { 
                                    color: colors.text, 
                                    borderColor: colors.border,
                                    backgroundColor: colors.background 
                                }]}
                                placeholder="홍길동"
                                placeholderTextColor={colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                        
                        {/* 전화번호 입력 */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                전화번호
                            </Text>
                            <TextInput
                                style={[styles.input, { 
                                    color: colors.text, 
                                    borderColor: colors.border,
                                    backgroundColor: colors.background 
                                }]}
                                placeholder="010-1234-5678"
                                placeholderTextColor={colors.textSecondary}
                                value={phone}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={13}
                            />
                        </View>
                        
                        {/* 이메일 찾기 버튼 */}
                        <TouchableOpacity
                            onPress={handleFindEmail}
                            disabled={loading}
                            activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#2563EB', '#60A5FA']}
                                style={styles.submitButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}>
                                <Text style={styles.submitButtonText}>
                                    {loading ? '조회 중...' : '이메일 찾기'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    
                    {/* 조회 결과 표시 */}
                    {result && (
                        <View style={[styles.resultCard, { 
                            backgroundColor: result.found ? '#ECFDF5' : '#FEF2F2',
                            borderColor: result.found ? '#10B981' : '#EF4444'
                        }]}>
                            <Feather 
                                name={result.found ? 'check-circle' : 'x-circle'} 
                                size={32} 
                                color={result.found ? '#10B981' : '#EF4444'} 
                            />
                            <Text style={[styles.resultMessage, { 
                                color: result.found ? '#065F46' : '#991B1B' 
                            }]}>
                                {result.message}
                            </Text>
                            
                            {/* 이메일 찾은 경우 - 마스킹된 이메일 표시 */}
                            {result.found && (
                                <View style={styles.emailBox}>
                                    <Text style={styles.emailLabel}>가입된 이메일</Text>
                                    <Text style={styles.emailText}>{result.masked_email}</Text>
                                </View>
                            )}
                            
                            {/* 로그인 페이지 이동 버튼 */}
                            {result.found && (
                                <TouchableOpacity
                                    style={styles.loginLinkButton}
                                    onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.loginLinkText}>로그인하러 가기 →</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    
                    {/* 비밀번호 찾기 링크 */}
                    <View style={styles.linkSection}>
                        <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                            비밀번호를 잊으셨나요?
                        </Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('ResetPassword')}>
                            <Text style={styles.linkButton}>비밀번호 재설정</Text>
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
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    
    // 스크롤 컨텐츠
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    
    // 안내 섹션
    infoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    infoTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    infoSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
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
    
    // 결과 카드
    resultCard: {
        marginTop: 24,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
    },
    resultMessage: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    emailBox: {
        marginTop: 16,
        alignItems: 'center',
    },
    emailLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    loginLinkButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#2563EB',
        borderRadius: 8,
    },
    loginLinkText: {
        color: '#fff',
        fontWeight: '600',
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
