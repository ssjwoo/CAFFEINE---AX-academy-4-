import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line, Text as SvgText, Ellipse } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isValidName, validatePassword, isEmpty } from '../utils/validation';

// 회원가입 화면
export default function SignupScreen({ navigation }) {
    const { colors } = useTheme();
    const { signup, kakaoSignup } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 생년월일 입력 state (6자리 YYMMDD)
    const [birthDateInput, setBirthDateInput] = useState('');

    // 회원가입 버튼
    const handleSignup = async () => {
        // Validation
        if (isEmpty(name) || isEmpty(email) || isEmpty(password) || isEmpty(confirmPassword) || isEmpty(birthDateInput)) {
            alert('⚠️ 모든 필드를 입력해주세요.');
            return;
        }

        if (!isValidName(name)) {
            alert('올바른 이름을 입력해주세요. (한글 또는 영문 2자 이상)');
            return;
        }

        if (!isValidEmail(email)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            alert('비밀번호 요구사항:\n' + passwordValidation.errors.join('\n'));
            return;
        }

        // 생년월일 변환 (YYYY-MM-DD 형식으로 변환하여 서버 전송)
        let birthDateFormatted = null;
        if (birthDateInput && birthDateInput.length === 6) {
            const yy = birthDateInput.substring(0, 2);
            const mm = birthDateInput.substring(2, 4);
            const dd = birthDateInput.substring(4, 6);
            const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
            birthDateFormatted = `${year}-${mm}-${dd}`;
        }

        setLoading(true);
        const result = await signup(name, email, password, birthDateFormatted);
        setLoading(false);

        if (result.success) {
            alert('회원가입이 완료되었습니다!');
            // AuthContext에서 자동 로그인을 시도하므로, 메인으로 이동하거나 
            // 가입 후 상태 변경에 따라 자동으로 화면이 전환될 수 있음.
            // 여기서는 성공 메시지만 띄움.
        } else {
            alert(result.error);
        }
    };

    // 카카오 회원가입 버튼
    const KAKAO_REST_API_KEY = 'fa925a6646f9491a77eb9c8fd6537a21';
    const REDIRECT_URI = 'http://localhost:8081/auth/kakao/signup/callback';

    const handleKakaoSignup = async () => {
        try {
            const encodedRedirectUri = encodeURIComponent(REDIRECT_URI);
            const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodedRedirectUri}&response_type=code`;

            if (Platform.OS === 'web') {
                window.location.href = kakaoAuthUrl;
            } else {
                await Linking.openURL(kakaoAuthUrl);
            }
        } catch (error) {
            console.error('카카오 회원가입 오류:', error);
            alert('카카오 연결에 실패했습니다.');
        }
    };

    return (
        <LinearGradient
            colors={[...colors.screenGradient, colors.screenGradient[2]]}
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

                        {/* 생년월일 입력 */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>생년월일</Text>
                            <TextInput
                                style={styles.birthInput}
                                placeholder="000212"
                                placeholderTextColor="#9E9E9E"
                                value={birthDateInput}
                                onChangeText={(text) => {
                                    const numOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
                                    setBirthDateInput(numOnly);
                                }}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <Text style={styles.birthHint}>예: 000212 (2000년 2월 12일)</Text>
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

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>또는</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Kakao Signup Button */}
                        <TouchableOpacity
                            style={styles.kakaoButton}
                            onPress={handleKakaoSignup}
                            activeOpacity={0.8}>
                            <View style={styles.kakaoLogoContainer}>
                                <Svg width="20" height="20" viewBox="0 0 24 24">
                                    <Path
                                        d="M12 3C6.48 3 2 6.33 2 10.5c0 2.67 1.76 5.02 4.38 6.36-.18.65-.65 2.36-.75 2.74-.12.48.17.47.37.35.15-.1 2.42-1.64 3.4-2.31.52.08 1.06.12 1.6.12 5.52 0 10-3.33 10-7.26C21 6.33 17.52 3 12 3z"
                                        fill="#3C1E1E"
                                    />
                                </Svg>
                            </View>
                            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
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
        </LinearGradient >
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
    logoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#2563EB',
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: -0.3,
    },
    tagline: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 12,
        color: '#9CA3AF',
    },
    kakaoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE500',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    kakaoLogoContainer: {
        marginRight: 8,
    },
    kakaoButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3C1E1E',
    },
    label: {
        fontSize: 13,
        marginBottom: 6,
    },
    birthInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 3,
        color: '#1F2937',
    },
    birthHint: {
        marginTop: 6,
        fontSize: 12,
        color: '#9CA3AF',
    },
});
