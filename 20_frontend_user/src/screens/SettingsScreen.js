import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen({ navigation }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    
    // 설정 상태들
    const [pushNotification, setPushNotification] = useState(true);
    const [budgetAlert, setBudgetAlert] = useState(true);
    const [anomalyAlert, setAnomalyAlert] = useState(true);
    const [biometricAuth, setBiometricAuth] = useState(false);
    const [autoSync, setAutoSync] = useState(true);

    const handleResetSettings = () => {
        if (confirm('모든 설정을 초기화하시겠습니까?')) {
            setPushNotification(true);
            setBudgetAlert(true);
            setAnomalyAlert(true);
            setBiometricAuth(false);
            setAutoSync(true);
            alert('설정이 초기화되었습니다.');
        }
    };

    const SettingItem = ({ icon, title, subtitle, value, onValueChange, type = 'switch' }) => (
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                <Feather name={icon} size={20} color={colors.primary || '#6366F1'} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                )}
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
                            onValueChange={setPushNotification}
                        />
                        <Divider />
                        <SettingItem
                            icon="alert-circle"
                            title="예산 초과 알림"
                            subtitle="예산 80% 도달 시 알림"
                            value={budgetAlert}
                            onValueChange={setBudgetAlert}
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

                {/* 보안 섹션 */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>보안</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <SettingItem
                            icon="lock"
                            title="생체 인증"
                            subtitle="지문/Face ID로 앱 잠금"
                            value={biometricAuth}
                            onValueChange={setBiometricAuth}
                        />
                    </View>
                </View>

                {/* 데이터 섹션 */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>데이터</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <SettingItem
                            icon="refresh-cw"
                            title="자동 동기화"
                            subtitle="앱 실행 시 자동 동기화"
                            value={autoSync}
                            onValueChange={setAutoSync}
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
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#F3F4F6',
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
        color: '#1F2937',
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
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
});
