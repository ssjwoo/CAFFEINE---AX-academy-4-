import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import CountUpNumber from '../components/CountUpNumber';
import FadeInView from '../components/FadeInView';
import AnimatedButton from '../components/AnimatedButton';
import EmptyState from '../components/EmptyState';
import { SkeletonStats, SkeletonChart } from '../components/SkeletonCard';
import { formatCurrency } from '../utils/currency';
import { CHART_COLORS, ANIMATION_DELAY } from '../constants';

// 통계 계산 함수들
const calculateSummary = (transactions) => {
    if (!transactions || transactions.length === 0) {
        return {
            total_spending: 0,
            total_transactions: 0,
            average_transaction: 0,
            most_used_category: '-',
            monthly_trend: '변화없음',
            anomaly_count: 0
        };
    }

    const total_spending = transactions.reduce((sum, t) => sum + t.amount, 0);
    const total_transactions = transactions.length;
    const average_transaction = Math.round(total_spending / total_transactions);

    // 가장 많이 쓴 카테고리
    const categoryCount = {};
    transactions.forEach(t => {
        categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const most_used_category = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return {
        total_spending,
        total_transactions,
        average_transaction,
        most_used_category,
        monthly_trend: '증가',
        anomaly_count: 0
    };
};

const calculateMonthlyData = (transactions) => {
    if (!transactions || transactions.length === 0) return [];

    const monthlyMap = {};

    transactions.forEach(t => {
        const month = t.date.substring(0, 7);  // '2024-11-29 10:00' → '2024-11'
        monthlyMap[month] = (monthlyMap[month] || 0) + t.amount;
    });

    // 최근 6개월만
    return Object.entries(monthlyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, total_amount]) => ({ month, total_amount }));
};

const calculateCategoryData = (transactions) => {
    if (!transactions || transactions.length === 0) return [];

    const categoryMap = {};
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    transactions.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryMap)
        .map(([category, total_amount]) => ({
            category,
            total_amount,
            percentage: Math.round((total_amount / total) * 100)
        }))
        .sort((a, b) => b.total_amount - a.total_amount);
};

export default function DashboardScreen({ navigation }) {
    const { colors } = useTheme();
    const { transactions, loading: transactionsLoading, predictNextPurchase } = useTransactions();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [tooltip, setTooltip] = useState(null);
    const [predictedTransaction, setPredictedTransaction] = useState(null);
    const [nextPrediction, setNextPrediction] = useState(null);
    const [couponReceived, setCouponReceived] = useState(false);

    const scrollViewRef = useRef(null);
    const categoryRef = useRef(null);
    const insightRef = useRef(null);

    const loadData = async () => {
        try {
            if (transactions && transactions.length > 0) {
                setSummary(calculateSummary(transactions));
                setMonthlyData(calculateMonthlyData(transactions));
                setCategoryData(calculateCategoryData(transactions));

                // 다음 소비 예측 자동 실행
                loadNextPrediction();
            } else {
                setSummary(null);
                setMonthlyData([]);
                setCategoryData([]);
                setNextPrediction(null);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadNextPrediction = async () => {
        const result = await predictNextPurchase();
        if (result.success && result.data) {
            setNextPrediction(result.data);
            console.log('다음 소비 예측:', result.data);
        } else {
            console.log('예측 실패:', result.error);
        }
    };


    // transactions가 변경될 때마다 데이터 재계산
    useEffect(() => {
        loadData();
    }, [transactions]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleTotalSpendingClick = () => {
        // 카테고리 섹션 제목이 완전히 보이도록 더 위로 조정
        scrollViewRef.current?.scrollTo({ y: 500, animated: true });
    };

    const handleTransactionCountClick = () => {
        navigation?.navigate('거래내역');
    };

    const handleAverageTransactionClick = () => {
        // 인사이트 섹션 제목이 완전히 보이도록 더 위로 조정
        scrollViewRef.current?.scrollTo({ y: 950, animated: true });
    };

    const handleGetCoupon = () => {
        if (couponReceived) {
            alert('이미 쿠폰을 받으셨습니다!');
            return;
        }
        setCouponReceived(true);
        alert(`쿠폰 발급 완료!\n\n${predictedTransaction?.merchant}에서 사용 가능한\n${formatCurrency(predictedTransaction?.couponDiscount)} 할인 쿠폰이 발급되었습니다!`);
    };

    const handlePredictionBannerClick = () => {
        alert(`AI 예측 상세\n\n다음 예상 구매:\n• 가맹점: ${predictedTransaction?.merchant}\n• 카테고리: ${predictedTransaction?.category}\n• 예상 금액: ${formatCurrency(predictedTransaction?.predictedAmount)}\n• 예측 시간: ${predictedTransaction?.predictedDate}\n• 신뢰도: ${predictedTransaction?.confidence}%\n\n💡 쿠폰을 받고 ${formatCurrency(predictedTransaction?.couponDiscount)} 할인받으세요!`);
    };

    if (loading) {
        return (
            <ScrollView style={styles(colors).container}>
                <View style={styles(colors).summarySection}>
                    <Text style={styles(colors).sectionTitle}> 이번 달 소비 요약</Text>
                    <SkeletonStats />
                    <SkeletonStats />
                    <SkeletonStats />
                </View>
                <View style={styles(colors).chartSection}>
                    <Text style={styles(colors).sectionTitle}> 월별 지출 추이</Text>
                    <SkeletonChart />
                </View>
                <View style={styles(colors).chartSection}>
                    <Text style={styles(colors).sectionTitle}> 카테고리별 소비</Text>
                    <SkeletonChart />
                </View>
            </ScrollView>
        );
    }

    // 거래 데이터가 없으면 EmptyState 표시
    if (transactions.length === 0) {
        return (
            <View style={styles(colors).container}>
                <View style={styles(colors).header}>
                    <Text style={styles(colors).headerTitle}>대시보드</Text>
                </View>
                <EmptyState
                    icon="📊"
                    title="연동된 거래내역이 없습니다"
                    message="프로필 → 데이터 동기화로 CSV 파일을 업로드하세요"
                    actionText="동기화 하러 가기"
                    onAction={() => navigation.navigate('프로필')}
                />
            </View>
        );
    }

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 40;

    const lineChartData = {
        labels: monthlyData.map(item => item.month.split('-')[1] + '월'),
        datasets: [{
            data: monthlyData.map(item => item.total_amount / 1000000),
            color: (opacity = 1) => colors.primary.replace('rgb', 'rgba').replace(')', `, ${opacity})`),
            strokeWidth: 2
        }]
    };

    const pieChartData = categoryData.map((item, index) => ({
        name: item.category,
        population: item.total_amount,
        color: CHART_COLORS[index % CHART_COLORS.length],
        legendFontColor: colors.text,
        legendFontSize: 12
    }));

    return (
        <ScrollView ref={scrollViewRef} style={styles(colors).container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

            {/* Banner Ad Section */}
            {predictedTransaction && (
                <FadeInView style={styles(colors).bannerAdSection} delay={ANIMATION_DELAY.NONE + 100}>
                    <TouchableOpacity
                        style={styles(colors).bannerAd}
                        activeOpacity={0.8}
                        onPress={handleGetCoupon}>
                        <View style={styles(colors).bannerAdHeader}>
                            <View style={styles(colors).brandLogo}>
                                <Text style={styles(colors).brandLogoText}>★</Text>
                            </View>
                            <Text style={styles(colors).brandName}>{predictedTransaction.merchant}</Text>
                            <View style={styles(colors).adBadge}>
                                <Text style={styles(colors).adBadgeText}>AD</Text>
                            </View>
                        </View>

                        <View style={styles(colors).bannerAdBody}>
                            <Text style={styles(colors).bannerAdHeadline}>
                                커피 한 잔의 여유, 특별한 할인까지
                            </Text>
                            <Text style={styles(colors).bannerAdSubtitle}>
                                AI가 예측한 당신의 다음 방문
                            </Text>

                            <View style={styles(colors).bannerAdOffer}>
                                <Text style={styles(colors).bannerAdOfferLabel}>특별 할인</Text>
                                <Text style={styles(colors).bannerAdOfferAmount}>
                                    {formatCurrency(predictedTransaction.couponDiscount)}
                                </Text>
                            </View>

                            <View style={styles(colors).bannerAdCTA}>
                                <Text style={styles(colors).bannerAdCTAText}>지금 바로 쿠폰받기 ›</Text>
                            </View>
                        </View>

                        <View style={styles(colors).bannerAdFooter}>
                            <Text style={styles(colors).bannerAdFooterText}>
                                예상 방문시간: {predictedTransaction.predictedDate}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </FadeInView>
            )}

            <FadeInView style={styles(colors).summarySection} delay={ANIMATION_DELAY.NONE}>
                <Text style={styles(colors).sectionTitle}> 이번 달 소비 요약</Text>
                <View style={styles(colors).summaryGrid}>
                    <AnimatedButton style={[styles(colors).summaryCard, styles(colors).mainCard]}
                        onPress={handleTotalSpendingClick}>
                        <Text style={styles(colors).summaryLabel}>총 지출</Text>
                        <CountUpNumber
                            value={summary?.total_spending || 0}
                            formatter={(num) => formatCurrency(num)}
                            style={styles(colors).summaryValueLarge}
                            duration={1200}
                        />
                        <Text style={styles(colors).summaryTrend}>
                            {summary?.monthly_trend === '증가' ? ' 지난달 대비 증가' : ' 지난달 대비 감소'}
                        </Text>
                        <Text style={styles(colors).clickHint}>탭하여 카테고리 보기</Text>
                    </AnimatedButton>

                    <AnimatedButton style={styles(colors).summaryCard}
                        onPress={handleTransactionCountClick}>
                        <Text style={styles(colors).summaryLabel}>거래 건수</Text>
                        <CountUpNumber
                            value={summary?.total_transactions || 0}
                            formatter={(num) => num + '건'}
                            style={styles(colors).summaryValue}
                            duration={1000}
                        />
                        <Text style={styles(colors).clickHint}>탭하여 거래내역 보기</Text>
                    </AnimatedButton>

                    <AnimatedButton style={styles(colors).summaryCard}
                        onPress={handleAverageTransactionClick}>
                        <Text style={styles(colors).summaryLabel}>평균 거래액</Text>
                        <CountUpNumber
                            value={summary?.average_transaction || 0}
                            formatter={(num) => formatCurrency(num)}
                            style={styles(colors).summaryValue}
                            duration={1000}
                        />
                        <Text style={styles(colors).clickHint}>탭하여 인사이트 보기</Text>
                    </AnimatedButton>
                </View>

                {summary?.anomaly_count > 0 && (
                    <TouchableOpacity style={styles(colors).alertCard}>
                        <Text style={styles(colors).alertIcon}>⚠️</Text>
                        <View style={styles(colors).alertContent}>
                            <Text style={styles(colors).alertTitle}>의심 거래 발견</Text>
                            <Text style={styles(colors).alertText}>{summary.anomaly_count}건의 이상 거래가 감지되었습니다.</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </FadeInView>

            <FadeInView style={styles(colors).chartSection} delay={ANIMATION_DELAY.MEDIUM}>
                <Text style={styles(colors).sectionTitle}> 월별 지출 추이</Text>
                <View>
                    <LineChart
                        data={lineChartData}
                        width={chartWidth}
                        height={220}
                        chartConfig={{
                            backgroundColor: colors.cardBackground,
                            backgroundGradientFrom: colors.cardBackground,
                            backgroundGradientTo: colors.cardBackground,
                            decimalPlaces: 1,
                            color: (opacity = 1) => colors.primary.replace('rgb', 'rgba').replace(')', `, ${opacity})`),
                            labelColor: (opacity = 1) => colors.text.replace('rgb', 'rgba').replace(')', `, ${opacity})`),
                            style: { borderRadius: 16 },
                            propsForDots: { r: '6', strokeWidth: '2', stroke: colors.primary }
                        }}
                        bezier
                        style={styles(colors).chart}
                        onDataPointClick={(data) => {
                            const amount = (data.value * 1000000).toFixed(0);
                            setTooltip({
                                x: data.x,
                                y: data.y,
                                value: formatCurrency(parseInt(amount)),
                                month: monthlyData[data.index]?.month.split('-')[1] + '월'
                            });
                            setTimeout(() => setTooltip(null), 3000);
                        }}
                    />
                    {tooltip && (
                        <View style={[styles(colors).tooltip, { left: tooltip.x - 40, top: tooltip.y - 50 }]}>
                            <Text style={styles(colors).tooltipMonth}>{tooltip.month}</Text>
                            <Text style={styles(colors).tooltipValue}>{tooltip.value}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles(colors).chartCaption}>단위: 백만원</Text>
            </FadeInView>

            <FadeInView ref={categoryRef} style={styles(colors).chartSection} delay={ANIMATION_DELAY.LONG}>
                <Text style={styles(colors).sectionTitle}> 카테고리별 소비</Text>

                <View style={styles(colors).progressCardContainer}>
                    {categoryData.map((item, index) => (
                        <FadeInView
                            key={index}
                            style={styles(colors).progressCard}
                            delay={ANIMATION_DELAY.LONG + (index * 100)}
                        >
                            <View style={styles(colors).progressCardHeader}>
                                <View style={styles(colors).progressCardLeft}>
                                    <View style={[styles(colors).categoryIcon, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]}>
                                        <Text style={styles(colors).categoryEmoji}>
                                            {index === 0 ? '' : index === 1 ? '' : index === 2 ? '' : index === 3 ? '' : index === 4 ? '' : ''}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles(colors).progressCardTitle}>{item.category}</Text>
                                        <Text style={styles(colors).progressCardAmount}>{formatCurrency(item.total_amount)}</Text>
                                    </View>
                                </View>
                                <View style={styles(colors).progressCardRight}>
                                    <Text style={styles(colors).progressCardPercentage}>{item.percentage}%</Text>
                                </View>
                            </View>

                            <View style={styles(colors).progressBarContainer}>
                                <View style={styles(colors).progressBarBackground}>
                                    <View
                                        style={[
                                            styles(colors).progressBarFill,
                                            {
                                                width: `${item.percentage}%`,
                                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        </FadeInView>
                    ))}
                </View>
            </FadeInView>

            <FadeInView ref={insightRef} style={styles(colors).insightSection} delay={ANIMATION_DELAY.VERY_LONG}>
                <Text style={styles(colors).sectionTitle}>AI 인사이트</Text>

                <View style={styles(colors).insightCard}>
                    <Text style={styles(colors).insightIcon}></Text>
                    <Text style={styles(colors).insightText}>
                        이번 달 <Text style={styles(colors).insightHighlight}>{summary?.most_used_category}</Text>에 가장 많이 지출했어요
                    </Text>
                </View>

                <View style={styles(colors).insightCard}>
                    <Text style={styles(colors).insightIcon}></Text>
                    <Text style={styles(colors).insightText}>
                        평균 거래액은 <Text style={styles(colors).insightHighlight}>{summary?.average_transaction.toLocaleString()}원</Text>으로,
                        지난 6개월 평균 대비 <Text style={styles(colors).insightHighlight}>12%</Text> 증가했어요
                    </Text>
                </View>

                {nextPrediction && (
                    <View style={styles(colors).predictionCard}>
                        <View style={styles(colors).predictionHeader}>
                            <Text style={styles(colors).predictionIcon}></Text>
                            <Text style={styles(colors).predictionTitle}>다음 소비 예측</Text>
                            <View style={styles(colors).predictionBadge}>
                                <Text style={styles(colors).predictionBadgeText}>
                                    {nextPrediction.confidence_metrics?.confidence_level === 'high' ? '높음' :
                                        nextPrediction.confidence_metrics?.confidence_level === 'medium' ? '중간' : '낮음'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles(colors).predictionContent}>
                            <View style={styles(colors).predictionRow}>
                                <Text style={styles(colors).predictionLabel}>예측 카테고리</Text>
                                <Text style={styles(colors).predictionValueAmount}>
                                    {nextPrediction.predicted_category}
                                </Text>
                            </View>

                            <View style={styles(colors).predictionRow}>
                                <Text style={styles(colors).predictionLabel}>신뢰도</Text>
                                <Text style={styles(colors).predictionValue}>
                                    {(nextPrediction.confidence * 100).toFixed(0)}%
                                </Text>
                            </View>

                            {nextPrediction.context?.last_category && (
                                <View style={styles(colors).predictionRow}>
                                    <Text style={styles(colors).predictionLabel}>마지막 소비</Text>
                                    <Text style={styles(colors).predictionValue}>
                                        {nextPrediction.context.last_category}
                                    </Text>
                                </View>
                            )}

                            {nextPrediction.context?.most_frequent_category && (
                                <View style={styles(colors).predictionRow}>
                                    <Text style={styles(colors).predictionLabel}>가장 많이 소비</Text>
                                    <Text style={styles(colors).predictionValue}>
                                        {nextPrediction.context.most_frequent_category}
                                    </Text>
                                </View>
                            )}

                            {nextPrediction.context?.user_avg_amount && (
                                <View style={styles(colors).predictionRow}>
                                    <Text style={styles(colors).predictionLabel}>평균 거래액</Text>
                                    <Text style={styles(colors).predictionValue}>
                                        {formatCurrency(Math.round(nextPrediction.context.user_avg_amount))}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {nextPrediction.probabilities && (
                            <View style={styles(colors).predictionFooter}>
                                <Text style={styles(colors).predictionCouponText}>
                                    확률 분포: {Object.entries(nextPrediction.probabilities)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                        .map(([cat, prob]) => `${cat} ${(prob * 100).toFixed(0)}%`)
                                        .join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </FadeInView>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    summarySection: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
    summaryGrid: { gap: 12 },
    summaryCard: { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    mainCard: { borderColor: colors.primary, borderWidth: 2 },
    summaryLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
    summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    summaryValueLarge: { fontSize: 32, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
    summaryTrend: { fontSize: 12, color: colors.textSecondary },
    clickHint: { fontSize: 11, color: colors.primary, marginTop: 8, opacity: 0.8 },
    alertCard: { marginTop: 16, backgroundColor: colors.warningBackground, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center' },
    alertIcon: { fontSize: 32, marginRight: 12 },
    alertContent: { flex: 1 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', color: colors.warning, marginBottom: 4 },
    alertText: { fontSize: 14, color: colors.text },
    chartSection: { padding: 20, backgroundColor: colors.cardBackground, marginBottom: 12 },
    chart: { marginVertical: 8, borderRadius: 16 },
    chartCaption: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
    categoryList: { marginTop: 16 },
    categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    categoryInfo: { flexDirection: 'row', alignItems: 'center' },
    categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    categoryName: { fontSize: 14, color: colors.text },
    categoryAmount: { alignItems: 'flex-end' },
    categoryValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    categoryPercent: { fontSize: 12, color: colors.textSecondary },
    insightSection: { padding: 20 },
    insightCard: { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    insightIcon: { fontSize: 32, marginRight: 16 },
    insightText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
    insightHighlight: { fontWeight: 'bold', color: colors.primary },

    // Progress Card styles
    progressCardContainer: { gap: 12 },
    progressCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    progressCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryEmoji: {
        fontSize: 20,
    },
    progressCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    progressCardAmount: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    progressCardRight: {
        marginLeft: 12,
    },
    progressCardPercentage: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    progressBarContainer: {
        marginTop: 4,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },

    // Tooltip styles
    tooltip: {
        position: 'absolute',
        backgroundColor: colors.primary,
        borderRadius: 6,
        padding: 8,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000
    },
    tooltipMonth: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 2
    },
    tooltipValue: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold'
    },
    tooltipPercent: {
        fontSize: 10,
        color: '#fff',
        opacity: 0.9,
        marginTop: 2
    },

    // Coupon Button styles
    couponSection: {
        padding: 16,
        paddingBottom: 0,
    },
    couponButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    couponButtonReceived: {
        backgroundColor: colors.success,
        opacity: 0.8,
    },
    couponIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    couponContent: {
        flex: 1,
    },
    couponTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    couponDesc: {
        fontSize: 13,
        color: '#fff',
        opacity: 0.9,
    },
    couponArrow: {
        fontSize: 28,
        color: '#fff',
        opacity: 0.8,
    },

    // Prediction Banner styles (at top)
    predictionBannerTop: {
        padding: 16,
        paddingBottom: 8,
    },
    predictionCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    predictionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    predictionIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    predictionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    predictionBadge: {
        backgroundColor: colors.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    predictionBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
    },
    predictionContent: {
        gap: 12,
        marginBottom: 16,
    },
    predictionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    predictionLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    predictionValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    predictionValueAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    predictionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    predictionCouponText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.warning,
        marginRight: 12,
    },
    predictionCouponButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    predictionCouponButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },

    // Banner Ad styles
    bannerAdSection: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 0,
    },
    bannerAd: {
        backgroundColor: '#00704A', // Starbucks green
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    bannerAdHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    brandLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    brandLogoText: {
        fontSize: 20,
        color: '#00704A',
    },
    brandName: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    adBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    bannerAdBody: {
        padding: 20,
    },
    bannerAdHeadline: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        lineHeight: 24,
    },
    bannerAdSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 16,
    },
    bannerAdOffer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    bannerAdOfferLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    bannerAdOfferAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    bannerAdCTA: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    bannerAdCTAText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#00704A',
    },
    bannerAdFooter: {
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        alignItems: 'center',
    },
    bannerAdFooterText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
    },
});
