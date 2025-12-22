
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactions, updateTransactionNote as apiUpdateNote, createTransactionsBulk, deleteAllTransactions, createTransaction, deleteTransaction, evaluateTransaction } from '../api';
import { predictNextTransaction } from '../api/ml';
import { useToast } from './ToastContext';
import { filterMonthlyTransactions, calculateTotalSpent, analyzeCategoryBreakdown } from '../utils/spendingAnalyzer';

const TransactionContext = createContext();

// TransactionProvider - 거래 데이터 제공 컴포넌트
export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const { showToast } = useToast();  // Toast 알림 함수

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

    /**
     * 서버에서 거래 데이터 가져오기 (실시간 API 호출)
     */
    const loadTransactionsFromServer = async (userId = 1) => {
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

    const addTransaction = async (data) => {
        try {
            // API 호출
            const newTx = await createTransaction(data);

            // 앱 형식으로 변환
            const formattedTx = {
                id: String(newTx.id),
                merchant: newTx.merchant,
                businessName: newTx.merchant,
                amount: newTx.amount,
                category: newTx.category,
                originalCategory: newTx.category,
                date: newTx.transaction_date || new Date().toISOString().replace('T', ' ').substring(0, 19),
                cardType: newTx.currency === 'KRW' ? '신용' : '체크',
                cardName: newTx.payment_method || '카드',
                notes: newTx.description || '',
                status: newTx.status,
            };

            // 로컬 상태 업데이트 (최신 거래가 위로 오도록)
            const updated = [formattedTx, ...transactions];
            setTransactions(updated);
            await saveTransactionsToCache(updated);

            // 즉시 성공 반환 (모달을 빠르게 닫기 위해)
            const successResult = { success: true, transaction: formattedTx };


            // AI 평가를 백그라운드에서 비동기 실행 (await 없이)
            // AI 평가는 항상 활성화됨
            (async () => {
                try {
                    // 소비 내역 요약 계산 (유틸리티 사용)
                    const monthlyTransactions = filterMonthlyTransactions(updated);
                    const totalSpent = calculateTotalSpent(monthlyTransactions);

                    // 같은 카테고리 지출 계산
                    const categoryBreakdown = analyzeCategoryBreakdown(monthlyTransactions);
                    const categoryData = categoryBreakdown[formattedTx.category] || { count: 0, total: 0 };

                    // LLM API 호출 (리팩토링된 API 사용)
                    const evaluationResult = await evaluateTransaction({
                        transaction: {
                            merchant_name: formattedTx.merchant,
                            amount: formattedTx.amount,
                            category: formattedTx.category
                        }
                        // naggingLevel은 기본값 '중' 사용
                    });

                    if (evaluationResult.success && evaluationResult.message) {
                        console.log('✅ AI 평가:', evaluationResult.message);

                        // Toast 알림 표시 (모달이 완전히 닫힌 후)
                        setTimeout(() => {
                            showToast(evaluationResult.message, 6000);  // 6초 동안 표시
                        }, 1000);
                    }
                } catch (evalError) {
                    console.error('AI 평가 실패:', evalError);
                }
            })();

            return successResult;
        } catch (error) {
            console.error('거래 추가 실패:', error);
            return { success: false, error };
        }
    };

    const removeTransaction = async (id) => {
        try {
            // 먼저 로컬 상태 업데이트 (UI 반응성 향상)
            const updated = transactions.filter(t => String(t.id) !== String(id));
            setTransactions(updated);
            await saveTransactionsToCache(updated);

            // 백엔드 API 호출 시도 (실패해도 로컬에서는 이미 삭제됨)
            try {
                await deleteTransaction(id);
            } catch (apiError) {
                // 백엔드에서 404(Not Found)인 경우 무시 - 이미 삭제되었거나 존재하지 않음
                if (apiError.response?.status === 404) {
                    console.log('백엔드에 해당 거래가 없음 (로컬에서만 삭제):', id);
                } else {
                    console.warn('백엔드 삭제 실패 (로컬에서는 삭제됨):', apiError);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('거래 삭제 실패:', error);
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
    const refresh = async (userId = 1) => {
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
            addTransaction,
            removeTransaction,
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
