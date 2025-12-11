import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactions, updateTransactionNote as apiUpdateNote } from '../api';
import { predictNextTransaction } from '../api/ml';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // 앱 시작 시 캐시 로드
    useEffect(() => {
        loadCachedTransactions();
        // 자동으로 서버에서 최신 데이터 가져오기
        loadTransactionsFromServer();
    }, []);

    const loadCachedTransactions = async () => {
        try {
            const cached = await AsyncStorage.getItem('transactions_cache');
            const syncTime = await AsyncStorage.getItem('last_sync_time');

            if (cached) {
                setTransactions(JSON.parse(cached));
                setLastSyncTime(syncTime);
                console.log(`✅ 캐시에서 ${JSON.parse(cached).length}건 거래 로드됨`);
            }
        } catch (error) {
            console.error('캐시 로드 실패:', error);
        }
    };

    /**
     * 서버에서 거래 데이터 가져오기 (실시간 API 호출)
     */
    const loadTransactionsFromServer = async (userId = null) => {
        setLoading(true);
        try {
            const response = await getTransactions({ user_id: userId, page_size: 100 });

            if (response && response.transactions) {
                // API 응답을 앱 형식으로 변환
                const formattedTransactions = response.transactions.map(t => ({
                    id: String(t.id),
                    merchant: t.merchant,
                    businessName: t.merchant,
                    amount: t.amount,
                    category: t.category,
                    originalCategory: t.category,
                    date: t.transaction_date,
                    cardType: t.currency === 'KRW' ? '신용' : '체크',
                    cardName: t.payment_method || '카드',
                    notes: t.description || '',
                    status: t.status,
                }));

                await saveTransactionsToCache(formattedTransactions);
                setTransactions(formattedTransactions);

                const now = new Date().toISOString();
                await AsyncStorage.setItem('last_sync_time', now);
                setLastSyncTime(now);

                console.log(`✅ 서버에서 ${formattedTransactions.length}건 거래 로드 완료 (data_source: ${response.data_source})`);
                return { success: true, count: formattedTransactions.length };
            }
        } catch (error) {
            console.error('❌ 서버 거래 로드 실패:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const saveTransactionsToCache = async (newTransactions) => {
        try {
            await AsyncStorage.setItem(
                'transactions_cache',
                JSON.stringify(newTransactions)
            );
        } catch (error) {
            console.error('캐시 저장 실패:', error);
        }
    };

    const saveTransactions = async (newTransactions) => {
        try {
            setTransactions(newTransactions);
            await saveTransactionsToCache(newTransactions);

            const now = new Date().toISOString();
            await AsyncStorage.setItem('last_sync_time', now);
            setLastSyncTime(now);

            console.log(`✅ ${newTransactions.length}건 거래 저장 완료`);
            return { success: true };
        } catch (error) {
            console.error('거래 저장 실패:', error);
            return { success: false, error };
        }
    };

    const updateNote = async (transactionId, note) => {
        try {
            // API 호출
            await apiUpdateNote(transactionId, note);

            // 로컬 상태 업데이트
            const updated = transactions.map(t =>
                t.id === String(transactionId)
                    ? { ...t, notes: note }
                    : t
            );

            setTransactions(updated);
            await saveTransactionsToCache(updated);

            return { success: true };
        } catch (error) {
            console.error('메모 저장 실패:', error);
            return { success: false, error };
        }
    };

    const clearTransactions = async () => {
        try {
            setTransactions([]);
            await AsyncStorage.removeItem('transactions_cache');
            await AsyncStorage.removeItem('last_sync_time');
            setLastSyncTime(null);
            return { success: true };
        } catch (error) {
            console.error('거래 삭제 실패:', error);
            return { success: false, error };
        }
    };

    const predictNextPurchase = async () => {
        if (!transactions || transactions.length === 0) {
            return { success: false, error: '거래 데이터가 없습니다' };
        }

        setLoading(true);
        try {
            // 거래 데이터를 CSV 형식으로 변환
            const csvHeader = '날짜,시간,타입,대분류,소분류,내용,금액,화폐,결제수단,메모\n';
            const csvRows = transactions.map(t => {
                const datetime = t.date.split(' ');
                const date = datetime[0] || new Date().toISOString().split('T')[0];
                const time = datetime[1] || '00:00';

                return [
                    date,
                    time,
                    '지출',
                    t.originalCategory || t.category,
                    '',
                    t.merchant || t.businessName,
                    -Math.abs(t.amount),
                    'KRW',
                    t.cardType === '체크' ? '체크카드' : '신용카드',
                    t.notes || ''
                ].join(',');
            }).join('\n');

            const csvContent = csvHeader + csvRows;

            // FormData 생성
            const formData = new FormData();
            const blob = new Blob([csvContent], { type: 'text/csv' });
            formData.append('file', blob, 'transactions.csv');

            // API 호출 (api/ml.js 사용)
            const result = await predictNextTransaction(blob);
            console.log('✅ 다음 소비 예측 성공:', result);

            return { success: true, data: result };
        } catch (error) {
            console.error('❌ 다음 소비 예측 실패:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // 새로고침 함수
    const refresh = async (userId = null) => {
        return await loadTransactionsFromServer(userId);
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            loading,
            lastSyncTime,
            saveTransactions,
            updateTransactionNote: updateNote,
            clearTransactions,
            predictNextPurchase,
            loadTransactionsFromServer,
            refresh,
            setLoading
        }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions는 TransactionProvider 안에서만 사용 가능합니다!');
    }
    return context;
};
