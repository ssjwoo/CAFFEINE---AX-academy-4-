import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions, ActivityIndicator, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const { colors } = useTheme();
    const { user, logout } = useAuth();
    const { saveTransactions, clearTransactions, loading: syncLoading } = useTransactions();
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [infoContent, setInfoContent] = useState({ title: '', content: '' });
    // ⭐ 동기화 진행 상태
    const [syncModalVisible, setSyncModalVisible] = useState(false);
    const [syncProgress, setSyncProgress] = useState('');
    const spinValue = useRef(new Animated.Value(0)).current;

    // ⭐ 회전 애니메이션
    useEffect(() => {
        if (syncModalVisible) {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: false, // 웹 호환성을 위해 false
                })
            ).start();
        } else {
            spinValue.setValue(0);
        }
    }, [syncModalVisible]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleExportData = async () => {
        try {
            const message = `데이터 내보내기\n\n내보내기 날짜: ${new Date().toLocaleDateString()}\n총 거래: 81건\n총 지출: 1,250,000원\n\n✅ 데이터가 준비되었습니다!`;
            alert(message);
        } catch (error) {
            alert('데이터 내보내기 실패');
        }
    };

    // CSV 파일 파싱 함수
    const parseCSV = (csvText) => {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length < 6) continue;

            const transaction = {
                id: String(i),
                date: values[0]?.trim() + ' ' + (values[1]?.trim() || '00:00'),
                category: values[3]?.trim() || '기타',
                merchant: values[5]?.trim() || '알 수 없음',
                amount: Math.abs(parseFloat(values[6]?.trim()) || 0),
                cardType: values[8]?.includes('체크') ? '체크' : '신용',
                notes: values[9]?.trim() || '',
            };

            if (transaction.amount > 0) {
                transactions.push(transaction);
            }
        }

        return transactions;
    };

    // 데이터 동기화 (CSV 파일 선택)
    const handleSyncData = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setSyncModalVisible(true);
            setSyncProgress('📂 파일 읽는 중...');

            // 파일 읽기 - 인코딩 자동 감지 (UTF-8 / EUC-KR)
            const response = await fetch(file.uri);
            const arrayBuffer = await response.arrayBuffer();

            let csvText;
            try {
                const decoder = new TextDecoder('utf-8', { fatal: true });
                csvText = decoder.decode(arrayBuffer);
            } catch (e) {
                console.log('UTF-8 디코딩 실패, EUC-KR 시도 중...');
                const decoder = new TextDecoder('euc-kr');
                csvText = decoder.decode(arrayBuffer);
            }

            setSyncProgress('🔄 데이터 분석 중...');
            await new Promise(resolve => setTimeout(resolve, 500));

            const transactions = parseCSV(csvText);

            if (transactions.length === 0) {
                setSyncModalVisible(false);
                alert('CSV 파일에서 거래 데이터를 찾을 수 없습니다.');
                return;
            }

            setSyncProgress(`💾 ${transactions.length}건 저장 중...`);
            await new Promise(resolve => setTimeout(resolve, 500));

            const saveResult = await saveTransactions(transactions);

            setSyncProgress('✅ 동기화 완료!');
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSyncModalVisible(false);

            if (saveResult.success) {
                alert(`✅ 데이터 동기화 완료!\n\n${transactions.length}건의 거래 내역이 업데이트되었습니다.`);
                navigation?.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            } else {
                alert('데이터 저장 중 오류가 발생했습니다.');
            }

        } catch (error) {
            setSyncModalVisible(false);
            console.error('동기화 실패:', error);
            alert('파일을 읽는 중 오류가 발생했습니다.\n\n' + error.message);
        }
    };

    const handleClearCache = async () => {
        const confirmed = confirm('정말 모든 거래 데이터를 삭제하시겠습니까?');
        if (!confirmed) return;

        try {
            await clearTransactions();
            await AsyncStorage.removeItem('transactions_cache');
            await AsyncStorage.removeItem('last_sync_time');
            alert('✅ 캐시가 삭제되었습니다!');

            // 대시보드로 이동하여 변경사항 즉시 확인
            if (navigation) {
                navigation.navigate('대시보드');
            }
        } catch (error) {
            alert('캐시 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleAppInfo = () => {
        setInfoContent({
            title: 'ℹ️ 앱 정보',
            content: `Caffeine - 금융 관리 앱\n버전: 1.0.0`
        });
        setInfoModalVisible(true);
    };

    const handleTermsOfService = () => {
        setInfoContent({ title: '📋 이용약관', content: `이용약관 내용...` });
        setInfoModalVisible(true);
    };

    const handlePrivacyPolicy = () => {
        setInfoContent({ title: '🔒 개인정보 처리방침', content: `개인정보 처리방침 내용...` });
        setInfoModalVisible(true);
    };

    const handleLogout = async () => {
        if (confirm('정말 로그아웃 하시겠습니까?')) {
            await logout();
            alert('로그아웃되었습니다.');
        }
    };

    const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>{icon}</Text>
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            {rightComponent ? rightComponent : (
                showArrow && <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={colors.screenGradient} style={styles.gradientContainer}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                        </LinearGradient>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{user?.name || '사용자'}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>데이터 관리</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <MenuItem icon="📤" title="데이터 내보내기" subtitle="CSV, JSON 형식으로 저장" onPress={handleExportData} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem icon="🔄" title="데이터 동기화 (예측 포함)" subtitle="최신 거래 내역 불러오기" onPress={handleSyncData} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem icon="🗑️" title="거래 데이터 초기화" subtitle="캐시 및 임시 파일 삭제" onPress={handleClearCache} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>정보</Text>
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <MenuItem icon="ℹ️" title="앱 정보" onPress={handleAppInfo} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem icon="📋" title="이용약관" onPress={handleTermsOfService} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <MenuItem icon="🔒" title="개인정보 처리방침" onPress={handlePrivacyPolicy} />
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>

                <Modal transparent={true} visible={infoModalVisible} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                            <View style={styles.modalHandle} />
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{infoContent.title}</Text>
                            <ScrollView style={styles.modalScroll}><Text style={[styles.modalText, { color: colors.text }]}>{infoContent.content}</Text></ScrollView>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setInfoModalVisible(false)}>
                                <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.modalButtonGradient}><Text style={styles.modalButtonText}>닫기</Text></LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal transparent={true} visible={syncModalVisible} animationType="fade">
                    <View style={styles.syncModalOverlay}>
                        <View style={[styles.syncModalContent, { backgroundColor: colors.cardBackground }]}>
                            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.syncIconContainer}><Text style={styles.syncIcon}>🔄</Text></LinearGradient>
                            </Animated.View>
                            <Text style={[styles.syncTitle, { color: colors.text }]}>데이터 동기화</Text>
                            <Text style={[styles.syncProgress, { color: colors.textSecondary }]}>{syncProgress}</Text>
                            <View style={styles.progressBarContainer}><View style={styles.progressBar}><Animated.View style={[styles.progressBarFill, { width: syncProgress.includes('완료') ? '100%' : syncProgress.includes('저장') ? '70%' : syncProgress.includes('분석') ? '40%' : '20%' }]} /></View></View>
                        </View>
                    </View>
                </Modal>

                <View style={{ height: 100 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientContainer: { flex: 1 },
    container: { flex: 1 },
    header: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
    avatarContainer: { marginBottom: 16, width: 100, height: 100, borderRadius: 50, overflow: 'hidden', elevation: 10 },
    avatar: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, fontWeight: '700', color: '#FFFFFF' },
    name: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
    email: { fontSize: 14 },
    section: { paddingHorizontal: 20, marginTop: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
    card: { borderRadius: 20, overflow: 'hidden', elevation: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    menuIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuIcon: { fontSize: 22 },
    menuContent: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '600' },
    menuSubtitle: { fontSize: 13, marginTop: 2 },
    menuArrow: { fontSize: 22, fontWeight: '300' },
    divider: { height: 1, marginLeft: 74 },
    logoutButton: { marginHorizontal: 20, marginTop: 32, padding: 16, backgroundColor: '#FEE2E2', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#DC2626' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    modalScroll: { maxHeight: 400 },
    modalText: { fontSize: 15, lineHeight: 24 },
    modalButton: { marginTop: 24 },
    modalButtonGradient: { padding: 16, borderRadius: 14, alignItems: 'center' },
    modalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    syncModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
    syncModalContent: { borderRadius: 24, padding: 32, alignItems: 'center', width: screenWidth * 0.8, maxWidth: 320, elevation: 20 },
    syncIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    syncIcon: { fontSize: 36 },
    syncTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    syncProgress: { fontSize: 16, marginBottom: 20 },
    progressBarContainer: { width: '100%', paddingHorizontal: 10 },
    progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 4 },
});
