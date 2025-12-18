import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/currency';
import { EMPTY_MESSAGES } from '../constants';

export default function TransactionScreen({ navigation }) {
    const { colors } = useTheme();
    const { transactions, updateTransactionNote } = useTransactions();
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [anomalyCategoryModalVisible, setAnomalyCategoryModalVisible] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedNote, setEditedNote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [couponNotification, setCouponNotification] = useState(null); // 쿠폰 발급 알림



    // 카테고리별 쿠폰 정보 매핑
    const CATEGORY_COUPONS = {
        '주유': { merchant: 'SK에너지', discount: 3000, description: '주유 할인 쿠폰' },
        '교통': { merchant: '카카오택시', discount: 2000, description: '택시비 할인 쿠폰' },
        '식비': { merchant: '배달의민족', discount: 3000, description: '배달 할인 쿠폰' },
        '외식': { merchant: '스타벅스', discount: 2000, description: '카페 할인 쿠폰' },
        '쇼핑': { merchant: '쿠팡', discount: 5000, description: '쇼핑 할인 쿠폰' },
        '편의점': { merchant: 'GS25', discount: 1000, description: '편의점 할인 쿠폰' },
        '여가': { merchant: 'CGV', discount: 3000, description: '영화 할인 쿠폰' },
        '문화': { merchant: '인터파크', discount: 5000, description: '공연 할인 쿠폰' },
        '의료': { merchant: '약국', discount: 2000, description: '약국 할인 쿠폰' },
        '기타': { merchant: '올리브영', discount: 2000, description: '뷰티 할인 쿠폰' },
    };

    const fetchPrediction = async () => {
        try {
            if (!transactions || transactions.length < 5) {
                alert('예측을 위해 최소 5건 이상의 거래 데이터가 필요합니다.');
                return;
            }

            // 거래 데이터를 CSV 형식으로 변환
            const csvHeader = '날짜,시간,타입,대분류,소분류,내용,금액,화폐,결제수단,메모\n';
            const csvRows = transactions.map(t => {
                const datetime = (t.date || '').split(' ');
                const date = datetime[0] || new Date().toISOString().split('T')[0];
                const time = datetime[1] || '12:00';
                return [
                    date,
                    time,
                    '지출',
                    t.category || t.originalCategory || '외식',
                    '기타',
                    t.merchant || t.businessName || '알수없음',
                    -Math.abs(t.amount),
                    'KRW',
                    t.cardType === '체크' ? '체크카드' : '신용카드',
                    t.notes || ''
                ].join(',');
            }).join('\n');

            const csvContent = csvHeader + csvRows;

            // FormData로 CSV 전송
            const formData = new FormData();
            const blob = new Blob([csvContent], { type: 'text/csv' });
            formData.append('file', blob, 'transactions.csv');

            console.log(`${transactions.length}건 거래 데이터로 예측 중...`);

            // predict-next API 호출 (전체 이력 기반)
            const response = await apiClient.post('/ml/predict-next', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const predictedCategory = response.data.predicted_category;
            const confidence = response.data.confidence;
            setPrediction(predictedCategory);

            console.log(`예측 결과: ${predictedCategory} (신뢰도: ${(confidence * 100).toFixed(1)}%)`);

            // 예측된 카테고리에 맞는 쿠폰 발급 알림
            const couponInfo = CATEGORY_COUPONS[predictedCategory] || CATEGORY_COUPONS['기타'];

            // 새 쿠폰 객체 생성
            const newCoupon = {
                id: Date.now(),
                merchant: couponInfo.merchant,
                discount: couponInfo.discount,
                category: predictedCategory,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'available',
                description: `AI 예측 기반 자동 발급 (신뢰도 ${(confidence * 100).toFixed(0)}%)`,
                minPurchase: couponInfo.discount * 3,
                daysLeft: 30
            };

            // 쿠폰 발급 배너 표시 (confirm 대신)
            setCouponNotification({
                category: predictedCategory,
                confidence: confidence,
                coupon: newCoupon,
                couponInfo: couponInfo,
                txCount: transactions.length
            });

        } catch (error) {
            console.error('Prediction failed:', error);
            alert('예측 실패: ' + (error.response?.data?.detail || error.message));
        }
    };

    const filteredTransactions = transactions.filter(t => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            t.merchant?.toLowerCase().includes(query) ||
            t.category?.toLowerCase().includes(query) ||
            t.notes?.toLowerCase().includes(query) ||
            t.businessName?.toLowerCase().includes(query)
        );
    });

    const handleTransactionClick = (item) => {
        setSelectedTransaction(item);
        setEditedNote(item.notes || '');
        setIsEditingNote(false);
        setModalVisible(true);
    };

    const handleMarkAsAnomaly = () => {
        setModalVisible(false);
        setTimeout(() => {
            setAnomalyCategoryModalVisible(true);
        }, 300);
    };

    // ============================================================
    // TODO: 백엔드 API 연결 - 이상거래 신고
    // ============================================================
    // 백엔드 연결 시 아래 함수를 수정하여 서버에 이상거래 정보를 전송하세요.
    //
    // 예시 코드:
    // const handleCategorySelect = async (category) => {
    //     if (!selectedTransaction) return;
    //
    //     try {
    //         const token = await AsyncStorage.getItem('authToken');
    //         
    //         // 이상거래 신고 API 호출
    //         const response = await fetch(`${API_BASE_URL}/transactions/${selectedTransaction.id}/anomaly`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`
    //             },
    //             body: JSON.stringify({
    //                 category: category,  // 'safe', 'suspicious', 'dangerous'
    //                 merchant: selectedTransaction.merchant,
    //                 amount: selectedTransaction.amount,
    //                 timestamp: new Date().toISOString()
    //             })
    //         });
    //
    //         if (!response.ok) throw new Error('신고 실패');
    //
    //         const result = await response.json();
    //         
    //         setAnomalyCategoryModalVisible(false);
    //         setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
    //
    //         const messages = {
    //             safe: '✅ 안전한 거래로 표시되었습니다.',
    //             suspicious: '🟡 의심 거래로 표시되었습니다.\n이상탐지 탭에서 확인할 수 있습니다.',
    //             dangerous: '🔴 위험 거래로 표시되었습니다.\n고객센터로 자동 신고되었습니다.'
    //         };
    //
    //         setTimeout(() => {
    //             alert(messages[category]);
    //             if (category === 'suspicious' || category === 'dangerous') {
    //                 navigation?.navigate('이상탐지');
    //             }
    //         }, 300);
    //
    //     } catch (error) {
    //         console.error('신고 실패:', error);
    //         alert('신고 처리 중 오류가 발생했습니다.');
    //     }
    // };
    // ============================================================
    const handleCategorySelect = (category) => {
        if (!selectedTransaction) return;

        // 현재는 로컬에서만 처리 (백엔드 연결 시 위의 예시 코드로 교체)
        setAnomalyCategoryModalVisible(false);
        setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));

        const messages = {
            safe: '✅ 안전한 거래로 표시되었습니다.',
            suspicious: '🟡 의심 거래로 표시되었습니다.\n이상탐지 탭에서 확인할 수 있습니다.',
            dangerous: '🔴 위험 거래로 표시되었습니다.\n고객센터로 자동 신고되었습니다.'
        };

        setTimeout(() => {
            alert(messages[category]);
            if (category === 'suspicious' || category === 'dangerous') {
                navigation?.navigate('이상탐지');
            }
        }, 300);
    };

    const handleSaveNote = async () => {
        if (selectedTransaction) {
            const result = await updateTransactionNote(selectedTransaction.id, editedNote);

            if (result.success) {
                setSelectedTransaction({ ...selectedTransaction, notes: editedNote });
                setIsEditingNote(false);
                alert('메모가 저장되었습니다.');
            } else {
                alert('메모 저장 실패');
            }
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles(colors).transactionCard} onPress={() => handleTransactionClick(item)} activeOpacity={0.7}>
            <View style={styles(colors).transactionHeader}>
                <View style={styles(colors).merchantInfo}>
                    <Text style={styles(colors).merchant}>{item.merchant}</Text>
                    <Text style={styles(colors).cardTypeBadge(item.cardType)}>{item.cardType}</Text>
                </View>
                <Text style={styles(colors).amount}>{formatCurrency(item.amount)}</Text>
            </View>
            <View style={styles(colors).transactionDetails}>
                <Text style={styles(colors).category}>{item.category}</Text>
                <Text style={styles(colors).date}>{item.date}</Text>
            </View>
            {item.notes && <Text style={styles(colors).notes}>{item.notes}</Text>}
            <Text style={styles(colors).clickHint}>탭하여 상세 정보 보기</Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={colors.screenGradient} style={styles(colors).container}>
            {/* Header */}
            <View style={styles(colors).header}>
                <View>
                    <Text style={styles(colors).title}>거래내역</Text>
                    <Text style={styles(colors).subtitle}>
                        {searchQuery ? `검색 결과 ${filteredTransactions.length}건` : `총 ${transactions.length}건`}
                    </Text>
                </View>
                <View style={styles(colors).headerIcon}>
                    <Feather name="file-text" size={24} color="#2563EB" />
                </View>
            </View>

            {/* AI Prediction Card - 거래가 있을 때만 표시 */}
            {transactions.length > 0 && (
                <View style={styles(colors).predictionCard}>
                    <View style={styles(colors).predictionHeader}>
                        <Text style={styles(colors).predictionIcon}>🤖</Text>
                        <Text style={styles(colors).predictionTitle}>AI 다음 소비 예측</Text>
                    </View>

                    {prediction !== null ? (
                        <Text style={styles(colors).predictionText}>
                            현재 소비 패턴 분석 결과, 다음 거래는
                            <Text style={{ fontWeight: '800', color: '#2563EB', fontSize: 18, backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                {prediction}
                            </Text>
                            카테고리일 확률이 높습니다.
                        </Text>
                    ) : (
                        <Text style={styles(colors).predictionText}>
                            최근 거래 데이터를 분석하여 다음 소비 패턴을 예측합니다.
                        </Text>
                    )}

                    <TouchableOpacity
                        style={styles(colors).predictionButton}
                        onPress={fetchPrediction}
                    >
                        <Text style={styles(colors).predictionButtonText}>
                            {prediction !== null ? '다시 예측하기' : '다음 소비 예측하기'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 쿠폰 발급 알림 배너 - 최상단 배치 */}
            {couponNotification && (
                <View style={styles(colors).couponBannerTop}>
                    <TouchableOpacity onPress={() => setCouponNotification(null)} style={styles(colors).couponBannerCloseTop}>
                        <Text style={{ fontSize: 20, color: '#1E40AF' }}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles(colors).couponBannerTitleTop}>🎉 추천 쿠폰 도착!</Text>
                    <View style={styles(colors).couponBannerCouponTop}>
                        <Text style={styles(colors).couponBannerMerchant}>{couponNotification.couponInfo.merchant}</Text>
                        <Text style={styles(colors).couponBannerDiscount}>{couponNotification.couponInfo.discount.toLocaleString()}원 할인</Text>
                    </View>
                    <View style={styles(colors).couponBannerInfoTop}>
                        <Text style={styles(colors).couponBannerInfoText}>다음 소비 예측: <Text style={{ fontWeight: 'bold' }}>{couponNotification.category}</Text></Text>
                        <Text style={styles(colors).couponBannerInfoText}>신뢰도: {(couponNotification.confidence * 100).toFixed(1)}%</Text>
                    </View>
                    <TouchableOpacity
                        style={styles(colors).couponBannerButtonTop}
                        onPress={async () => {
                            try {
                                // API로 쿠폰 발급
                                const { issueCoupon } = await import('../api/coupons');
                                await issueCoupon(
                                    couponNotification.couponInfo.merchant,
                                    couponNotification.couponInfo.discount
                                );
                                console.log('쿠폰 발급 완료');
                            } catch (error) {
                                console.error('쿠폰 발급 오류:', error);
                                // 중복 발급 등 에러는 무시하고 쿠폰함으로 이동
                            }
                            navigation.navigate('쿠폰함');
                            setCouponNotification(null);
                        }}
                    >
                        <Text style={styles(colors).couponBannerButtonTextTop}>쿠폰함에서 확인하기 →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Search Bar */}
            <View style={styles(colors).searchContainer}>
                <Text style={styles(colors).searchIcon}>🔍</Text>
                <TextInput
                    style={styles(colors).searchInput}
                    placeholder="가맹점, 카테고리, 메모로 검색..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles(colors).clearButton}>
                        <Text style={styles(colors).clearIcon}>✕</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {transactions.length === 0 ? (
                <EmptyState
                    icon="📊"
                    title="연동된 거래내역이 없습니다"
                    description="프로필 → 데이터 동기화로 CSV 파일을 업로드하세요"
                    actionText="동기화 하러 가기"
                    onAction={() => navigation.navigate('프로필')}
                />
            ) : filteredTransactions.length === 0 ? (
                <EmptyState
                    icon="🔍"
                    title="검색 결과 없음"
                    description="검색 조건과 일치하는 거래가 없습니다"
                    actionText="검색 초기화"
                    onAction={() => setSearchQuery('')}
                />
            ) : (
                <FlatList
                    data={filteredTransactions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles(colors).list}
                />
            )}

            {/* Transaction Detail Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles(colors).modalOverlay}>
                    <View style={styles(colors).modalContent}>
                        <Text style={styles(colors).modalTitle}>거래 상세</Text>

                        {selectedTransaction && (
                            <>
                                <View style={styles(colors).modalHeader}>
                                    <Text style={styles(colors).modalMerchant}>{selectedTransaction.merchant}</Text>
                                    <Text style={styles(colors).modalBusinessName}>({selectedTransaction.businessName})</Text>
                                </View>

                                <View style={styles(colors).detailSection}>
                                    <View style={styles(colors).detailRow}>
                                        <Text style={styles(colors).detailLabel}>거래일시</Text>
                                        <Text style={styles(colors).detailValue}>{selectedTransaction.date}</Text>
                                    </View>
                                    <View style={styles(colors).detailRow}>
                                        <Text style={styles(colors).detailLabel}>거래구분</Text>
                                        <Text style={styles(colors).detailValue}>{selectedTransaction.cardType}카드</Text>
                                    </View>
                                    <View style={styles(colors).detailRow}>
                                        <Text style={styles(colors).detailLabel}>카테고리</Text>
                                        <Text style={styles(colors).detailValue}>{selectedTransaction.category}</Text>
                                    </View>
                                    <View style={styles(colors).detailRow}>
                                        <Text style={styles(colors).detailLabel}>거래금액</Text>
                                        <Text style={styles(colors).detailValueAmount}>-{formatCurrency(selectedTransaction.amount, false)} 원</Text>
                                    </View>
                                    <View style={styles(colors).detailRow}>
                                        <Text style={styles(colors).detailLabel}>
                                            {selectedTransaction.cardType === '체크' ? '거래후잔액' : '결제액누계'}
                                        </Text>
                                        <Text style={styles(colors).detailValueBalance}>
                                            {selectedTransaction.cardType === '체크'
                                                ? formatCurrency(selectedTransaction.balance, false)
                                                : formatCurrency(selectedTransaction.accumulated, false)} 원
                                        </Text>
                                    </View>
                                    <View style={styles(colors).detailRow}>
                                        <Text style={styles(colors).detailLabel}>추가메모</Text>
                                        {isEditingNote ? (
                                            <View style={styles(colors).noteEditContainer}>
                                                <TextInput
                                                    style={styles(colors).noteInput}
                                                    value={editedNote}
                                                    onChangeText={setEditedNote}
                                                    placeholder="메모를 입력하세요"
                                                    placeholderTextColor={colors.textSecondary}
                                                    autoFocus
                                                />
                                                <TouchableOpacity style={styles(colors).noteSaveButton} onPress={handleSaveNote}>
                                                    <Text style={styles(colors).noteSaveText}>저장</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={() => setIsEditingNote(true)} style={styles(colors).noteClickable}>
                                                <Text style={styles(colors).detailValue}>
                                                    {selectedTransaction.notes || '(메모 없음)'}
                                                </Text>
                                                <Text style={styles(colors).noteEditHint}>✏️</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                <View style={styles(colors).modalSection}>
                                    <Text style={styles(colors).modalSectionTitle}>의심되는 거래인가요?</Text>
                                    <Text style={styles(colors).modalText}>이 거래가 의심스럽다면 "이상거래로 표시"를 눌러주세요.</Text>
                                </View>
                            </>
                        )}

                        <View style={styles(colors).modalButtons}>
                            <TouchableOpacity style={styles(colors).modalButtonCancel} onPress={() => setModalVisible(false)}>
                                <Text style={styles(colors).modalButtonTextCancel}>닫기</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles(colors).modalButtonAnomaly} onPress={handleMarkAsAnomaly}>
                                <Text style={styles(colors).modalButtonText}>이상거래 신고</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Anomaly Category Selection Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={anomalyCategoryModalVisible}
                onRequestClose={() => setAnomalyCategoryModalVisible(false)}>
                <View style={styles(colors).modalOverlay}>
                    <View style={styles(colors).categoryModalContent}>
                        <Text style={styles(colors).modalTitle}>⚠️ 이상거래 분류</Text>

                        {selectedTransaction && (
                            <View style={styles(colors).categoryTransactionInfo}>
                                <Text style={styles(colors).categoryTransactionName}>
                                    {selectedTransaction.merchant}
                                </Text>
                                <Text style={styles(colors).categoryTransactionAmount}>
                                    {formatCurrency(selectedTransaction.amount)}
                                </Text>
                            </View>
                        )}

                        <View style={styles(colors).categoryOptions}>
                            <TouchableOpacity
                                style={[styles(colors).categoryOption, styles(colors).categoryOptionSafe]}
                                onPress={() => handleCategorySelect('safe')}>
                                <Text style={styles(colors).categoryOptionIcon}>🟢</Text>
                                <View style={styles(colors).categoryOptionContent}>
                                    <Text style={styles(colors).categoryOptionTitle}>안전</Text>
                                    <Text style={styles(colors).categoryOptionDesc}>
                                        본인이 직접 사용한 거래입니다
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles(colors).categoryOption, styles(colors).categoryOptionSuspicious]}
                                onPress={() => handleCategorySelect('suspicious')}>
                                <Text style={styles(colors).categoryOptionIcon}>🟡</Text>
                                <View style={styles(colors).categoryOptionContent}>
                                    <Text style={styles(colors).categoryOptionTitle}>의심</Text>
                                    <Text style={styles(colors).categoryOptionDesc}>
                                        확실하지 않지만 의심스러운 거래입니다
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles(colors).categoryOption, styles(colors).categoryOptionDangerous]}
                                onPress={() => handleCategorySelect('dangerous')}>
                                <Text style={styles(colors).categoryOptionIcon}>🔴</Text>
                                <View style={styles(colors).categoryOptionContent}>
                                    <Text style={styles(colors).categoryOptionTitle}>위험</Text>
                                    <Text style={styles(colors).categoryOptionDesc}>
                                        명백한 사기 또는 도용 거래입니다
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles(colors).reportButton}
                            onPress={() => {
                                setAnomalyCategoryModalVisible(false);
                                setTimeout(() => {
                                    alert('신고 접수 완료\n\n고객센터에서 24시간 내 연락드리겠습니다.\n필요시 카드 정지 조치가 진행됩니다.');
                                }, 300);
                            }}>
                            <Text style={styles(colors).reportButtonText}>고객센터에 신고하기</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles(colors).categoryModalCancel}
                            onPress={() => setAnomalyCategoryModalVisible(false)}>
                            <Text style={styles(colors).categoryModalCancelText}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = (colors) => StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#93C5FD',
    },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, fontFamily: 'Inter_700Bold' },
    subtitle: { fontSize: 16, color: '#2563EB', marginTop: 6, fontWeight: '600' },
    list: { padding: 16 },
    transactionCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    merchantInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    merchant: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    cardTypeBadge: (type) => ({
        fontSize: 11,
        color: type === '신용' ? '#2563EB' : '#059669',
        backgroundColor: type === '신용' ? '#DBEAFE' : '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        fontWeight: '600',
        overflow: 'hidden',
    }),
    amount: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
    transactionDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    category: { fontSize: 14, color: colors.textSecondary },
    date: { fontSize: 12, color: colors.textSecondary },
    notes: { fontSize: 12, color: colors.text, marginTop: 4, fontStyle: 'italic' },
    clickHint: { fontSize: 11, color: '#3B82F6', marginTop: 8, fontWeight: '500' },

    // Search styles
    searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.border },
    searchIcon: { fontSize: 20, marginRight: 12 },
    searchInput: { flex: 1, fontSize: 16, color: colors.text, padding: 0 },
    clearButton: { padding: 8 },
    clearIcon: { fontSize: 18, color: colors.textSecondary },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20, textAlign: 'center' },
    modalHeader: { alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalMerchant: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    modalBusinessName: { fontSize: 13, color: colors.textSecondary },

    detailSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border + '40' },
    detailLabel: { fontSize: 14, color: colors.textSecondary, flex: 0.4 },
    detailValue: { fontSize: 14, color: colors.text, flex: 0.6, textAlign: 'right' },
    detailValueAmount: { fontSize: 16, fontWeight: 'bold', color: colors.error, flex: 0.6, textAlign: 'right' },
    detailValueBalance: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 0.6, textAlign: 'right' },

    noteClickable: { flex: 0.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
    noteEditHint: { fontSize: 14, opacity: 0.5 },
    noteEditContainer: { flex: 0.6, flexDirection: 'row', gap: 8, alignItems: 'center' },
    noteInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, fontSize: 14, color: colors.text, backgroundColor: colors.background },
    noteSaveButton: { backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    noteSaveText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    modalSection: { marginBottom: 16 },
    modalSectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.warning, marginBottom: 8 },
    modalText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    modalButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
    modalButtonCancel: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    modalButtonAnomaly: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.warning },
    modalButtonTextCancel: { color: colors.text, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
    modalButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },

    // Category Modal styles
    categoryModalContent: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 500,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryModalSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    categoryTransactionInfo: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.background,
        borderRadius: 12,
        marginBottom: 20,
    },
    categoryTransactionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    categoryTransactionAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.error,
    },
    categoryOptions: {
        gap: 12,
        marginBottom: 20,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    categoryOptionSafe: {
        borderColor: colors.success,
        backgroundColor: colors.success + '10',
    },
    categoryOptionSuspicious: {
        borderColor: colors.warning,
        backgroundColor: colors.warning + '10',
    },
    categoryOptionDangerous: {
        borderColor: colors.error,
        backgroundColor: colors.error + '10',
    },
    categoryOptionIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    categoryOptionContent: {
        flex: 1,
    },
    categoryOptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    categoryOptionDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    reportButton: {
        backgroundColor: colors.error,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    categoryModalCancel: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    categoryModalCancelText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Prediction Card styles
    predictionCard: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        padding: 20,
        backgroundColor: '#DBEAFE',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#93C5FD',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    predictionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    predictionIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    predictionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E40AF',
    },
    predictionText: {
        fontSize: 14,
        color: '#1E3A8A',
        lineHeight: 22,
        marginBottom: 16,
    },
    predictionButton: {
        backgroundColor: '#2563EB',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    predictionButtonDisabled: {
        backgroundColor: '#93C5FD',
        opacity: 0.5,
    },
    predictionButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // Coupon Banner styles
    couponBanner: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    couponBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    couponBannerIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    couponBannerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
        flex: 1,
    },
    couponBannerClose: {
        padding: 4,
    },
    couponBannerInfo: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#A7F3D0',
    },
    couponBannerText: {
        fontSize: 14,
        color: '#065F46',
        marginBottom: 4,
        lineHeight: 20,
    },
    couponBannerCoupon: {
        backgroundColor: '#D1FAE5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    couponBannerCouponText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#047857',
        textAlign: 'center',
    },
    couponBannerButton: {
        backgroundColor: '#10B981',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    couponBannerButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // Top Coupon Banner (파란색 테마, 기존 디자인과 통일)
    couponBannerTop: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        padding: 24,
        backgroundColor: '#DBEAFE',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#93C5FD',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
    },
    couponBannerCloseTop: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
        zIndex: 10,
    },
    couponBannerTitleTop: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E40AF',
        textAlign: 'center',
        marginBottom: 16,
    },
    couponBannerCouponTop: {
        backgroundColor: '#EFF6FF',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#93C5FD',
    },
    couponBannerMerchant: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 6,
    },
    couponBannerDiscount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2563EB',
    },
    couponBannerInfoTop: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    couponBannerInfoText: {
        fontSize: 16,
        color: '#1E3A8A',
        fontWeight: '600',
    },
    couponBannerButtonTop: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    couponBannerButtonTextTop: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
