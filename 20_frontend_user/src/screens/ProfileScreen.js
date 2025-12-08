import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Modal, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

export default function ProfileScreen() {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { saveTransactions, clearTransactions, setLoading } = useTransactions();
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [infoContent, setInfoContent] = useState({ title: '', content: '' });

    const handleExportData = async () => {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                userData: {
                    name: '홍길동',
                    email: 'demo@caffeine.com'
                },
                summary: '총 81건의 거래, 125만원 지출',
                note: '실제 앱에서는 CSV나 JSON 파일로 다운로드됩니다'
            };

            // 웹 환경에서는 Share API 대신 alert 사용
            const message = `데이터 내보내기\n\n내보내기 날짜: ${new Date().toLocaleDateString()}\n총 거래: 81건\n총 지출: 1,250,000원\n\n✅ 데이터가 준비되었습니다!`;
            alert(message);
        } catch (error) {
            alert('데이터 내보내기 실패');
        }
    };

    // ... (중략)

    const handleSyncData = async () => {
        try {
            // 1. CSV 파일 선택
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
                copyToCacheDirectory: true
            });

            if (result.canceled) {
                return;
            }

            const file = result.assets ? result.assets[0] : result;

            // 2. FormData 생성
            const formData = new FormData();
            if (file.file) {
                // 웹 환경
                formData.append('file', file.file);
            } else {
                // 앱 환경
                formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'text/csv'
                });
            }

            // 로딩 시작
            setLoading(true);
            alert('파일을 분석하고 거래 내역을 가져오는 중...');

            // 3. 백엔드로 전송
            const response = await axios.post(
                'http://localhost:8000/ml/upload',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 60000  // 60초 타임아웃
                }
            );

            const { transactions, summary } = response.data;

            // 4. Context에 저장 (AsyncStorage 포함)
            const saveResult = await saveTransactions(transactions);

            if (saveResult.success) {
                const categorySummary = Object.entries(summary.by_category)
                    .map(([cat, cnt]) => `${cat}: ${cnt}건`)
                    .join('\n');

                alert(
                    `✅ 동기화 완료!\n\n` +
                    `총 거래: ${transactions.length}건\n\n` +
                    `카테고리별 요약:\n${categorySummary}\n\n` +
                    `거래 내역 탭에서 확인하세요!`
                );

                // 5. 다음 소비 예측 자동 실행
                try {
                    alert('🔮 다음 소비를 예측하는 중...');

                    const predictResponse = await axios.post(
                        'http://localhost:8000/ml/predict-next',
                        formData,
                        {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            timeout: 30000
                        }
                    );

                    const { predicted_category, confidence, probabilities, context } = predictResponse.data;

                    // 확률 정렬 (높은 순)
                    const sortedProbs = Object.entries(probabilities)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)  // 상위 3개만
                        .map(([cat, prob]) => `${cat}: ${(prob * 100).toFixed(1)}%`)
                        .join('\n');

                    // 결과 표시
                    alert(`🔮 다음 소비 예측 결과\n\n` +
                        `예측 카테고리: ${predicted_category}\n` +
                        `신뢰도: ${(confidence * 100).toFixed(1)}%\n\n` +
                        `📊 상위 3개 카테고리 확률:\n${sortedProbs}\n\n` +
                        `📈 분석 정보:\n` +
                        `• 총 거래: ${context.total_transactions}건\n` +
                        `• 마지막 거래: ${context.last_category}\n` +
                        `• 평균 금액: ${Math.round(context.user_avg_amount).toLocaleString()}원\n` +
                        `• 주요 카테고리: ${context.most_frequent_category}`);

                } catch (predictError) {
                    console.error('예측 실패:', predictError);
                    // 예측 실패해도 동기화는 성공이므로 에러 표시만
                    alert('⚠️ 다음 소비 예측은 실패했지만 데이터 동기화는 성공했습니다.');
                }
            } else {
                throw new Error('저장 실패');
            }

        } catch (error) {
            console.error('동기화 실패:', error);
            alert('동기화 실패: ' + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = async () => {
        if (!confirm('⚠️ 모든 거래 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            setLoading(true);

            // TransactionContext의 clearTransactions 호출
            const result = await clearTransactions();

            if (result.success) {
                alert('✅ 모든 거래 데이터가 삭제되었습니다!\n\n다시 CSV를 업로드하려면 "데이터 동기화" 버튼을 사용하세요.');
            } else {
                throw new Error('삭제 실패');
            }
        } catch (error) {
            console.error('데이터 삭제 실패:', error);
            alert('❌ 데이터 삭제 실패: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAppInfo = () => {
        setInfoContent({
            title: 'ℹ앱 정보',
            content: `Caffeine - 금융 관리 앱

버전: 1.0.0
개발자: Caffeine Team
출시일: 2024.11

주요 기능:
• 스마트 소비 분석
• AI 기반 이상 거래 탐지
• 실시간 거래 내역 관리
• 카테고리별 소비 분석
• 다크모드 지원`
        });
        setInfoModalVisible(true);
    };

    const handleTermsOfService = () => {
        setInfoContent({
            title: '이용약관',
            content: `Caffeine 서비스 이용약관

제1조 (목적)
본 약관은 Caffeine(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 제공)
회사는 다음과 같은 서비스를 제공합니다:
1. 소비 패턴 분석
2. 거래 내역 관리
3. 이상 거래 탐지
4. 데이터 시각화

제3조 (개인정보 보호)
회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.`
        });
        setInfoModalVisible(true);
    };

    const handlePrivacyPolicy = () => {
        setInfoContent({
            title: '개인정보 처리방침',
            content: `Caffeine 개인정보 처리방침

1. 수집하는 개인정보
• 이름, 이메일 주소
• 거래 내역 정보
• 서비스 이용 기록

2. 개인정보의 이용 목적
• 서비스 제공 및 개선
• 소비 패턴 분석
• 이상 거래 탐지
• 고객 지원

3. 개인정보의 보관 기간
• 회원 탈퇴 시까지
• 법령에 따른 보관 의무 기간

4. 개인정보의 안전성 확보
• 암호화 저장
• 접근 권한 관리
• 정기적인 보안 점검`
        });
        setInfoModalVisible(true);
    };

    const handleLogout = async () => {
        if (confirm('정말 로그아웃 하시겠습니까?')) {
            await logout();
            alert('로그아웃되었습니다.\n\n다음에 또 만나요!');
        }
    };

    const MenuItem = ({ icon, title, onPress }) => (
        <TouchableOpacity style={styles(colors).menuItem} onPress={onPress}>
            <Text style={styles(colors).menuIcon}>{icon}</Text>
            <Text style={styles(colors).menuTitle}>{title}</Text>
            <Text style={styles(colors).menuArrow}>›</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles(colors).container}>
            <View style={styles(colors).header}>
                <View style={styles(colors).avatar}>
                    <Text style={styles(colors).avatarText}>{user?.name?.charAt(0) || '홍'}</Text>
                </View>
                <Text style={styles(colors).name}>{user?.name || '홍길동'}</Text>
                <Text style={styles(colors).email}>{user?.email || 'demo@caffeine.com'}</Text>
            </View>

            <View style={styles(colors).section}>
                <Text style={styles(colors).sectionTitle}>설정</Text>

                <View style={styles(colors).menuItem}>
                    <Text style={styles(colors).menuIcon}></Text>
                    <Text style={styles(colors).menuTitle}>다크 모드</Text>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#ccc', true: colors.primary }}
                        thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                    />
                </View>

                <MenuItem icon="" title="데이터 내보내기" onPress={handleExportData} />
                <MenuItem icon="🔄" title="데이터 동기화 (예측 포함)" onPress={handleSyncData} />
                <MenuItem icon="🗑️" title="거래 데이터 초기화" onPress={handleClearCache} />
            </View>

            <View style={styles(colors).section}>
                <Text style={styles(colors).sectionTitle}>📱 정보</Text>
                <MenuItem icon="ℹ" title="앱 정보" onPress={handleAppInfo} />
                <MenuItem icon="" title="이용약관" onPress={handleTermsOfService} />
                <MenuItem icon="" title="개인정보 처리방침" onPress={handlePrivacyPolicy} />
            </View>

            <TouchableOpacity style={styles(colors).logoutButton} onPress={handleLogout}>
                <Text style={styles(colors).logoutText}>로그아웃</Text>
            </TouchableOpacity>

            {/* Info Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={infoModalVisible}
                onRequestClose={() => setInfoModalVisible(false)}>
                <View style={styles(colors).modalOverlay}>
                    <View style={styles(colors).modalContent}>
                        <Text style={styles(colors).modalTitle}>{infoContent.title}</Text>
                        <ScrollView style={styles(colors).modalScroll}>
                            <Text style={styles(colors).modalText}>{infoContent.content}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles(colors).modalButton} onPress={() => setInfoModalVisible(false)}>
                            <Text style={styles(colors).modalButtonText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 40, alignItems: 'center', backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.border },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    name: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    email: { fontSize: 14, color: colors.textSecondary },
    section: { marginTop: 20, padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    menuIcon: { fontSize: 24, marginRight: 12 },
    menuTitle: { flex: 1, fontSize: 16, color: colors.text },
    menuArrow: { fontSize: 24, color: colors.textSecondary },
    logoutButton: { margin: 20, padding: 16, backgroundColor: colors.error, borderRadius: 12, alignItems: 'center' },
    logoutText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '80%', borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16, textAlign: 'center' },
    modalScroll: { maxHeight: 400 },
    modalText: { fontSize: 14, color: colors.text, lineHeight: 22 },
    modalButton: { marginTop: 20, padding: 14, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center' },
    modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
