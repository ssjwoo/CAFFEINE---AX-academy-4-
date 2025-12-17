
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
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
    const { transactions, updateTransactionNote, addTransaction, removeTransaction } = useTransactions();
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [anomalyCategoryModalVisible, setAnomalyCategoryModalVisible] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedNote, setEditedNote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [prediction, setPrediction] = useState(null);

    // 새 거래 입력 상태
    const [newTransaction, setNewTransaction] = useState({
        merchant: '',
        amount: '',
        category: '기타'
    });

    const fetchPrediction = async () => {
        try {
            // 가장 최근 거래 데이터를 기반으로 다음 소비 패턴 예측
            if (transactions.length === 0) {
                alert('예측할 거래 데이터가 충분하지 않습니다.');
                return;
            }
            const recentTransaction = transactions[0];
            const requestData = {
                날짜: recentTransaction.date.split(' ')[0],
                시간: recentTransaction.date.split(' ')[1],
                타입: '지출',
                대분류: recentTransaction.category,
                소분류: '기타',
                내용: recentTransaction.merchant,
                금액: String(-recentTransaction.amount),
                화폐: 'KRW',
                결제수단: recentTransaction.cardType + '카드',
                메모: recentTransaction.notes || ''
            };

            // 1. ML 예측
            const response = await apiClient.post('/ml/predict', {
                features: requestData
            });
            const predictedCategory = response.data.prediction;
            setPrediction(predictedCategory);

            // 2. 쿠폰 자동 생성
            try {
                const couponResponse = await apiClient.post('/api/coupons/generate-from-prediction', {
                    predicted_category: predictedCategory,
                    confidence: response.data.confidence || 0.8
                });

                // 쿠폰 발급 성공 알림
                Alert.alert(
                    '🎉 예측 성공!',
                    `다음 소비 예측: ${predictedCategory}\n\n` +
                    `🎁 쿠폰 발급 완료!\n` +
                    `${couponResponse.data.merchant_name}에서 사용 가능한\n` +
                    `${formatCurrency(couponResponse.data.discount_amount)} 할인 쿠폰이 발급되었습니다!\n\n` +
                    `만료일: ${couponResponse.data.expiry_date}`
                );
            } catch (couponError) {
                console.error('Coupon generation failed:', couponError);
                // 예측은 성공했지만 쿠폰 발급 실패 시
                Alert.alert('예측 결과', `다음 소비 예측: ${predictedCategory}\n\n쿠폰 발급 중 오류가 발생했습니다.`);
            }
        } catch (error) {
            console.error('Prediction failed:', error);
            Alert.alert('오류', '예측 실패: ' + (error.response?.data?.detail || error.message));
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

    const handleSaveNote = async () => {
        if (!selectedTransaction) return;

        const result = await updateTransactionNote(selectedTransaction.id, editedNote);
        if (result.success) {
            setSelectedTransaction({ ...selectedTransaction, notes: editedNote });
            setIsEditingNote(false);
        } else {
            Alert.alert('오류', '메모 저장 실패');
        }
    };

    const handleAddTransaction = async () => {
        if (!newTransaction.merchant || !newTransaction.amount) {
            Alert.alert('알림', '가맹점명과 금액을 입력해주세요.');
            return;
        }

        const data = {
            merchant_name: newTransaction.merchant,
            amount: parseFloat(newTransaction.amount),
            category: newTransaction.category,
            transaction_date: new Date().toISOString()
        };

        const result = await addTransaction(data);
        if (result.success) {
            setAddModalVisible(false);
            setNewTransaction({ merchant: '', amount: '', category: '기타' });
            Alert.alert('성공', '거래가 추가되었습니다.');
        } else {
            Alert.alert('오류', '거래 추가 실패: ' + (result.error?.message || '알 수 없는 오류'));
        }
    };

    const handleDeleteTransaction = async () => {
        if (!selectedTransaction) return;

        if (Platform.OS === 'web') {
            const confirmed = window.confirm('정말 이 거래 내역을 삭제하시겠습니까?');
            if (confirmed) {
                const result = await removeTransaction(selectedTransaction.id);
                if (result.success) {
                    setModalVisible(false);
                } else {
                    alert('거래 삭제 실패');
                }
            }
        } else {
            Alert.alert(
                '거래 삭제',
                '정말 이 거래 내역을 삭제하시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '삭제',
                        style: 'destructive',
                        onPress: async () => {
                            const result = await removeTransaction(selectedTransaction.id);
                            if (result.success) {
                                setModalVisible(false);
                            } else {
                                Alert.alert('오류', '거래 삭제 실패');
                            }
                        }
                    }
                ]
            );
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.transactionCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleTransactionClick(item)}
            activeOpacity={0.7}
        >
            <View style={styles.transactionHeader}>
                <View style={styles.merchantInfo}>
                    <Text style={[styles.merchant, { color: colors.text }]}>{item.merchant}</Text>
                    <Text style={styles.cardTypeBadge(item.cardType)}>{item.cardType}</Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </View>
            <View style={styles.transactionDetails}>
                <Text style={[styles.category, { color: colors.textSecondary }]}>{item.category} | {item.date}</Text>
            </View>
            {
                item.notes ? (
                    <Text style={[styles.notes, { color: colors.text }]} numberOfLines={1}>memo: {item.notes}</Text>
                ) : null
            }
        </TouchableOpacity >
    );

    return (
        <LinearGradient colors={colors.backgroundGradient} style={styles.container}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="거래 내역 검색..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <Feather name="x" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Prediction Model Card */}
            <View style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                    <Text style={styles.predictionIcon}>🔮</Text>
                    <Text style={styles.predictionTitle}>AI 소비 예측 & 쿠폰</Text>
                </View>

                {prediction ? (
                    <Text style={styles.predictionText}>
                        다음 소비 예측: <Text style={{ fontWeight: 'bold' }}>{prediction}</Text>
                        {"\n"}추천 쿠폰을 확인해보세요!
                    </Text>
                ) : (
                    <Text style={styles.predictionText}>
                        최근 소비 패턴을 분석하여{"\n"}다음 지출을 예측하고 쿠폰을 드려요.
                    </Text>
                )}

                <TouchableOpacity
                    style={[styles.predictionButton, transactions.length === 0 && styles.predictionButtonDisabled]}
                    onPress={fetchPrediction}
                    disabled={transactions.length === 0}
                >
                    <Text style={styles.predictionButtonText}>
                        {prediction ? '다시 예측하기' : '다음 소비 예측하기'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Transaction List */}
            <FlatList
                data={filteredTransactions}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<EmptyState message={EMPTY_MESSAGES.TRANSACTIONS} />}
            />

            {/* Floating Action Button for Add Transaction */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setAddModalVisible(true)}
            >
                <Feather name="plus" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Detail Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        {selectedTransaction && (
                            <>
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.modalMerchant, { color: colors.text }]}>{selectedTransaction.merchant}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[styles.modalBusinessName, { color: colors.textSecondary }]}>{selectedTransaction.businessName}</Text>
                                        <Text style={styles.cardTypeBadge(selectedTransaction.cardType)}>{selectedTransaction.cardType}</Text>
                                    </View>
                                </View>

                                <View style={[styles.detailSection, { borderBottomColor: colors.border }]}>
                                    <View style={[styles.detailRow, { borderBottomColor: colors.border + '40' }]}>
                                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>금액</Text>
                                        <Text style={[styles.detailValueAmount, { color: colors.error }]}>{formatCurrency(selectedTransaction.amount)}</Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomColor: colors.border + '40' }]}>
                                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>카테고리</Text>
                                        <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTransaction.category}</Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomColor: colors.border + '40' }]}>
                                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>일시</Text>
                                        <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTransaction.date}</Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomColor: 'transparent' }]}>
                                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>메모</Text>
                                        {isEditingNote ? (
                                            <View style={styles.noteEditContainer}>
                                                <TextInput
                                                    style={[styles.noteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                                    value={editedNote}
                                                    onChangeText={setEditedNote}
                                                    autoFocus
                                                />
                                                <TouchableOpacity onPress={handleSaveNote} style={styles.noteSaveButton}>
                                                    <Text style={styles.noteSaveText}>저장</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={() => setIsEditingNote(true)} style={styles.noteClickable}>
                                                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTransaction.notes || '(없음)'}</Text>
                                                <Feather name="edit-2" size={14} color={colors.textSecondary} style={styles.noteEditHint} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteTransaction}>
                                        <Feather name="trash-2" size={18} color="#EF4444" />
                                        <Text style={styles.deleteButtonText}>삭제</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.actionButton, styles.anomalyButton]} onPress={handleMarkAsAnomaly}>
                                        <Feather name="alert-triangle" size={18} color="#F59E0B" />
                                        <Text style={styles.anomalyButtonText}>이상거래 신고</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.closeButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={[styles.closeButtonText, { color: colors.text }]}>닫기</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Add Transaction Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addModalVisible}
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>거래 추가</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>가맹점명</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={newTransaction.merchant}
                                onChangeText={(text) => setNewTransaction({ ...newTransaction, merchant: text })}
                                placeholder="예: 스타벅스"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>금액</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={newTransaction.amount}
                                onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
                                placeholder="예: 5000"
                                keyboardType="numeric"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>카테고리</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={newTransaction.category}
                                onChangeText={(text) => setNewTransaction({ ...newTransaction, category: text })}
                                placeholder="예: 식비, 쇼핑, 교통..."
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButtonCancel, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setAddModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonTextCancel, { color: colors.text }]}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButtonConfirm, { backgroundColor: colors.primary }]}
                                onPress={handleAddTransaction}
                            >
                                <Text style={styles.modalButtonText}>추가</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Anomaly Category Modal (Placeholder for explicit implementation if needed) */}
            {/* ... keeping existing logic if any ... */}
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContainer: { padding: 16, paddingBottom: 100 },
    transactionCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    merchantInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    merchant: { fontSize: 16, fontWeight: 'bold' },
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
    category: { fontSize: 14 },
    date: { fontSize: 12 },
    notes: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },

    // Search styles
    searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    searchIcon: { fontSize: 20, marginRight: 12 },
    searchInput: { flex: 1, fontSize: 16, padding: 0 },
    clearButton: { padding: 8 },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, borderWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalHeader: { alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1 },
    modalMerchant: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    modalBusinessName: { fontSize: 13 },

    detailSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
    detailLabel: { fontSize: 14, flex: 0.4 },
    detailValue: { fontSize: 14, flex: 0.6, textAlign: 'right' },
    detailValueAmount: { fontSize: 16, fontWeight: 'bold', flex: 0.6, textAlign: 'right' },

    noteClickable: { flex: 0.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
    noteEditHint: { fontSize: 14, opacity: 0.5 },
    noteEditContainer: { flex: 0.6, flexDirection: 'row', gap: 8, alignItems: 'center' },
    noteInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14 },
    noteSaveButton: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    noteSaveText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    // Action Buttons
    modalActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, gap: 6 },
    deleteButton: { backgroundColor: '#FEE2E2' },
    deleteButtonText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
    anomalyButton: { backgroundColor: '#FEF3C7' },
    anomalyButtonText: { color: '#F59E0B', fontWeight: 'bold', fontSize: 14 },

    closeButton: { padding: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    closeButtonText: { fontWeight: 'bold', fontSize: 14 },

    // Add Modal Styles
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalButtonCancel: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    modalButtonConfirm: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalButtonTextCancel: { fontWeight: 'bold', fontSize: 16 },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
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
});
