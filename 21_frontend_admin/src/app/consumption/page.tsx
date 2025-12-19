"use client";

import { useState, useEffect } from 'react';
import { PieChart as PieChartIcon, TrendingUp, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ConsumptionItem } from '@/components/ui/ConsumptionItem';
import { getCategoryBreakdown } from '@/api/client';

const COLORS = ['#1e293b', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];

export default function ConsumptionPage() {
    const [consumptionData, setConsumptionData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    });

    const fetchConsumption = async () => {
        try {
            setLoading(true);
            const data = await getCategoryBreakdown(undefined, 1, selectedMonth.year, selectedMonth.month);

            // 소비 아이템 데이터 변환
            const items = data.map((item: any) => ({
                name: item.category,
                amount: `₩${(item.total_amount >= 100000000
                    ? (item.total_amount / 100000000).toFixed(1) + '억'
                    : (item.total_amount / 10000).toFixed(1) + '만')}`,
                percent: item.percentage.toFixed(1) + '%'
            }));
            setConsumptionData(items);

            // 파이 차트 데이터 변환
            const chartData = data.map((item: any) => ({
                name: item.category,
                value: item.total_amount,
                count: item.transaction_count
            }));
            setPieData(chartData);
        } catch (error) {
            console.error('소비 데이터를 가져오는데 실패했습니다:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsumption();
    }, [selectedMonth]);

    return (
        <div className="space-y-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">소비 분석</h2>
                    <p className="text-gray-500 mt-1">전체적인 소비 트렌드를 분석합니다</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={`${selectedMonth.year}-${selectedMonth.month.toString().padStart(2, '0')}`}
                        onChange={(e) => {
                            const [year, month] = e.target.value.split('-').map(Number);
                            setSelectedMonth({ year, month });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 6 }, (_, i) => {
                            const d = new Date(2025, 6 + i, 1);
                            const y = d.getFullYear();
                            const m = d.getMonth() + 1;
                            return (
                                <option key={`${y}-${m}`} value={`${y}-${m.toString().padStart(2, '0')}`}>
                                    {y}년 {m}월
                                </option>
                            );
                        })}
                    </select>
                    <button
                        onClick={fetchConsumption}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        <RefreshCw size={16} />
                        새로고침
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-500">데이터 로딩 중...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">월간 소비 요약</h3>
                            <PieChartIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="h-80">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `₩${(value / 10000).toFixed(1)}만`}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                                    <p className="text-gray-400">데이터가 없습니다</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">주요 지출 카테고리</h3>
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            {consumptionData.length > 0 ? (
                                consumptionData.map((item, i) => (
                                    <ConsumptionItem
                                        key={i}
                                        name={item.name}
                                        amount={item.amount}
                                        percent={item.percent}
                                    />
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                                    <p className="text-gray-400">데이터가 없습니다</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
