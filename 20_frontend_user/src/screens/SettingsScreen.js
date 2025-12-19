import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Platform, TextInput } from 'react-native';
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
    const [budgetAlert, setBudgetAlert] = useState(false);
    const [budgetLimit, setBudgetLimit] = useState(''); // 예산 금액
    const [anomalyAlert, setAnomalyAlert] = useState(true);
    
    const [isLoading, setIsLoading] = useState(false);
    const [originalBudget, setOriginalBudget] = useState(''); // 변경 확인용

    // 초기 데이터 로드
    useEffect(() => {
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        try {
            const user = await getUserProfile();
            if (user) {
                if (user.push_token) setPushNotification(true);
                if (user.budget_limit) {
                    setBudgetLimit(String(user.budget_limit));
                    setOriginalBudget(String(user.budget_limit));
                }
                // budget_alert_enabled 상태 반영
                setBudgetAlert(user.budget_alert_enabled ?? true);
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
            setOriginalBudget(String(limit));
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
                setBudgetAlert(false);
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
            <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                <Feather name={icon} size={20} color={colors.primary || '#6366F1'} />
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
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>알림 & 예산</Text>
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
                            icon="alert-circle"
                            title="예산 초과 알림"
                            subtitle="예산 80% 도달 시 알림"
                            value={budgetAlert}
                            onValueChange={async (val) => {
                                setBudgetAlert(val);
                                try {
                                    await updateUserProfile({ budget_alert_enabled: val });
                                } catch (error) {
                                    console.error('예산 알림 설정 저장 실패:', error);
                                }
                            }}
                        />
                        
                        {/* 예산 입력 필드 (예산 알림이 켜져있을 때 표시) */}
                        {budgetAlert && (
                            <View style={styles.budgetInputContainer}>
                                <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>월 목표 예산</Text>
                                <View style={styles.budgetInputRow}>
                                    <TextInput 
                                        style={[styles.budgetInput, { color: colors.text, borderColor: colors.border }]}
                                        keyboardType="numeric"
                                        placeholder="금액 입력"
                                        placeholderTextColor={colors.textSecondary}
                                        value={budgetLimit}
                                        onChangeText={setBudgetLimit}
                                    />
                                    <Text style={[styles.currencyText, { color: colors.text }]}>원</Text>
                                    <TouchableOpacity 
                                        style={styles.budgetSaveButton}
                                        onPress={handleSaveBudget}
                                    >
                                        <Text style={styles.budgetSaveButtonText}>저장</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        
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



                {/* 초기화 버튼 */}
                <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
                    <Text style={styles.resetButtonText}>설정 초기화</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    }
});
