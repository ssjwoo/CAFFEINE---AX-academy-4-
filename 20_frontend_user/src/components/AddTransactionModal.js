import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTransactions } from '../contexts/TransactionContext';

const CATEGORIES = [
    { name: '외식', icon: 'coffee', color: '#F59E0B' },
    { name: '식료품', icon: 'shopping-cart', color: '#10B981' },
    { name: '쇼핑', icon: 'shopping-bag', color: '#EC4899' },
    { name: '교통', icon: 'navigation', color: '#3B82F6' },
    { name: '생활', icon: 'home', color: '#8B5CF6' },
    { name: '주유', icon: 'zap', color: '#EF4444' },
    { name: '기타', icon: 'more-horizontal', color: '#6B7280' },
];

export default function AddTransactionModal({ visible, onClose, onSuccess }) {
    const { addTransaction } = useTransactions();  // TransactionContext 사용
    const [amount, setAmount] = useState('');
    const [merchantName, setMerchantName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('외식');
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setAmount('');
        setMerchantName('');
        setDescription('');
        setSelectedCategory('외식');
    };

    const handleSubmit = async () => {
        // 유효성 검사
        if (!amount || parseFloat(amount) <= 0) {
            alert('유효한 금액을 입력하세요.');
            return;
        }
        if (!merchantName.trim()) {
            alert('가맹점명을 입력하세요.');
            return;
        }

        setIsLoading(true);

        try {
            // TransactionContext의 addTransaction 사용 (AI 평가 포함)
            const result = await addTransaction({
                amount: parseFloat(amount),
                category: selectedCategory,
                merchant_name: merchantName.trim(),
                description: description.trim() || null,
                transaction_date: new Date().toISOString(),
            });

            if (result.success) {
                console.log('✅ 거래 추가 성공:', result.transaction);

                // 폼 초기화
                resetForm();

                // 모달 즉시 닫기
                onClose();

                // 성공 콜백 호출
                if (onSuccess) onSuccess();

                // AI 평가 메시지가 없으면 기본 알림 (AI 꺼져있을 때)
                if (!result.aiEvaluation) {
                    alert('✅ 소비 내역이 추가되었습니다!');
                }
            } else {
                throw new Error(result.error?.message || '저장 실패');
            }
        } catch (error) {
            console.error('❌ 거래 추가 실패:', error);
            alert(`저장에 실패했습니다: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContainer}>
                    {/* 헤더 */}
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <Text style={styles.headerTitle}>💸 소비 추가</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color="white" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* 금액 입력 */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>금액 (원)</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>

                        {/* 가맹점명 입력 */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>가맹점명</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="예: 스타벅스 강남점"
                                placeholderTextColor="#9CA3AF"
                                value={merchantName}
                                onChangeText={setMerchantName}
                            />
                        </View>

                        {/* 카테고리 선택 */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>카테고리</Text>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.name}
                                        style={[
                                            styles.categoryButton,
                                            selectedCategory === cat.name && {
                                                backgroundColor: cat.color + '30',
                                                borderColor: cat.color,
                                            },
                                        ]}
                                        onPress={() => setSelectedCategory(cat.name)}
                                    >
                                        <Feather
                                            name={cat.icon}
                                            size={20}
                                            color={selectedCategory === cat.name ? cat.color : '#6B7280'}
                                        />
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                selectedCategory === cat.name && { color: cat.color },
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 메모 입력 */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>메모 (선택)</Text>
                            <TextInput
                                style={[styles.textInput, styles.memoInput]}
                                placeholder="간단한 메모를 입력하세요"
                                placeholderTextColor="#9CA3AF"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />
                        </View>
                    </ScrollView>

                    {/* 저장 버튼 */}
                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            <Feather name={isLoading ? 'loader' : 'check'} size={20} color="white" />
                            <Text style={styles.submitText}>
                                {isLoading ? '저장 중...' : '저장하기'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#1F2937',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D1D5DB',
        marginBottom: 8,
    },
    amountInput: {
        backgroundColor: '#374151',
        borderRadius: 12,
        padding: 16,
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
        textAlign: 'center',
    },
    textInput: {
        backgroundColor: '#374151',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: 'white',
    },
    memoInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#374151',
        backgroundColor: '#374151',
    },
    categoryText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#9CA3AF',
    },
    submitButton: {
        margin: 20,
        marginTop: 0,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    submitText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 8,
    },
});
