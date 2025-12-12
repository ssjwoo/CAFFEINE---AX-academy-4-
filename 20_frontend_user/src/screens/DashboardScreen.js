import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import CountUpNumber from '../components/CountUpNumber';
import FadeInView from '../components/FadeInView';
import AnimatedButton from '../components/AnimatedButton';
import EmptyState from '../components/EmptyState';
import { SkeletonStats, SkeletonChart } from '../components/SkeletonCard';
import { formatCurrency } from '../utils/currency';
import { CHART_COLORS, ANIMATION_DELAY } from '../constants';

// ============================================================
// 카테고리별 이모지 매핑
// ============================================================
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
    const { transactions, loading: transactionLoading, refresh } = useTransactions();
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [tooltip, setTooltip] = useState(null);
    const [predictedTransaction, setPredictedTransaction] = useState(null);
    const [couponReceived, setCouponReceived] = useState(false);

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

        return {
            total_spending: totalSpending,
            total_transactions: txns.length,
            average_transaction: Math.round(avgTransaction),
            most_used_category: mostUsedCategory,
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

        // 데이터가 없으면 현재 월 기본값 반환
        if (sortedData.length === 0) {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            return [{ month: currentMonth, total_amount: 0 }];
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

    const handleGetCoupon = () => {
        if (couponReceived) {
            alert('이미 쿠폰을 받으셨습니다!');
            return;
        }
        setCouponReceived(true);
        alert(`쿠폰 발급 완료!\n\n${predictedTransaction?.merchant}에서 사용 가능한\n${formatCurrency(predictedTransaction?.couponDiscount)} 할인 쿠폰이 발급되었습니다!`);
    };

    // 로딩 중
    if (transactionLoading) {
        return (
            <LinearGradient colors={['#DBEAFE', '#EFF6FF', '#F8FAFC']} style={styles.gradientContainer}>
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
    const chartWidth = screenWidth - 48;

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
            colors={['#DBEAFE', '#EFF6FF', '#F8FAFC']}
            style={styles.gradientContainer}
        >
            <ScrollView 
                ref={scrollViewRef} 
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
            >
                {/* Header */}
                <FadeInView style={styles.header} delay={0}>
                    <View>
                        <Text style={styles.greeting}>안녕하세요 👋</Text>
                        <Text style={styles.userName}>사용자님의 소비현황</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <Text style={styles.profileEmoji}>👤</Text>
                    </TouchableOpacity>
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
                        <View style={styles.mainCardStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>거래 건수</Text>
                                <Text style={styles.statValue}>{summary?.total_transactions}건</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>평균 거래액</Text>
                                <Text style={styles.statValue}>{formatCurrency(summary?.average_transaction)}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </FadeInView>

                {/* AI Prediction Banner */}
                {predictedTransaction && (
                    <FadeInView style={styles.predictionBanner} delay={200}>
                        <TouchableOpacity 
                            style={styles.predictionCard}
                            activeOpacity={0.9}
                            onPress={handleGetCoupon}
                        >
                            <View style={styles.predictionLeft}>
                                <View style={styles.aiIcon}>
                                    <Text style={styles.aiIconText}>🤖</Text>
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
                            <Text style={styles.quickActionEmoji}>📋</Text>
                        </View>
                        <Text style={styles.quickActionLabel}>거래내역</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.quickActionItem}
                        onPress={() => navigation?.navigate('쿠폰함')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={styles.quickActionEmoji}>🎫</Text>
                        </View>
                        <Text style={styles.quickActionLabel}>쿠폰함</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionItem}>
                        <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Text style={styles.quickActionEmoji}>📊</Text>
                        </View>
                        <Text style={styles.quickActionLabel}>분석</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionItem}>
                        <View style={[styles.quickActionIcon, { backgroundColor: '#FCE7F3' }]}>
                            <Text style={styles.quickActionEmoji}>⚙️</Text>
                        </View>
                        <Text style={styles.quickActionLabel}>설정</Text>
                    </TouchableOpacity>
                </FadeInView>

                {/* Anomaly Alert */}
                {summary?.anomaly_count > 0 && (
                    <FadeInView style={styles.alertContainer} delay={350}>
                        <TouchableOpacity style={styles.alertCard}>
                            <View style={styles.alertIconContainer}>
                                <Text style={styles.alertEmoji}>⚠️</Text>
                            </View>
                            <View style={styles.alertContent}>
                                <Text style={styles.alertTitle}>의심 거래 {summary.anomaly_count}건 감지</Text>
                                <Text style={styles.alertDesc}>탭하여 확인하기</Text>
                            </View>
                            <Text style={styles.alertArrow}>›</Text>
                        </TouchableOpacity>
                    </FadeInView>
                )}

                {/* Monthly Chart Section */}
                <FadeInView style={styles.section} delay={400}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>월별 지출 추이</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionMore}>더보기</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.chartCard}>
                        {lineChartData ? (
                            <>
                                <LineChart
                                    data={lineChartData}
                                    width={chartWidth}
                                    height={200}
                                    chartConfig={{
                                        backgroundColor: '#FFFFFF',
                                        backgroundGradientFrom: '#FFFFFF',
                                        backgroundGradientTo: '#FFFFFF',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
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
                                <Text style={{ color: '#6B7280', fontSize: 14 }}>차트 데이터 준비 중...</Text>
                            </View>
                        )}
                        <Text style={styles.chartCaption}>단위: 만원</Text>
                    </View>
                </FadeInView>

                {/* Category Section */}
                <FadeInView style={styles.section} delay={500}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>카테고리별 소비</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionMore}>더보기</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.categoryGrid}>
                        {categoryData.slice(0, 4).map((item, index) => (
                            <TouchableOpacity key={index} style={styles.categoryCard}>
                                <View style={[styles.categoryIconContainer, { backgroundColor: CHART_COLORS[index] + '20' }]}>
                                    <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                                </View>
                                <Text style={styles.categoryName}>{item.category}</Text>
                                <Text style={styles.categoryAmount}>{formatCurrency(item.total_amount)}</Text>
                                <View style={styles.categoryProgress}>
                                    <View style={[styles.categoryProgressBar, { width: `${item.percentage}%`, backgroundColor: CHART_COLORS[index] }]} />
                                </View>
                                <Text style={styles.categoryPercent}>{item.percentage}%</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </FadeInView>

                {/* AI Insights */}
                <FadeInView style={styles.section} delay={600}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>AI 인사이트</Text>
                    </View>
                    <View style={styles.insightCard}>
                        <View style={styles.insightRow}>
                            <Text style={styles.insightEmoji}>💡</Text>
                            <Text style={styles.insightText}>
                                이번 달 <Text style={styles.insightHighlight}>{summary?.most_used_category}</Text>에 가장 많이 지출했어요
                            </Text>
                        </View>
                    </View>
                    <View style={styles.insightCard}>
                        <View style={styles.insightRow}>
                            <Text style={styles.insightEmoji}>📈</Text>
                            <Text style={styles.insightText}>
                                평균 거래액이 지난달 대비 <Text style={styles.insightHighlight}>12%</Text> 증가했어요
                            </Text>
                        </View>
                    </View>
                </FadeInView>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileEmoji: {
        fontSize: 24,
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
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Inter_400Regular',
    },
    trendBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendBadgeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    mainCardAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        marginBottom: 20,
    },
    mainCardStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
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
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionEmoji: {
        fontSize: 24,
    },
    quickActionLabel: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },

    // Alert
    alertContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    alertIconContainer: {
        marginRight: 12,
    },
    alertEmoji: {
        fontSize: 28,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 2,
    },
    alertDesc: {
        fontSize: 12,
        color: '#B45309',
    },
    alertArrow: {
        fontSize: 24,
        color: '#B45309',
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
    insightEmoji: {
        fontSize: 24,
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
});
