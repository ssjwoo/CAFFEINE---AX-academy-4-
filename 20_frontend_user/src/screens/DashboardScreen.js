import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import CountUpNumber from '../components/CountUpNumber';
import FadeInView from '../components/FadeInView';
import AnimatedButton from '../components/AnimatedButton';
import { SkeletonStats, SkeletonChart } from '../components/SkeletonCard';
import { formatCurrency } from '../utils/currency';
import { CHART_COLORS, ANIMATION_DELAY } from '../constants';

// ============================================================
// TODO: 백엔드 연결 시 삭제 필요
// ============================================================
// 현재는 MOCK 데이터를 사용하고 있습니다.
// 백엔드 API 연결 시 이 MOCK_DATA 전체를 삭제하고
// loadData() 함수에서 실제 API를 호출하도록 변경하세요.
//
// 백엔드 API 엔드포인트 예시:
// - GET /api/dashboard/summary - 대시보드 요약 데이터
// - GET /api/dashboard/monthly - 월별 지출 데이터
// - GET /api/dashboard/category - 카테고리별 소비 데이터
// - GET /api/predictions/next - AI 예측 거래 데이터
// ============================================================
const MOCK_DATA = {
    summary: { total_spending: 1250000, total_transactions: 81, average_transaction: 15432, most_used_category: '쇼핑', monthly_trend: '증가', anomaly_count: 3 },
    monthlyData: [
        { month: '2024-06', total_amount: 577000 },
        { month: '2024-07', total_amount: 638000 },
        { month: '2024-08', total_amount: 705200 },
        { month: '2024-09', total_amount: 633800 },
        { month: '2024-10', total_amount: 761200 },
        { month: '2024-11', total_amount: 185000 },
    ],
    categoryData: [
        { category: '쇼핑', total_amount: 1140000, percentage: 37 },
        { category: '식비', total_amount: 890000, percentage: 29 },
        { category: '공과금', total_amount: 590000, percentage: 19 },
        { category: '여가', total_amount: 280000, percentage: 9 },
        { category: '교통', total_amount: 125000, percentage: 4 },
        { category: '기타', total_amount: 75000, percentage: 2 },
    ],
    predictedTransaction: {
        category: '식비',
        merchant: '이디야',
        predictedAmount: 15000,
        couponDiscount: 2000,
        confidence: 85,
        predictedDate: '내일 오전'
    }
};

export default function DashboardScreen({ navigation }) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [tooltip, setTooltip] = useState(null);
    const [predictedTransaction, setPredictedTransaction] = useState(null);
    const [couponReceived, setCouponReceived] = useState(false);

    const scrollViewRef = useRef(null);
    const categoryRef = useRef(null);
    const insightRef = useRef(null);

    // ============================================================
    // TODO: 백엔드 API 연결
    // ============================================================
    // 백엔드 서버와 연결 시 아래 loadData() 함수를 수정하세요.
    //
    // 변경 방법:
    // 1. API Base URL 설정 (예: const API_BASE_URL = 'http://localhost:5000/api')
    // 2. MOCK_DATA 대신 실제 fetch/axios 호출로 변경
    // 3. 에러 처리 추가
    //
    // 예시 코드:
    // const loadData = async () => {
    //     try {
    //         const token = await AsyncStorage.getItem('authToken');
    //         const headers = { 'Authorization': `Bearer ${token}` };
    //
    //         // 대시보드 요약 데이터
    //         const summaryRes = await fetch(`${API_BASE_URL}/dashboard/summary`, { headers });
    //         const summaryData = await summaryRes.json();
    //         setSummary(summaryData);
    //
    //         // 월별 지출 데이터
    //         const monthlyRes = await fetch(`${API_BASE_URL}/dashboard/monthly`, { headers });
    //         const monthlyDataRaw = await monthlyRes.json();
    //         // ⚠️ 날짜 형식 변환: '2024-06-01' → '2024-06'
    //         const monthlyData = monthlyDataRaw.map(item => ({
    //             month: item.month.substring(0, 7),
    //             total_amount: item.total_amount
    //         }));
    //         setMonthlyData(monthlyData);
    //
    //         // 카테고리별 소비 데이터
    //         const categoryRes = await fetch(`${API_BASE_URL}/dashboard/category`, { headers });
    //         const categoryData = await categoryRes.json();
    //         setCategoryData(categoryData);
    //
    //         // AI 예측 거래 데이터 (ML 모델 결과)
    //         const predictionRes = await fetch(`${API_BASE_URL}/predictions/next`, { headers });
    //         const predictionData = await predictionRes.json();
    //         setPredictedTransaction(predictionData);
    //
    //     } catch (error) {
    //         console.error('데이터 로드 실패:', error);
    //         alert('데이터를 불러오는데 실패했습니다.');
    //     } finally {
    //         setLoading(false);
    //         setRefreshing(false);
    //     }
    // };
    // ============================================================
    const loadData = async () => {
        try {
            // 현재는 MOCK 데이터 사용 (백엔드 연결 시 위의 예시 코드로 교체)
            setSummary(MOCK_DATA.summary);
            setMonthlyData(MOCK_DATA.monthlyData);
            setCategoryData(MOCK_DATA.categoryData);
            setPredictedTransaction(MOCK_DATA.predictedTransaction);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadData(); }, []);

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
                <Text style={styles(colors).sectionTitle}> AI 인사이트</Text>

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
