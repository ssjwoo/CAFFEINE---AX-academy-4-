import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import { formatCurrency } from '../utils/currency';
import FadeInView from '../components/FadeInView';

const { width } = Dimensions.get('window');

// 카테고리별 색상
const CATEGORY_COLORS = {
    '쇼핑': '#EC4899',
    '식비': '#F59E0B',
    '공과금': '#8B5CF6',
    '여가': '#10B981',
    '교통': '#3B82F6',
    '기타': '#6B7280',
    '카페': '#92400E',
    '편의점': '#059669',
    '마트': '#DC2626',
    '의료': '#EF4444',
};

export default function AnalysisScreen({ navigation }) {
    const { colors } = useTheme();
    const { transactions } = useTransactions();
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        if (transactions && transactions.length > 0) {
            calculateMonthlyData(transactions);
            calculateCategoryData(transactions);
            calculateSummary(transactions);
        }
    }, [transactions]);

    const calculateMonthlyData = (txns) => {
        const monthlyMap = {};
        txns.forEach(t => {
            let date = t.date?.split(' ')[0] || t.date || '';
            let month = null;
            
            if (date.match(/^\d{4}-\d{2}/)) {
                month = date.substring(0, 7);
            } else if (date.match(/^\d{4}\.\d{2}/)) {
                month = date.substring(0, 7).replace('.', '-');
            } else if (date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                const parts = date.split('/');
                month = `${parts[2]}-${parts[1]}`;
            }
            
            if (month) {
                if (!monthlyMap[month]) monthlyMap[month] = 0;
                monthlyMap[month] += Math.abs(t.amount);
            }
        });

        const sorted = Object.entries(monthlyMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6);
        
        setMonthlyData(sorted.map(([month, amount]) => ({
            month: month.substring(5) + '월',
            amount
        })));
    };

    const calculateCategoryData = (txns) => {
        const categoryMap = {};
        let total = 0;
        
        txns.forEach(t => {
            const cat = t.category || '기타';
            if (!categoryMap[cat]) categoryMap[cat] = 0;
            categoryMap[cat] += Math.abs(t.amount);
            total += Math.abs(t.amount);
        });

        const sorted = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([category, amount]) => ({
                name: category,
                amount,
                percentage: Math.round((amount / total) * 100),
                color: CATEGORY_COLORS[category] || '#6B7280',
                legendFontColor: '#4B5563',
                legendFontSize: 12
            }));
        
        setCategoryData(sorted);
    };

    const calculateSummary = (txns) => {
        const total = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const avg = total / txns.length;
        
        // 요일별 지출
        const dayMap = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
        const daySpending = {};
        txns.forEach(t => {
            const date = new Date(t.date);
            const day = dayMap[date.getDay()] || '기타';
            if (!daySpending[day]) daySpending[day] = 0;
            daySpending[day] += Math.abs(t.amount);
        });
        
        const maxDay = Object.entries(daySpending)
            .sort((a, b) => b[1] - a[1])[0];

        setSummary({
            total,
            avg: Math.round(avg),
            count: txns.length,
            maxSpendingDay: maxDay?.[0] || '알 수 없음',
            maxSpendingDayAmount: maxDay?.[1] || 0
        });
    };

    const chartConfig = {
        backgroundColor: colors.cardBackground,
        backgroundGradientFrom: colors.cardBackground,
        backgroundGradientTo: colors.cardBackground,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        labelColor: (opacity = 1) => colors.textSecondary,
        style: { borderRadius: 16 },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#2563EB'
        }
    };

    if (!transactions || transactions.length === 0) {
        return (
            <LinearGradient colors={colors.screenGradient} style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Feather name="bar-chart-2" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>분석할 데이터가 없어요</Text>
                    <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>프로필에서 거래 데이터를 동기화해주세요</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={colors.screenGradient} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Summary Cards */}
                <FadeInView style={styles.summarySection} delay={0}>
                    <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#DBEAFE' }]}>
                            <Feather name="credit-card" size={20} color="#2563EB" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>총 지출</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(summary?.total || 0)}</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Feather name="activity" size={20} color="#059669" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>평균 거래액</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(summary?.avg || 0)}</Text>
                    </View>
                </FadeInView>

                <FadeInView style={styles.summarySection} delay={100}>
                    <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Feather name="hash" size={20} color="#D97706" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>거래 건수</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{summary?.count || 0}건</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#FCE7F3' }]}>
                            <Feather name="calendar" size={20} color="#DB2777" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>지출 많은 요일</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{summary?.maxSpendingDay}요일</Text>
                    </View>
                </FadeInView>

                {/* Tips - 상단에 표시 */}
                <FadeInView style={styles.section} delay={150}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>💡 지출 팁</Text>
                    <View style={[styles.tipCard, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.tipText, { color: colors.text }]}>
                            {categoryData[0]?.name && `${categoryData[0].name} 지출이 가장 많아요. 비용 절감을 고려해보세요!`}
                        </Text>
                    </View>
                </FadeInView>

                {/* Monthly Chart */}
                <FadeInView style={styles.section} delay={200}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>월별 지출 추이</Text>
                    <View style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
                        {monthlyData.length > 0 && (
                            <LineChart
                                data={{
                                    labels: monthlyData.map(d => d.month),
                                    datasets: [{ data: monthlyData.map(d => d.amount) }]
                                }}
                                width={width - 64}
                                height={200}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                            />
                        )}
                    </View>
                </FadeInView>

                {/* Category Analysis */}
                <FadeInView style={styles.section} delay={300}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>카테고리별 분석</Text>
                    <View style={[styles.chartCard, { backgroundColor: colors.cardBackground }]}>
                        {categoryData.map((item, index) => (
                            <View key={index} style={styles.categoryRow}>
                                <View style={styles.categoryLeft}>
                                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                                    <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                                </View>
                                <View style={styles.categoryRight}>
                                    <Text style={[styles.categoryAmount, { color: colors.text }]}>{formatCurrency(item.amount)}</Text>
                                    <View style={[styles.categoryBarContainer, { backgroundColor: colors.border }]}>
                                        <View style={[styles.categoryBar, { 
                                            width: `${item.percentage}%`, 
                                            backgroundColor: item.color 
                                        }]} />
                                    </View>
                                    <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>{item.percentage}%</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </FadeInView>

                <View style={{ height: 100 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4B5563',
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },
    summarySection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    chart: {
        borderRadius: 16,
        marginLeft: -16,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    categoryRight: {
        alignItems: 'flex-end',
        flex: 1.5,
    },
    categoryAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    categoryBarContainer: {
        width: 100,
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        marginBottom: 4,
    },
    categoryBar: {
        height: 6,
        borderRadius: 3,
    },
    categoryPercent: {
        fontSize: 12,
        color: '#6B7280',
    },
    tipCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    tipText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
});
