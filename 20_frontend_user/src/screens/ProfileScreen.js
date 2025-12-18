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
    // 동기화 진행 상태
    const [syncModalVisible, setSyncModalVisible] = useState(false);
    const [syncProgress, setSyncProgress] = useState('');
    const spinValue = useRef(new Animated.Value(0)).current;
    
    // 회전 애니메이션
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

            // CSV 컬럼 매핑: 날짜,시간,타입,대분류,소분류,내용,금액,화폐,결제수단,메모
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

    // 데이터 동기화 (CSV 파일 선택) - 애니메이션 추가
    const handleSyncData = async () => {
        try {
            // 파일 선택 다이얼로그 열기
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            const file = result.assets[0];
            console.log('선택된 파일:', file.name);
            
            // 동기화 모달 표시
            setSyncModalVisible(true);
            setSyncProgress('📂 파일 읽는 중...');

            // 파일 읽기
            const response = await fetch(file.uri);
            const csvText = await response.text();
            
            // 진행 상태 업데이트
            setSyncProgress('🔄 데이터 분석 중...');
            await new Promise(resolve => setTimeout(resolve, 500)); // 시각적 효과

            // CSV 파싱
            const transactions = parseCSV(csvText);

            if (transactions.length === 0) {
                setSyncModalVisible(false);
                alert('CSV 파일에서 거래 데이터를 찾을 수 없습니다.\n\n올바른 형식의 CSV 파일인지 확인해주세요.');
                return;
            }
            
            // 진행 상태 업데이트
            setSyncProgress(`💾 ${transactions.length}건 저장 중...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // 시각적 효과

            // TransactionContext에 저장
            const saveResult = await saveTransactions(transactions);
            
            // 완료 상태
            setSyncProgress('✅ 동기화 완료!');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 완료 표시
            
            setSyncModalVisible(false);

            if (saveResult.success) {
                alert(`✅ 데이터 동기화 완료!\n\n${transactions.length}건의 거래 내역이 업데이트되었습니다.`);
                // 대시보드로 바로 이동 (스택 초기화)
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
        // 확인 다이얼로그
        const confirmed = confirm('정말 모든 거래 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.');
        
        if (!confirmed) return;

        try {
            // TransactionContext의 clearTransactions 호출
            await clearTransactions();
            
            // AsyncStorage에서도 삭제 (이중 보장)
            await AsyncStorage.removeItem('transactions_cache');
            await AsyncStorage.removeItem('last_sync_time');
            
            alert('✅ 캐시가 삭제되었습니다!\n\n모든 거래 데이터가 초기화되었습니다.\n다시 동기화해주세요.');
            
            // 페이지 새로고침 효과
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } catch (error) {
            console.error('캐시 삭제 실패:', error);
            alert('캐시 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleAppInfo = () => {
        setInfoContent({
            title: 'ℹ️ 앱 정보',
            content: `Caffeine - 금융 관리 앱\n\n버전: 1.0.0\n개발자: Caffeine Team\n출시일: 2024.11\n\n주요 기능:\n• 스마트 소비 분석\n• AI 기반 이상 거래 탐지\n• 실시간 거래 내역 관리\n• 카테고리별 소비 분석\n• 다크모드 지원`
        });
        setInfoModalVisible(true);
    };

    const handleTermsOfService = () => {
        setInfoContent({
            title: '📋 이용약관',
            content: `Caffeine 서비스 이용약관\n\n제1조 (목적)\n본 약관은 Caffeine(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조 (서비스의 제공)\n회사는 다음과 같은 서비스를 제공합니다:\n1. 소비 패턴 분석\n2. 거래 내역 관리\n3. 이상 거래 탐지\n4. 데이터 시각화\n\n제3조 (개인정보 보호)\n회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.`
        });
        setInfoModalVisible(true);
    };

    const handlePrivacyPolicy = () => {
        setInfoContent({
            title: '🔒 개인정보 처리방침',
            content: `Caffeine 개인정보 처리방침\n\n1. 수집하는 개인정보\n• 이름, 이메일 주소\n• 거래 내역 정보\n• 서비스 이용 기록\n\n2. 개인정보의 이용 목적\n• 서비스 제공 및 개선\n• 소비 패턴 분석\n• 이상 거래 탐지\n• 고객 지원\n\n3. 개인정보의 보관 기간\n• 회원 탈퇴 시까지\n• 법령에 따른 보관 의무 기간\n\n4. 개인정보의 안전성 확보\n• 암호화 저장\n• 접근 권한 관리\n• 정기적인 보안 점검`
        });
        setInfoModalVisible(true);
    };

    const handleLogout = async () => {
        if (confirm('정말 로그아웃 하시겠습니까?')) {
            await logout();
            alert('로그아웃되었습니다.\n\n다음에 또 만나요!');
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
        <LinearGradient
            colors={colors.screenGradient}
            style={styles.gradientContainer}
        >
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#2563EB', '#1D4ED8']}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || '홍'}</Text>
                        </LinearGradient>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{user?.name || '홍길동'}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'demo@caffeine.com'}</Text>
                </View>

                {/* Settings Section */}
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

                {/* Info Section */}
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

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>

                {/* Info Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={infoModalVisible}
                    onRequestClose={() => setInfoModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                            <View style={styles.modalHandle} />
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{infoContent.title}</Text>
                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                <Text style={[styles.modalText, { color: colors.text }]}>{infoContent.content}</Text>
                            </ScrollView>
                            <TouchableOpacity 
                                style={styles.modalButton} 
                                onPress={() => setInfoModalVisible(false)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#2563EB', '#1D4ED8']}
                                    style={styles.modalButtonGradient}
                                >
                                    <Text style={styles.modalButtonText}>닫기</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* 동기화 진행 모달 */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={syncModalVisible}
                    onRequestClose={() => {}}
                >
                    <View style={styles.syncModalOverlay}>
                        <View style={[styles.syncModalContent, { backgroundColor: colors.cardBackground }]}>
                            {/* 회전 애니메이션 아이콘 */}
                            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                <LinearGradient
                                    colors={['#2563EB', '#1D4ED8']}
                                    style={styles.syncIconContainer}
                                >
                                    <Text style={styles.syncIcon}>🔄</Text>
                                </LinearGradient>
                            </Animated.View>
                            <Text style={[styles.syncTitle, { color: colors.text }]}>데이터 동기화</Text>
                            <Text style={[styles.syncProgress, { color: colors.textSecondary }]}>{syncProgress}</Text>
                            
                            {/* 진행 바 애니메이션 */}
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBar}>
                                    <Animated.View 
                                        style={[
                                            styles.progressBarFill,
                                            { 
                                                width: syncProgress.includes('완료') ? '100%' : 
                                                       syncProgress.includes('저장') ? '70%' :
                                                       syncProgress.includes('분석') ? '40%' : '20%' 
                                            }
                                        ]} 
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                <View style={{ height: 100 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 24,
    },
    avatarContainer: {
        marginBottom: 16,
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    avatar: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    name: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        fontFamily: 'Inter_700Bold',
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'Inter_400Regular',
    },

    // Section
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },

    // Menu Item
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuIcon: {
        fontSize: 22,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'Inter_600SemiBold',
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
        fontFamily: 'Inter_400Regular',
    },
    menuArrow: {
        fontSize: 22,
        color: '#D1D5DB',
        fontWeight: '300',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 74,
    },

    // Logout Button
    logoutButton: {
        marginHorizontal: 20,
        marginTop: 32,
        padding: 16,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#DC2626',
        fontFamily: 'Inter_600SemiBold',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
        fontFamily: 'Inter_700Bold',
    },
    modalScroll: {
        maxHeight: 400,
    },
    modalText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
        fontFamily: 'Inter_400Regular',
    },
    modalButton: {
        marginTop: 24,
    },
    modalButtonGradient: {
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },

    // 동기화 모달 스타일
    syncModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    syncModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: screenWidth * 0.8,
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    syncIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    syncIcon: {
        fontSize: 36,
    },
    syncTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        fontFamily: 'Inter_700Bold',
    },
    syncProgress: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
        fontFamily: 'Inter_400Regular',
    },
    progressBarContainer: {
        width: '100%',
        paddingHorizontal: 10,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2563EB',
        borderRadius: 4,
    },
});
