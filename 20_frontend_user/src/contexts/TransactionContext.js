import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // 앱 시작 시 캐시 로드
    useEffect(() => {
        loadCachedTransactions();
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

    const saveTransactions = async (newTransactions) => {
        try {
            setTransactions(newTransactions);

            // AsyncStorage에 저장
            await AsyncStorage.setItem(
                'transactions_cache',
                JSON.stringify(newTransactions)
            );

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

    const updateTransactionNote = async (transactionId, note) => {
        try {
            const updated = transactions.map(t =>
                t.id === String(transactionId)
                    ? { ...t, notes: note }
                    : t
            );

            setTransactions(updated);

            // AsyncStorage 업데이트
            await AsyncStorage.setItem(
                'transactions_cache',
                JSON.stringify(updated)
            );

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

            // API 호출
            const response = await fetch('http://localhost:8000/ml/predict-next', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ 다음 소비 예측 성공:', result);

            return { success: true, data: result };
        } catch (error) {
            console.error('❌ 다음 소비 예측 실패:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };


    return (
        <TransactionContext.Provider value={{
            transactions,
            loading,
            lastSyncTime,
            saveTransactions,
            updateTransactionNote,
            clearTransactions,
            predictNextPurchase,
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
