import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactions, updateTransactionNote as apiUpdateNote, createTransactionsBulk, deleteAllTransactions } from '../api';
import { predictNextTransaction } from '../api/ml';

const TransactionContext = createContext();

// TransactionProvider - 거래 데이터 제공 컴포넌트
export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // 앱 시작 시 캐시 로드 (캐시 있으면 서버 호출 생략)
    useEffect(() => {
        const initTransactions = async () => {
            const hasCached = await loadCachedTransactions();
            // 캐시가 없을 때만 서버에서 가져오기
            if (!hasCached) {
                // 현재 로그인한 사용자 ID 가져오기
                const userJson = await AsyncStorage.getItem('user');
                const user = userJson ? JSON.parse(userJson) : null;
                if (user?.id) {
                    loadTransactionsFromServer(user.id);
                }
            }
        };
        initTransactions();
    }, []);


    // loadCachedTransactions - 사용자별 캐시 로드
    const loadCachedTransactions = async () => {
        try {
            // 현재 로그인한 사용자 ID 가져오기
            const userJson = await AsyncStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            if (!user?.id) return false;  // 사용자 정보 없으면 캐시 없음
            
            const cacheKey = `transactions_cache_${user.id}`;
            const syncKey = `last_sync_time_${user.id}`;
            
            const cached = await AsyncStorage.getItem(cacheKey);
            const syncTime = await AsyncStorage.getItem(syncKey);

            if (cached) {
                const parsedCache = JSON.parse(cached);
                setTransactions(parsedCache);
                setLastSyncTime(syncTime);
                return parsedCache.length > 0;  // 캐시 있음
            }
            return false;  // 캐시 없음
        } catch (error) {
            console.error('캐시 로드 실패:', error);
            return false;
        }
    };

    // loadTransactionsFromServer - 서버에서 거래 데이터 가져오기
    const loadTransactionsFromServer = async (userId = null) => {
        setLoading(true);
        try {
            const response = await getTransactions({ user_id: userId, page_size: 10000 });

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

                await saveTransactionsToCache(formattedTransactions, userId);
                setTransactions(formattedTransactions);

                const now = new Date().toISOString();
                const syncKey = `last_sync_time_${userId}`;
                await AsyncStorage.setItem(syncKey, now);
                setLastSyncTime(now);

                return { success: true, count: formattedTransactions.length };
            }
        } catch (error) {
            console.error('서버 거래 로드 실패:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // saveTransactionsToCache - 사용자별 캐시 저장
    const saveTransactionsToCache = async (newTransactions, userId = null) => {
        try {
            // userId가 없으면 AsyncStorage에서 가져오기
            let uid = userId;
            if (!uid) {
                const userJson = await AsyncStorage.getItem('user');
                const user = userJson ? JSON.parse(userJson) : null;
                uid = user?.id;
            }
            if (!uid) return;  // 사용자 정보 없으면 저장 안 함
            
            const cacheKey = `transactions_cache_${uid}`;
            await AsyncStorage.setItem(cacheKey, JSON.stringify(newTransactions));
        } catch (error) {
            console.error('캐시 저장 실패:', error);
        }
    };

    // saveTransactions - 거래 저장
    const saveTransactions = async (newTransactions, userId = 1) => {
        try {
            // 1. 로컬 저장
            setTransactions(newTransactions);
            await saveTransactionsToCache(newTransactions);

            const now = new Date().toISOString();
            await AsyncStorage.setItem('last_sync_time', now);
            setLastSyncTime(now);

            // 2. 백엔드 API 호출 (로그인된 사용자 ID 필요)
            try {
                const userJson = await AsyncStorage.getItem('user');
                const user = userJson ? JSON.parse(userJson) : null;
                const currentUserId = user?.id || userId;
                
                if (currentUserId) {
                    const result = await createTransactionsBulk(currentUserId, newTransactions);
                    // 저장 완료
                }
            } catch (apiError) {
                console.warn('백엔드 저장 실패 (로컬은 성공):', apiError);
            }

            return { success: true };
        } catch (error) {
            console.error('거래 저장 실패:', error);
            return { success: false, error };
        }
    };

    // updateNote - 메모 업데이트
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

    // clearTransactions - 거래 삭제
    const clearTransactions = async () => {
        try {
            // 1. 로컬 삭제
            setTransactions([]);
            await AsyncStorage.removeItem('transactions_cache');
            await AsyncStorage.removeItem('last_sync_time');
            setLastSyncTime(null);

            // 2. 백엔드 API 호출
            try {
                const userJson = await AsyncStorage.getItem('user');
                const user = userJson ? JSON.parse(userJson) : null;
                
                if (user?.id) {
                    const result = await deleteAllTransactions(user.id);
                    // 삭제 완료
                }
            } catch (apiError) {
                console.warn('백엔드 삭제 실패 (로컬은 성공):', apiError);
            }

            return { success: true };
        } catch (error) {
            console.error('거래 삭제 실패:', error);
            return { success: false, error };
        }
    };

    // predictNextPurchase - 다음 구매 예측
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
            return { success: true, data: result };
        } catch (error) {
            console.error('다음 소비 예측 실패:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // 새로고침 함수
    const refresh = async (userId = null) => {
        // userId가 없으면 현재 로그인한 사용자 ID 가져오기
        let uid = userId;
        if (!uid) {
            const userJson = await AsyncStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            uid = user?.id;
        }
        if (!uid) return { success: false, error: '사용자 정보 없음' };
        return await loadTransactionsFromServer(uid);
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

// useTransactions - 거래 데이터 사용
export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions는 TransactionProvider 안에서만 사용 가능합니다!');
    }
    return context;
};
