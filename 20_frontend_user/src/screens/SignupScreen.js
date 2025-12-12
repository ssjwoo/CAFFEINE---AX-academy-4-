import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line, Text as SvgText, Ellipse } from 'react-native-svg';
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
    };

    return (
        <LinearGradient
            colors={['#DBEAFE', '#EFF6FF', '#F8FAFC', '#F8FAFC']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <Image 
                            source={require('../../assets/images/caffeine_logo.png')} 
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        {/* Caffeine 단색 텍스트 */}
                        <Text style={styles.appName}>Caffeine</Text>
                        <Text style={styles.tagline}>새로운 계정 만들기</Text>
                    </View>

                    {/* Signup Card */}
                    <View style={styles.signupCard}>
                        {/* Name Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="이름"
                                placeholderTextColor="#9E9E9E"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="이메일"
                                placeholderTextColor="#9E9E9E"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="비밀번호"
                                    placeholderTextColor="#9E9E9E"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity 
                                    onPress={() => setShowPassword(!showPassword)} 
                                    style={styles.eyeButton}>
                                    <Text style={styles.eyeIcon}>
                                        {showPassword ? '👁' : '👁‍🗨'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.hint}>최소 8자, 대소문자 및 숫자 포함</Text>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="비밀번호 확인"
                                    placeholderTextColor="#9E9E9E"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity 
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                                    style={styles.eyeButton}>
                                    <Text style={styles.eyeIcon}>
                                        {showConfirmPassword ? '👁' : '👁‍🗨'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Signup Button */}
                        <TouchableOpacity
                            onPress={handleSignup}
                            disabled={loading}
                            activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#2563EB', '#60A5FA']}
                                style={styles.signupButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}>
                                <Text style={styles.signupButtonText}>
                                    {loading ? '가입 중...' : '회원가입'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginSection}>
                            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>로그인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Terms Footer */}
                    <View style={styles.termsSection}>
                        <Text style={styles.termsText}>
                            가입 시 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
                            <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의합니다
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 40,
    },

    // Logo Section
    logoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 26,
    },
    logoShadow: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        fontFamily: 'Inter_700Bold',
        color: '#2563EB',
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: -0.3,
    },
    tagline: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#2563EB',
        fontWeight: '500',
    },

    // Signup Card
    signupCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },

    // Input Styles
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#212121',
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#212121',
    },
    eyeButton: {
        padding: 8,
    },
    eyeIcon: {
        fontSize: 20,
        color: '#9E9E9E',
    },
    hint: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 6,
        marginLeft: 4,
    },

    // Signup Button
    signupButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    signupButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },

    // Login Section
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: '#6B7280',
    },
    loginLink: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
    },

    // Terms Footer
    termsSection: {
        marginTop: 24,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    termsText: {
        fontSize: 12,
        color: '#9E9E9E',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#9E9E9E',
        textDecorationLine: 'underline',
    },
});
