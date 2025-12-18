import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import CountUpNumber from '../components/CountUpNumber';
import FadeInView from '../components/FadeInView';
import AnimatedButton from '../components/AnimatedButton';
import EmptyState from '../components/EmptyState';
import { SkeletonStats, SkeletonChart } from '../components/SkeletonCard';
import AddTransactionModal from '../components/AddTransactionModal';
import { formatCurrency } from '../utils/currency';
import { CHART_COLORS, ANIMATION_DELAY } from '../constants';

// ============================================================
// 카테고리별 아이콘 매핑 (Feather icons)
// ============================================================
const CATEGORY_ICON = {
    '쇼핑': { icon: 'shopping-bag', color: '#EC4899' },
    '식비': { icon: 'coffee', color: '#F59E0B' },
    '공과금': { icon: 'zap', color: '#8B5CF6' },
    '여가': { icon: 'music', color: '#10B981' },
    '교통': { icon: 'truck', color: '#3B82F6' },
    '기타': { icon: 'box', color: '#6B7280' },
    '카페': { icon: 'coffee', color: '#92400E' },
    '편의점': { icon: 'package', color: '#059669' },
    '마트': { icon: 'shopping-cart', color: '#DC2626' },
    '의료': { icon: 'heart', color: '#EF4444' },
};

// 이모지 폴백 (아이콘 없을 때)
const CATEGORY_EMOJI = {
    '쇼핑': '🛍️',
    '식비': '🍔',
    '공과금': '💡',
    '여가': '🎮',
    '교통': '🚗',
    '기타': '📦',
    '카페': '☕',
    '편의점': '🏪',
    '마트': '🛒',
    '의료': '🏥',
};

export default function DashboardScreen({ navigation }) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { transactions, loading: transactionLoading, refresh } = useTransactions();
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [tooltip, setTooltip] = useState(null);
    const [predictedTransaction, setPredictedTransaction] = useState(null);
    const [couponReceived, setCouponReceived] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const scrollViewRef = useRef(null);

    // 거래 데이터로부터 대시보드 요약 계산
    const calculateSummary = (txns) => {
        if (!txns || txns.length === 0) return null;

        const totalSpending = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const avgTransaction = totalSpending / txns.length;

        // 카테고리별 집계
        const categoryMap = {};
        txns.forEach(t => {
            const cat = t.category || '기타';
            if (!categoryMap[cat]) categoryMap[cat] = 0;
            categoryMap[cat] += Math.abs(t.amount);
        });

        const sortedCategories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1]);
        const mostUsedCategory = sortedCategories[0]?.[0] || '기타';
        const mostUsedCategoryAmount = sortedCategories[0]?.[1] || 0;
        const mostUsedCategoryPercent = Math.round((mostUsedCategoryAmount / totalSpending) * 100);

        // 가장 비싼 거래 찾기
        const maxTransaction = txns.reduce((max, t) =>
            Math.abs(t.amount) > Math.abs(max.amount) ? t : max, txns[0]);

        // 자주 가는 가맹점 찾기
        const merchantMap = {};
        txns.forEach(t => {
            const merchant = t.merchant || t.description || '알 수 없음';
            if (!merchantMap[merchant]) merchantMap[merchant] = 0;
            merchantMap[merchant]++;
        });
        const sortedMerchants = Object.entries(merchantMap)
            .sort((a, b) => b[1] - a[1]);
        const frequentMerchant = sortedMerchants[0]?.[0] || '알 수 없음';
        const frequentMerchantCount = sortedMerchants[0]?.[1] || 0;

        return {
            total_spending: totalSpending,
            total_transactions: txns.length,
            average_transaction: Math.round(avgTransaction),
            most_used_category: mostUsedCategory,
            most_used_category_percent: mostUsedCategoryPercent,
            max_transaction: maxTransaction,
            frequent_merchant: frequentMerchant,
            frequent_merchant_count: frequentMerchantCount,
            monthly_trend: '증가',
            anomaly_count: 0
        };
    };

    // 카테고리 데이터 계산
    const calculateCategoryData = (txns) => {
        if (!txns || txns.length === 0) return [];

        const categoryMap = {};
        let total = 0;

        txns.forEach(t => {
            const cat = t.category || '기타';
            if (!categoryMap[cat]) categoryMap[cat] = 0;
            categoryMap[cat] += Math.abs(t.amount);
            total += Math.abs(t.amount);
        });

        return Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([category, amount]) => ({
                category,
                total_amount: amount,
                percentage: Math.round((amount / total) * 100),
                emoji: CATEGORY_EMOJI[category] || '📦'
            }));
    };

    // 월별 데이터 계산
    const calculateMonthlyData = (txns) => {
        if (!txns || txns.length === 0) return [];

        const monthlyMap = {};
        txns.forEach(t => {
            let date = t.date?.split(' ')[0] || t.date || '';

            // 다양한 날짜 형식 처리
            let month = null;

            // YYYY-MM-DD 형식
            if (date.match(/^\d{4}-\d{2}/)) {
                month = date.substring(0, 7);
            }
            // YYYY.MM.DD 형식
            else if (date.match(/^\d{4}\.\d{2}/)) {
                month = date.substring(0, 7).replace('.', '-');
            }
            // DD/MM/YYYY 또는 MM/DD/YYYY 형식
            else if (date.includes('/')) {
                const parts = date.split('/');
                if (parts.length >= 3) {
                    // 마지막이 4자리면 년도로 가정
                    if (parts[2]?.length === 4) {
                        month = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                    }
                }
            }

            if (month && month.length >= 7) {
                if (!monthlyMap[month]) monthlyMap[month] = 0;
                monthlyMap[month] += Math.abs(t.amount);
            }
        });

        const sortedData = Object.entries(monthlyMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6)
            .map(([month, amount]) => ({ month, total_amount: amount }));

        // 최소 3개월 데이터 보장 (그래프 가독성 향상)
        if (sortedData.length < 3) {
            const now = new Date();
            const months = [];
            
            // 최근 6개월 생성
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.push(monthStr);
            }
            
            // 기존 데이터를 맵으로 변환
            const existingMap = {};
            sortedData.forEach(item => {
                existingMap[item.month] = item.total_amount;
            });
            
            // 6개월 데이터 생성 (없으면 0)
            return months.map(month => ({
                month,
                total_amount: existingMap[month] || 0
            }));
        }

        return sortedData;
    };

    useEffect(() => {
        if (transactions && transactions.length > 0) {
            setSummary(calculateSummary(transactions));
            setCategoryData(calculateCategoryData(transactions));
            setMonthlyData(calculateMonthlyData(transactions));
        }
    }, [transactions]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    const handleGetCoupon = async () => {
        if (couponReceived) {
            alert('이미 쿠폰을 받으셨습니다!');
            return;
        }
        
        try {
            // API 호출하여 쿠폰 발급
            const { issueCoupon } = await import('../api/coupons');
            const result = await issueCoupon(
                predictedTransaction?.merchant,
                predictedTransaction?.couponDiscount
            );
            
            if (result.success) {
                setCouponReceived(true);
                alert(`쿠폰 발급 완료!\n\n${predictedTransaction?.merchant}에서 사용 가능한\n${formatCurrency(predictedTransaction?.couponDiscount)} 할인 쿠폰이 발급되었습니다!`);
            }
        } catch (error) {
            console.error('쿠폰 발급 오류:', error);
            // 중복 발급 등 에러 처리
            const message = error.response?.data?.detail || '쿠폰 발급에 실패했습니다.';
            alert(message);
        }
    };

    // 로딩 중
    if (transactionLoading) {
        return (
            <LinearGradient colors={colors.screenGradient} style={styles.gradientContainer}>
                <ScrollView style={styles.container}>
                    <View style={styles.summarySection}>
                        <SkeletonStats />
                        <SkeletonStats />
                        <SkeletonStats />
                    </View>
                </ScrollView>
            </LinearGradient>
        );
    }

    // 거래 데이터가 없을 때 Empty State
    if (!transactions || transactions.length === 0) {
        return (
            <EmptyState
                icon="📊"
                title="연동된 거래내역이 없습니다"
                description="프로필에서 데이터를 동기화하여\n소비 분석을 시작하세요"
                actionText="동기화 하러 가기"
                onAction={() => navigation?.navigate('프로필')}
            />
        );
    }

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 72;

    // 월별 라벨 안전하게 생성
    const getMonthLabel = (monthStr) => {
        if (!monthStr || typeof monthStr !== 'string') return '?월';
        const parts = monthStr.split('-');
        if (parts.length >= 2 && parts[1]) {
            return parseInt(parts[1], 10) + '월';
        }
        return '?월';
    };

    // 월별 데이터가 있을 때만 차트 데이터 생성
    const lineChartData = (monthlyData && monthlyData.length > 0) ? {
        labels: monthlyData.map(item => getMonthLabel(item.month)),
        datasets: [{
            data: monthlyData.map(item => (item.total_amount || 0) / 10000),
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 3
        }]
    } : null;

    return (
        <LinearGradient
            colors={colors.screenGradient}
            style={styles.gradientContainer}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tabBarActive} />}
            >
                {/* Header */}
                <FadeInView style={styles.header} delay={0}>
                    <View>
                        <Text style={[styles.userName, { color: colors.text }]}>{user?.name || '사용자'}님의 소비현황</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => navigation?.navigate('프로필')}
                        >
                            <LinearGradient
                                colors={['#3B82F6', '#2563EB']}
                                style={styles.profileButtonGradient}
                            >
                                <Feather name="user" size={20} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => navigation?.navigate('설정')}
                        >
                            <View style={styles.settingsButtonInner}>
                                <Feather name="settings" size={20} color="#3B82F6" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                {/* Main Balance Card */}
                <FadeInView style={styles.mainCardContainer} delay={100}>
                    <LinearGradient
                        colors={['#2563EB', '#1D4ED8', '#1E40AF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mainCard}
                    >
                        <View style={styles.mainCardHeader}>
                            <Text style={styles.mainCardLabel}>이번 달 총 지출</Text>
                            <View style={styles.trendBadge}>
                                <Text style={styles.trendBadgeText}>
                                    {summary?.monthly_trend === '증가' ? '↑ 증가' : '↓ 감소'}
                                </Text>
                            </View>
                        </View>
                        <CountUpNumber
                            value={summary?.total_spending || 0}
                            formatter={(num) => formatCurrency(num)}
                            style={styles.mainCardAmount}
                            duration={1200}
                        />
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>거래 건수</Text>
                                <Text style={styles.statValue}>{summary?.total_transactions || 0}건</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>평균 거래액</Text>
                                <Text style={styles.statValue}>{formatCurrency(summary?.average_transaction || 0)}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </FadeInView>

                {/* AI Insights - 최상단으로 이동 */}
                <FadeInView style={styles.section} delay={150}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>AI 인사이트</Text>
                    </View>
                    <View style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.insightRow}>
                            <View style={[styles.insightIconContainer, { backgroundColor: '#FEF3C7' }]}>
                                <Feather name="zap" size={18} color="#F59E0B" />
                            </View>
                            <Text style={[styles.insightText, { color: colors.text }]}>
                                이번 달 <Text style={styles.insightHighlight}>{summary?.most_used_category}</Text>에 가장 많이 지출했어요 ({summary?.most_used_category_percent || 0}%)
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.insightRow}>
                            <View style={[styles.insightIconContainer, { backgroundColor: '#DBEAFE' }]}>
                                <Feather name="map-pin" size={18} color="#2563EB" />
                            </View>
                            <Text style={[styles.insightText, { color: colors.text }]}>
                                <Text style={styles.insightHighlight}>{summary?.frequent_merchant}</Text>에 {summary?.frequent_merchant_count || 0}번 방문했어요
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.insightRow}>
                            <View style={[styles.insightIconContainer, { backgroundColor: '#FCE7F3' }]}>
                                <Feather name="credit-card" size={18} color="#DB2777" />
                            </View>
                            <Text style={[styles.insightText, { color: colors.text }]}>
                                가장 큰 지출은 <Text style={styles.insightHighlight}>{summary?.max_transaction?.merchant || '알 수 없음'}</Text>에서 {formatCurrency(Math.abs(summary?.max_transaction?.amount || 0))}
                            </Text>
                        </View>
                    </View>
                </FadeInView>

                {/* AI Prediction Banner */}
                {predictedTransaction && (
                    <FadeInView style={styles.predictionBanner} delay={200}>
                        <TouchableOpacity
                            style={styles.predictionCard}
                            activeOpacity={0.8}
                            onPress={handleGetCoupon}
                        >
                            <View style={styles.predictionLeft}>
                                <View style={styles.aiIcon}>
                                    <Feather name="cpu" size={20} color="#6366F1" />
                                </View>
                                <View style={styles.predictionInfo}>
                                    <Text style={styles.predictionTitle}>AI 예측 쿠폰</Text>
                                    <Text style={styles.predictionDesc}>
                                        {predictedTransaction.merchant}에서 {formatCurrency(predictedTransaction.couponDiscount)} 할인
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.couponBadge}>
                                <Text style={styles.couponBadgeText}>{couponReceived ? '완료' : '받기'}</Text>
                            </View>
                        </TouchableOpacity>
                    </FadeInView>
                )}

                {/* Quick Actions */}
                <FadeInView style={styles.quickActions} delay={300}>
                    <TouchableOpacity
                        style={styles.quickActionItem}
                        onPress={() => navigation?.navigate('거래내역')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                            <Feather name="file-text" size={24} color="#2563EB" />
                        </View>
                        <Text style={[styles.quickActionLabel, { color: colors.text }]}>거래내역</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionItem}
                        onPress={() => navigation?.navigate('쿠폰함')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Feather name="gift" size={24} color="#D97706" />
                        </View>
                        <Text style={[styles.quickActionLabel, { color: colors.text }]}>쿠폰함</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionItem}
                        onPress={() => navigation?.navigate('분석')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Feather name="bar-chart-2" size={24} color="#059669" />
                        </View>
                        <Text style={[styles.quickActionLabel, { color: colors.text }]}>분석</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionItem}
                        onPress={() => navigation?.navigate('더보기', { openChat: true })}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                            <Feather name="message-circle" size={24} color="#6366F1" />
                        </View>
                        <Text style={[styles.quickActionLabel, { color: colors.text }]}>잠깐만</Text>
                    </TouchableOpacity>
                </FadeInView>

                {/* Anomaly Alert - 의심스러운 거래 발견 */}
                <FadeInView style={styles.alertContainer} delay={350}>
                    <TouchableOpacity
                        style={styles.alertCard}
                        onPress={() => navigation?.navigate('거래내역')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.alertIconContainer}>
                            <Feather name="alert-circle" size={22} color="#FFFFFF" />
                        </View>
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>의심스러운 거래 발견</Text>
                            <Text style={styles.alertDesc}>{summary?.anomaly_count || 3}건의 이상 거래가 감지되었습니다.</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </FadeInView>

                {/* Monthly Chart Section */}
                <FadeInView style={styles.section} delay={400}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>월별 지출 추이</Text>
                        <TouchableOpacity onPress={() => navigation?.navigate('분석')}>
                            <Text style={styles.sectionMore}>더보기</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
                        {lineChartData ? (
                            <>
                                <LineChart
                                    data={lineChartData}
                                    width={chartWidth}
                                    height={200}
                                    chartConfig={{
                                        backgroundColor: colors.cardBackground,
                                        backgroundGradientFrom: colors.cardBackground,
                                        backgroundGradientTo: colors.cardBackground,
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                                        labelColor: (opacity = 1) => colors.textSecondary,
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: '5', strokeWidth: '2', stroke: '#2563EB' },
                                        propsForBackgroundLines: {
                                            strokeDasharray: '',
                                            stroke: '#E5E7EB',
                                            strokeWidth: 1,
                                        }
                                    }}
                                    bezier
                                    style={styles.chart}
                                    withInnerLines={true}
                                    withOuterLines={false}
                                    withVerticalLines={false}
                                    onDataPointClick={(data) => {
                                        const amount = (data.value * 10000).toFixed(0);
                                        const monthLabel = getMonthLabel(monthlyData[data.index]?.month);
                                        setTooltip({
                                            x: data.x,
                                            y: data.y,
                                            value: formatCurrency(parseInt(amount)),
                                            month: monthLabel
                                        });
                                        setTimeout(() => setTooltip(null), 3000);
                                    }}
                                />
                                {tooltip && (
                                    <View style={[styles.tooltip, { left: tooltip.x - 40, top: tooltip.y - 50 }]}>
                                        <Text style={styles.tooltipMonth}>{tooltip.month}</Text>
                                        <Text style={styles.tooltipValue}>{tooltip.value}</Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>차트 데이터 준비 중...</Text>
                            </View>
                        )}
                        <Text style={[styles.chartCaption, { color: colors.textSecondary }]}>단위: 만원</Text>
                    </View>
                </FadeInView>

                {/* Category Section */}
                <FadeInView style={styles.section} delay={500}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>카테고리별 소비</Text>
                        <TouchableOpacity onPress={() => navigation?.navigate('분석')}>
                            <Text style={styles.sectionMore}>더보기</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.categoryGrid}>
                        {categoryData.slice(0, 4).map((item, index) => {
                            const iconData = CATEGORY_ICON[item.category] || { icon: 'box', color: CHART_COLORS[index] };
                            return (
                                <TouchableOpacity key={index} style={[styles.categoryCard, { backgroundColor: colors.cardBackground }]}>
                                    <View style={[styles.categoryIconContainer, { backgroundColor: iconData.color + '15' }]}>
                                        <Feather name={iconData.icon} size={22} color={iconData.color} />
                                    </View>
                                    <Text style={[styles.categoryName, { color: colors.text }]}>{item.category}</Text>
                                    <Text style={[styles.categoryAmount, { color: colors.text }]}>{formatCurrency(item.total_amount)}</Text>
                                    <View style={[styles.categoryProgress, { backgroundColor: colors.border }]}>
                                        <View style={[styles.categoryProgressBar, { width: `${item.percentage}%`, backgroundColor: iconData.color }]} />
                                    </View>
                                    <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>{item.percentage}%</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </FadeInView>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action Button - 소비 추가 */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fabGradient}
                >
                    <Feather name="plus" size={28} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>

            {/* 소비 추가 모달 */}
            <AddTransactionModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    refresh();  // 데이터 새로고침
                }}
            />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    greeting: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'Inter_400Regular',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'Inter_700Bold',
        marginTop: 4,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    profileButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileEmoji: {
        fontSize: 22,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
    },
    settingsButtonInner: {
        width: '100%',
        height: '100%',
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#93C5FD',
    },

    // Main Card
    mainCardContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    mainCard: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    mainCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    mainCardLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontWeight: '600',
    },
    trendBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    trendBadgeText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    mainCardAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderRadius: 16,
        padding: 18,
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 6,
        fontFamily: 'Inter_600SemiBold',
        fontWeight: '600',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 16,
    },

    // Prediction Banner
    predictionBanner: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    predictionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    predictionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    aiIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    aiIconText: {
        fontSize: 24,
    },
    predictionInfo: {
        flex: 1,
    },
    predictionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    predictionDesc: {
        fontSize: 13,
        color: '#6B7280',
    },
    couponBadge: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    couponBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Quick Actions
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    quickActionItem: {
        alignItems: 'center',
        flex: 1,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    quickActionEmoji: {
        fontSize: 26,
    },
    quickActionLabel: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
    },

    // Alert
    alertContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    alertIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    alertEmoji: {
        fontSize: 28,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#991B1B',
        marginBottom: 2,
    },
    alertDesc: {
        fontSize: 13,
        color: '#DC2626',
    },
    alertArrow: {
        fontSize: 24,
        color: '#EF4444',
    },

    // Section
    section: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'Inter_700Bold',
    },
    sectionMore: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },

    // Chart
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    chartCaption: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 8,
    },

    // Tooltip
    tooltip: {
        position: 'absolute',
        backgroundColor: '#2563EB',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    tooltipMonth: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 2,
    },
    tooltipValue: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    // Category Grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        width: (Dimensions.get('window').width - 60) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryEmoji: {
        fontSize: 22,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    categoryProgress: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    categoryProgressBar: {
        height: '100%',
        borderRadius: 3,
    },
    categoryPercent: {
        fontSize: 12,
        color: '#6B7280',
    },

    // Insight
    insightCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    insightIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    insightText: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    insightHighlight: {
        fontWeight: '700',
        color: '#2563EB',
    },

    // Floating Action Button
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 100,
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
