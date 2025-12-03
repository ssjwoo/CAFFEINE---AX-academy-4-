import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isValidName, validatePassword, isEmpty } from '../utils/validation';

export default function SignupScreen({ navigation }) {
    const { colors } = useTheme();
    const { signup } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSignup = async () => {
        // Validation
        if (isEmpty(name) || isEmpty(email) || isEmpty(password) || isEmpty(confirmPassword)) {
            alert('⚠️ 모든 필드를 입력해주세요.');
            return;
        }

        if (!isValidName(name)) {
            alert('⚠️ 올바른 이름을 입력해주세요. (한글 또는 영문 2자 이상)');
            return;
        }

        if (!isValidEmail(email)) {
            alert('⚠️ 올바른 이메일 형식을 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            alert('⚠️ 비밀번호가 일치하지 않습니다.');
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            alert('⚠️ 비밀번호 요구사항:\n' + passwordValidation.errors.join('\n'));
            return;
        }

        setLoading(true);
        const result = await signup(name, email, password);
        setLoading(false);

        if (!result.success) {
            alert('❌ ' + result.error);
        }
        // 성공 시 자동으로 메인 화면으로 이동
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles(colors).container}>
            <ScrollView contentContainerStyle={styles(colors).scrollContent}>
                <View style={styles(colors).content}>
                    {/* Logo Section */}
                    <View style={styles(colors).logoSection}>
                        <Text style={styles(colors).logo}>☕</Text>
                        <Text style={styles(colors).appName}>Caffeine</Text>
                        <Text style={styles(colors).tagline}>새로운 계정 만들기</Text>
                    </View>

                    {/* Signup Form */}
                    <View style={styles(colors).formSection}>
                        <Text style={styles(colors).welcomeText}>회원가입</Text>
                        <Text style={styles(colors).subText}>정보를 입력하여 계정을 만드세요</Text>

                        <View style={styles(colors).inputContainer}>
                            <Text style={styles(colors).label}>이름</Text>
                            <TextInput
                                style={styles(colors).input}
                                placeholder="홍길동"
                                placeholderTextColor={colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles(colors).inputContainer}>
                            <Text style={styles(colors).label}>이메일</Text>
                            <TextInput
                                style={styles(colors).input}
                                placeholder="example@caffeine.com"
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles(colors).inputContainer}>
                            <Text style={styles(colors).label}>비밀번호</Text>
                            <View style={styles(colors).passwordContainer}>
                                <TextInput
                                    style={styles(colors).passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles(colors).eyeButton}>
                                    <Text style={styles(colors).eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles(colors).hint}>최소 8자, 대소문자 및 숫자 포함</Text>
                        </View>

                        <View style={styles(colors).inputContainer}>
                            <Text style={styles(colors).label}>비밀번호 확인</Text>
                            <View style={styles(colors).passwordContainer}>
                                <TextInput
                                    style={styles(colors).passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles(colors).eyeButton}>
                                    <Text style={styles(colors).eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles(colors).signupButton}
                            onPress={handleSignup}
                            disabled={loading}>
                            <Text style={styles(colors).signupButtonText}>
                                {loading ? '가입 중...' : '회원가입'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles(colors).loginSection}>
                            <Text style={styles(colors).loginText}>이미 계정이 있으신가요? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles(colors).loginLink}>로그인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, padding: 24, justifyContent: 'center', maxWidth: 500, width: '100%', alignSelf: 'center' },

    logoSection: { alignItems: 'center', marginBottom: 48 },
    logo: { fontSize: 72, marginBottom: 16 },
    appName: { fontSize: 36, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    tagline: { fontSize: 16, color: colors.textSecondary },

    formSection: { width: '100%' },
    welcomeText: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    subText: { fontSize: 14, color: colors.textSecondary, marginBottom: 32 },

    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    input: {
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text
    },
    hint: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: colors.text
    },
    eyeButton: {
        padding: 8,
    },
    eyeIcon: {
        fontSize: 20,
    },

    signupButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24
    },
    signupButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

    loginSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginText: { fontSize: 14, color: colors.text },
    loginLink: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
});
