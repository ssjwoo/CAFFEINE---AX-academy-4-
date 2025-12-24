/**
 * Spending Analyzer Utility
 * 지출 내역 분석 유틸리티 함수들
 */

/**
 * 월별 거래 필터링
 * @param {Array} transactions - 전체 거래 목록
 * @param {Date} date - 기준 날짜 (기본값: 현재)
 * @returns {Array} 해당 월의 거래 목록
 */
export const filterMonthlyTransactions = (transactions, date = new Date()) => {
    const targetMonth = date.getMonth();
    const targetYear = date.getFullYear();

    return transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear;
    });
};

/**
 * 총 지출액 계산
 * @param {Array} transactions - 거래 목록
 * @returns {number} 총 지출액
 */
export const calculateTotalSpent = (transactions) => {
    return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

/**
 * 카테고리별 지출 분석
 * @param {Array} transactions - 거래 목록
 * @returns {Object} 카테고리별 { count, total } 객체
 */
export const analyzeCategoryBreakdown = (transactions) => {
    return transactions.reduce((acc, t) => {
        const category = t.category || '기타';
        if (!acc[category]) {
            acc[category] = { count: 0, total: 0 };
        }
        acc[category].count++;
        acc[category].total += Math.abs(t.amount);
        return acc;
    }, {});
};

/**
 * 최근 거래 요약 생성
 * @param {Array} transactions - 거래 목록
 * @param {number} limit - 최대 개수 (기본값: 5)
 * @returns {string} 거래 요약 문자열
 */
export const summarizeRecentTransactions = (transactions, limit = 5) => {
    return transactions
        .slice(0, limit)
        .map(t => `${t.merchant} ${Math.abs(t.amount).toLocaleString()}원 (${t.category || '기타'})`)
        .join(', ') || '없음';
};

/**
 * 전체 지출 분석 데이터 생성
 * @param {Array} transactions - 전체 거래 목록
 * @param {number} budget - 월 예산
 * @returns {Object} API 요청용 spending_history 객체
 */
export const buildSpendingHistory = (transactions, budget = 1000000) => {
    const monthlyTransactions = filterMonthlyTransactions(transactions);
    const totalSpent = calculateTotalSpent(monthlyTransactions);
    const categoryBreakdown = analyzeCategoryBreakdown(monthlyTransactions);
    const recentTransactions = summarizeRecentTransactions(monthlyTransactions);

    return {
        total: totalSpent,
        transaction_count: monthlyTransactions.length,
        category_breakdown: categoryBreakdown,
        recent_transactions: recentTransactions,
        budget_percentage: budget > 0 ? (totalSpent / budget * 100).toFixed(1) : 0,
        remaining_budget: Math.max(0, budget - totalSpent),
    };
};

/**
 * 재정 상태 판단
 * @param {number} totalSpent - 총 지출액
 * @param {number} budget - 예산
 * @returns {string} 재정 상태 ('여유' | '보통' | '위험' | '파산직전')
 */
export const getFinancialStatus = (totalSpent, budget) => {
    if (budget <= 0) return '보통';

    const percentage = (totalSpent / budget) * 100;

    if (percentage > 100) return '파산직전';
    if (percentage > 80) return '위험';
    if (percentage > 50) return '보통';
    return '여유';
};

/**
 * 카테고리별 TOP N 지출 추출
 * @param {Object} categoryBreakdown - 카테고리별 지출 객체
 * @param {number} limit - 최대 개수 (기본값: 3)
 * @returns {Array} TOP N 카테고리 [{ category, count, total }]
 */
export const getTopCategories = (categoryBreakdown, limit = 3) => {
    return Object.entries(categoryBreakdown)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
};
