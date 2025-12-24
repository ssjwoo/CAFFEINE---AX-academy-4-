import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Platform, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getUserProfile, updateUserProfile } from '../api';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';

// 설정 화면
export default function SettingsScreen({ navigation }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    
    // 설정 상태
    const [pushNotification, setPushNotification] = useState(false);
    const [budgetLimit, setBudgetLimit] = useState(''); // 예산 금액 (아직 로드용)
    const [anomalyAlert, setAnomalyAlert] = useState(true);
    
    // 정보 모달 상태
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [infoContent, setInfoContent] = useState({ title: '', content: '' });

    // 초기 데이터 로드
    useEffect(() => {
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        try {
            const user = await getUserProfile();
            if (user) {
                if (user.push_token) setPushNotification(true);
            }
        } catch (error) {
            console.error('사용자 설정 로드 실패:', error);
        }
    };

    // 푸시 알림 토글 버튼
    const handlePushToggle = async (value) => {
        if (Platform.OS === 'web') {
            Alert.alert('알림', '웹 브라우저에서는 푸시 알림을 지원하지 않습니다.');
            return;
        }

        setPushNotification(value);
        if (value) {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                await updateUserProfile({ push_token: token });
                Alert.alert('알림 설정', '푸시 알림이 켜졌습니다.');
            } else {
                setPushNotification(false); // 권한 거부 등으로 실패 시 다시 끔
            }
        } else {
            // 끄는 경우 토큰 삭제 (또는 빈 문자열 전송)
            await updateUserProfile({ push_token: null });
        }
    };
    
    // 예산 저장 버튼
    const handleSaveBudget = async () => {
        const limit = parseInt(budgetLimit.replace(/,/g, ''), 10);
        if (isNaN(limit) || limit <= 0) {
            if (Platform.OS === 'web') {
                alert('올바른 금액을 입력해주세요.');
            } else {
                Alert.alert('알림', '올바른 금액을 입력해주세요.');
            }
            return;
        }

        try {
            await updateUserProfile({ budget_limit: limit });
            if (Platform.OS === 'web') {
                alert(`저장 완료! 월 예산이 ${limit.toLocaleString()}원으로 설정되었습니다.`);
            } else {
                Alert.alert('저장 완료', `월 예산이 ${limit.toLocaleString()}원으로 설정되었습니다.`);
            }
        } catch (error) {
            if (Platform.OS === 'web') {
                alert('예산 저장 중 오류가 발생했습니다.');
            } else {
                Alert.alert('오류', '예산 저장 중 오류가 발생했습니다.');
            }
        }
    };

    // 설정 초기화 버튼
    const handleResetSettings = async () => {
        const doReset = async () => {
            try {
                // UI 상태 초기화
                setPushNotification(false);
                setBudgetLimit('');
                setAnomalyAlert(false);
                
                // 백엔드에 저장
                await updateUserProfile({ 
                    push_token: null,
                    budget_limit: 0,
                    budget_alert_enabled: false
                });
                
                if (Platform.OS === 'web') {
                    alert('설정이 초기화되었습니다.');
                } else {
                    Alert.alert('완료', '설정이 초기화되었습니다.');
                }
            } catch (error) {
                if (Platform.OS === 'web') {
                    alert('초기화 중 오류가 발생했습니다.');
                } else {
                    Alert.alert('오류', '초기화 중 오류가 발생했습니다.');
                }
            }
        };

        if (Platform.OS === 'web') {
            if (confirm('모든 설정을 초기화하시겠습니까?')) {
                await doReset();
            }
        } else {
            Alert.alert(
                '설정 초기화',
                '모든 설정을 초기화하시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    { text: '초기화', style: 'destructive', onPress: doReset }
                ]
            );
        }
    };

    // 설정 아이템 컴포넌트
    const SettingItem = ({ icon, title, subtitle, value, onValueChange, type = 'switch', children }) => (
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.settingIcon, { backgroundColor: '#DBEAFE' }]}>
                <Feather name={icon} size={22} color="#3B82F6" />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                )}
                {children}
            </View>
            {type === 'switch' && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                    thumbColor={'#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                />
            )}
        </View>
    );

    const Divider = () => <View style={[styles.divider, { backgroundColor: colors.border }]} />;
    
    // 설정 화면 UI
    return (
        <LinearGradient colors={colors.screenGradient} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 테마 섹션 */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>외관</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <SettingItem
                            icon="moon"
                            title="다크 모드"
                            subtitle="어두운 테마 사용"
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                        />
                    </View>
                </View>

                {/* 알림 섹션 */}
                <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>알림</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <SettingItem
                            icon="bell"
                            title="푸시 알림"
                            subtitle="앱 알림 받기"
                            value={pushNotification}
                            onValueChange={handlePushToggle}
                        />
                        <Divider />
                        <SettingItem
                            icon="shield"
                            title="이상 거래 알림"
                            subtitle="AI 감지 이상 거래 알림"
                            value={anomalyAlert}
                            onValueChange={setAnomalyAlert}
                        />
                    </View>
                </View>

                {/* 정보 섹션 */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>정보</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <TouchableOpacity 
                            style={styles.infoItem}
                            onPress={() => {
                                setInfoContent({
                                    title: 'ℹ️ 앱 정보',
                                    content: 'Caffeine - 금융 관리 앱\n\n버전: 1.0.0\n\n개발자: Caffeine Team\n\n연락처: caffeine.app@gmail.com'
                                });
                                setInfoModalVisible(true);
                            }}
                        >
                            <View style={styles.infoItemLeft}>
                                <Text style={styles.infoIcon}>ℹ️</Text>
                                <Text style={[styles.infoTitle, { color: colors.text }]}>앱 정보</Text>
                            </View>
                            <Feather name="chevron-right" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Divider />
                        <TouchableOpacity 
                            style={styles.infoItem}
                            onPress={() => {
                                setInfoContent({ 
                                    title: '📋 이용약관', 
                                    content: `제1조 (목적)
본 약관은 Caffeine 서비스(이하 "서비스")의 이용조건 및 절차, 권리·의무 및 책임사항 등을 규정함을 목적으로 합니다.

제2조 (서비스의 제공)
1. 회사는 다음과 같은 서비스를 제공합니다.
   - 소비 내역 분석 서비스
   - AI 기반 지출 예측 및 쿠폰 추천
   - 예산 관리 및 알림 서비스

제3조 (이용자의 의무)
1. 이용자는 서비스 이용 시 관련 법령을 준수해야 합니다.
2. 타인의 정보를 도용하거나 허위정보를 입력해서는 안 됩니다.

제4조 (면책조항)
1. 회사는 천재지변 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
2. 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.

[시행일자: 2024년 12월 1일]` 
                                });
                                setInfoModalVisible(true);
                            }}
                        >
                            <View style={styles.infoItemLeft}>
                                <Text style={styles.infoIcon}>📋</Text>
                                <Text style={[styles.infoTitle, { color: colors.text }]}>이용약관</Text>
                            </View>
                            <Feather name="chevron-right" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Divider />
                        <TouchableOpacity 
                            style={styles.infoItem}
                            onPress={() => {
                                setInfoContent({
                                    title: '🔒 개인정보 처리방침',
                                    content: `1. 수집하는 개인정보 항목
- 이메일, 이름, 생년월일
- 소비 내역 데이터

2. 개인정보의 이용목적
- 서비스 제공 및 맞춤 분석
- 회원 관리 및 본인확인

3. 개인정보의 보유기간
- 회원 탈퇴 시까지

4. 개인정보의 파기
- 목적 달성 시 지체없이 파기

5. 정보주체의 권리
- 열람, 정정, 삭제 요구권

[시행일자: 2024년 12월 1일]`
                                });
                                setInfoModalVisible(true);
                            }}
                        >
                            <View style={styles.infoItemLeft}>
                                <Text style={styles.infoIcon}>🔒</Text>
                                <Text style={[styles.infoTitle, { color: colors.text }]}>개인정보 처리방침</Text>
                            </View>
                            <Feather name="chevron-right" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 초기화 버튼 */}
                <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
                    <Text style={styles.resetButtonText}>설정 초기화</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* 정보 모달 */}
            <Modal transparent={true} visible={infoModalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{infoContent.title}</Text>
                        <ScrollView style={styles.modalScroll}>
                            <Text style={[styles.modalText, { color: colors.textSecondary }]}>{infoContent.content}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setInfoModalVisible(false)}>
                            <Text style={styles.modalCloseButtonText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    settingSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginLeft: 70,
    },
    resetButton: {
        marginHorizontal: 20,
        marginTop: 32,
        padding: 16,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#DC2626',
    },
    budgetInputContainer: {
        padding: 16,
        paddingLeft: 70, // 아이콘 너비 + 마진 고려
        backgroundColor: '#F9FAFB', // 약간 어둡게
    },
    budgetInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    budgetLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    budgetInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        marginRight: 8,
        backgroundColor: '#FFFFFF',
    },
    currencyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        marginTop: 8,
    },
    budgetSaveButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 8,
    },
    budgetSaveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 18,
    },
    infoItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 14,
    },
    infoTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalScroll: {
        maxHeight: 400,
    },
    modalText: {
        fontSize: 15,
        lineHeight: 24,
    },
    modalCloseButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    modalCloseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
