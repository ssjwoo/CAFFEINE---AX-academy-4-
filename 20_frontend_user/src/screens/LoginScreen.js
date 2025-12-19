import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Line, Text as SvgText, Ellipse } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isEmpty } from '../utils/validation';

// 로그인 화면
export default function LoginScreen({ navigation }) {
    const { colors } = useTheme();
    const { login, kakaoLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        // Validation
        if (isEmpty(email) || isEmpty(password)) {
            alert('⚠️ 이메일과 비밀번호를 입력해주세요.');
            return;
        }

        if (!isValidEmail(email)) {
            alert('⚠️ 올바른 이메일 형식을 입력해주세요.');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            alert('❌ ' + result.error);
        }
    };

    // 구글 로그인 버튼
    const handleGoogleLogin = () => {
        alert('Google 로그인 기능은 준비 중입니다.');
    };

    // 카카오 로그인 버튼
    const KAKAO_REST_API_KEY = 'fa925a6646f9491a77eb9c8fd6537a21';
    const REDIRECT_URI = 'http://localhost:8081/auth/kakao/callback';
    
    const handleKakaoLogin = async () => {
        try {
            setLoading(true);
            // 카카오 OAuth 인증 URL (REST API 키 + redirect_uri 인코딩)
            const encodedRedirectUri = encodeURIComponent(REDIRECT_URI);
            const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodedRedirectUri}&response_type=code`;
            
            // 웹 브라우저에서 카카오 로그인 페이지 열기
            if (Platform.OS === 'web') {
                window.location.href = kakaoAuthUrl;
            } else {
                await Linking.openURL(kakaoAuthUrl);
            }
        } catch (error) {
            console.error('카카오 로그인 오류:', error);
            alert('카카오 로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
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
                        {/* Caffeine 텍스트 - Inter Bold */}
                        <Text style={styles.appName}>Caffeine</Text>
                        <Text style={styles.tagline}>스마트한 소비 관리</Text>
                    </View>

                    {/* Login Card */}
                    <View style={styles.loginCard}>
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
                        </View>

                        {/* 아이디 찾기 | 비밀번호 찾기 */}
                        <View style={styles.findLinksContainer}>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('FindEmail')}>
                                <Text style={styles.findLinkText}>아이디 찾기</Text>
                            </TouchableOpacity>
                            <Text style={styles.findLinkDivider}>|</Text>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('ResetPassword')}>
                                <Text style={styles.findLinkText}>비밀번호 찾기</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Signup Link */}
                        <View style={styles.signupSectionTop}>
                            <Text style={styles.signupText}>계정이 없으신가요? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupLink}>회원가입</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#2563EB', '#60A5FA']}
                                style={styles.loginButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}>
                                <Text style={styles.loginButtonText}>
                                    {loading ? '로그인 중...' : '로그인'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>또는</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Kakao Login Button */}
                        <TouchableOpacity 
                            style={styles.kakaoButton}
                            onPress={handleKakaoLogin}
                            activeOpacity={0.7}
                            disabled={loading}>
                            <View style={styles.kakaoLogoContainer}>
                                <Svg width={20} height={20} viewBox="0 0 24 24">
                                    <Path
                                        fill="#000000"
                                        d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.34 4.73 6.77-.16.56-.58 2.03-.67 2.35-.11.4.15.39.31.28.13-.08 2.05-1.39 2.88-1.96.9.13 1.83.2 2.75.2 5.52 0 10-3.58 10-8S17.52 3 12 3z"
                                    />
                                </Svg>
                            </View>
                            <Text style={styles.kakaoButtonText}>
                                {loading ? '로그인 중...' : '카카오로 시작하기'}
                            </Text>
                        </TouchableOpacity>

                        {/* Google Login Button */}
                        <TouchableOpacity 
                            style={styles.googleButton}
                            onPress={handleGoogleLogin}
                            activeOpacity={0.7}>
                            <View style={styles.googleLogoContainer}>
                                <Svg width={20} height={20} viewBox="0 0 24 24">
                                    <Path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <Path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <Path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <Path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </Svg>
                            </View>
                            <Text style={styles.googleButtonText}>Google로 계속하기</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Terms Footer */}
                    <View style={styles.termsSection}>
                        <Text style={styles.termsText}>
                            로그인 시 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
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
        paddingTop: 60,
    },

    // Logo Section
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
    },
    logoShadow: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 24,
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

    // Login Card
    loginCard: {
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

    // 아이디 찾기 | 비밀번호 찾기 링크
    findLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
        gap: 12,
    },
    findLinkText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },
    findLinkDivider: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    signupSectionTop: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    // Login Button
    loginButton: {
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
    loginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#9E9E9E',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingHorizontal: 8,
    },

    // Google Button
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        marginBottom: 24,
    },
    googleLogoContainer: {
        width: 24,
        height: 24,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleLogoG: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4285F4',
    },
    googleButtonText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },

    // Kakao Button
    kakaoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#FEE500',
        marginBottom: 12,
    },
    kakaoLogoContainer: {
        width: 24,
        height: 24,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kakaoButtonText: {
        fontSize: 15,
        color: '#000000',
        fontWeight: '600',
    },

    // Signup Section
    signupSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        fontSize: 14,
        color: '#6B7280',
    },
    signupLink: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
    },

    // Terms Footer
    termsSection: {
        marginTop: 32,
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
