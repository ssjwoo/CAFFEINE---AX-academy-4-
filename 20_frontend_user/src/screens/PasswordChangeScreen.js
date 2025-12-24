import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

// 비밀번호 변경
export default function PasswordChangeScreen({ navigation }) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const handleChangePassword = async () => {
        // 유효성 검사
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('알림', '모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('알림', '새 비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('알림', '새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert('알림', '현재 비밀번호와 다른 비밀번호를 입력해주세요.');
            return;
        }

        console.log('비밀번호 변경 요청 시작:', { current: currentPassword.length, new: newPassword.length });
        setLoading(true);
        try {
            console.log('API 요청 전송 중...');
            const response = await apiClient.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            console.log('API 응답:', response.data);
            
            // 웹에서도 알림 표시
            if (typeof window !== 'undefined') {
                window.alert('비밀번호가 성공적으로 변경되었습니다!');
            }
            
            Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
            
            // 프로필 페이지로 돌아가기
            navigation.goBack();
        } catch (error) {
            console.error('비밀번호 변경 에러:', error);
            console.error('에러 상세:', error.response?.data);
            const message = error.response?.data?.detail || '비밀번호 변경에 실패했습니다.';
            Alert.alert('오류', message);
        } finally {
            setLoading(false);
        }
    };

    // 소셜 로그인 사용자는 비밀번호 변경 불가
    if (user?.provider === 'kakao' || user?.provider === 'google') {
        return (
            <LinearGradient colors={colors.screenGradient} style={styles.container}>
                <View style={styles.socialLoginMessage}>
                    <Feather name="info" size={48} color={colors.textSecondary} />
                    <Text style={[styles.socialLoginText, { color: colors.text }]}>
                        소셜 로그인 사용자는{'\n'}비밀번호를 변경할 수 없습니다.
                    </Text>
                    <Text style={[styles.socialLoginSubtext, { color: colors.textSecondary }]}>
                        {user?.provider === 'kakao' ? '카카오' : '구글'} 계정으로 로그인하셨습니다.
                    </Text>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={colors.screenGradient} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        새로운 비밀번호는 8자 이상이어야 합니다.
                    </Text>

                    {/* 현재 비밀번호 */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>현재 비밀번호</Text>
                        <View style={[styles.passwordWrapper, { borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text }]}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="현재 비밀번호 입력"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                <Feather name={showCurrentPassword ? "eye" : "eye-off"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 새 비밀번호 */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>새 비밀번호</Text>
                        <View style={[styles.passwordWrapper, { borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="새 비밀번호 입력 (8자 이상)"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Feather name={showNewPassword ? "eye" : "eye-off"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 새 비밀번호 확인 */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>새 비밀번호 확인</Text>
                        <View style={[styles.passwordWrapper, { borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: colors.text }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="새 비밀번호 다시 입력"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 변경 버튼 */}
                    <TouchableOpacity 
                        style={[styles.changeButton, loading && styles.changeButtonDisabled]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.changeButtonText}>비밀번호 변경</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    description: {
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderWidth: 2,
        borderRadius: 12,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    changeButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    changeButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    changeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    socialLoginMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    socialLoginText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 26,
    },
    socialLoginSubtext: {
        fontSize: 14,
        marginTop: 12,
    },
    backButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 32,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
