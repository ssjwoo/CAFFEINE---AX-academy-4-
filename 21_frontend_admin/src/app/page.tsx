"use client";

import { useState, useEffect } from 'react';
import { Users, ShoppingCart, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DashboardStatCard } from '@/components/ui/DashboardStatCard';
import { CategoryTable } from '@/components/ui/CategoryTable';
import { getFullAnalysis } from '@/api/client';

// 아이콘 매핑 객체
const iconMap: { [key: string]: any } = {
  Users: Users,
  ShoppingCart: ShoppingCart,
  DollarSign: DollarSign,
  TrendingUp: TrendingUp
};

export default function Dashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const analysis = await getFullAnalysis(selectedMonth.year, selectedMonth.month);
      setDataSource(analysis.data_source || 'DB');

      const summary = analysis.summary;
      setStats([
        {
          title: '총 거래 건수',
          value: summary.transaction_count.toLocaleString() + '건',
          trend: `${summary.transaction_count_mom_change > 0 ? '+' : ''}${summary.transaction_count_mom_change.toFixed(1)}% 전월 대비`,
          icon: ShoppingCart,
          color: 'text-blue-600',
          trendColor: summary.transaction_count_mom_change > 0 ? 'text-green-500' : 'text-red-500'
        },
        {
          title: '총 거래액',
          value: '₩' + (summary.total_spending / 10000).toFixed(1) + '만',
          trend: `${summary.month_over_month_change > 0 ? '+' : ''}${summary.month_over_month_change.toFixed(1)}% 전월 대비`,
          icon: DollarSign,
          color: 'text-blue-600',
          trendColor: summary.month_over_month_change > 0 ? 'text-green-500' : 'text-red-500'
        },
        {
          title: '평균 거래액',
          value: '₩' + Math.round(summary.average_transaction).toLocaleString(),
          trend: '평균 거래액',
          icon: TrendingUp,
          color: 'text-blue-600',
          trendColor: 'text-gray-500'
        },
        {
          title: '최다 카테고리',
          value: summary.top_category,
          trend: '가장 많이 소비한 카테고리',
          icon: Users,
          color: 'text-blue-600',
          trendColor: 'text-gray-500'
        }
      ]);

      // 월별 추이 차트
      const monthlyTrend = analysis.monthly_trend || [];
      const lineChartData = monthlyTrend.map((item: any) => ({
        name: item.month.split('-')[1] + '월',
        value: Math.round(item.total_amount / 10000),
      }));
      setLineData(lineChartData);

      // 카테고리별 차트
      const categories = analysis.category_breakdown || [];
      const barChartData = categories.map((item: any) => ({
        name: item.category,
        value: Math.round(item.total_amount / 10000),
      }));
      setBarData(barChartData);

      // 테이블 데이터
      const tableRows = categories.map((item: any) => ({
        category: item.category,
        amount: '₩' + (item.total_amount >= 100000000
          ? (item.total_amount / 100000000).toFixed(1) + '억'
          : (item.total_amount / 10000).toFixed(1) + '만'),
        count: item.transaction_count.toLocaleString() + '건',
        ratio: item.percentage.toFixed(1) + '%'
      }));
      setTableData(tableRows);

      console.log('✅ 관리자 대시보드 데이터 로드 완료 - 출처:', analysis.data_source);
    } catch (error) {
      console.error('❌ 대시보드 데이터 로드 실패:', error);
      setDataSource('[ERROR]');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
          <p className="text-gray-500 mt-1">전체 서비스 현황을 한눈에 확인하세요</p>
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
              const d = new Date(2025, 6 + i, 1); // 7월부터 12월까지
              const y = d.getFullYear();
              const m = d.getMonth() + 1;
              return (
                <option key={`${y}-${m}`} value={`${y}-${m.toString().padStart(2, '0')}`}>
                  {y}년 {m}월
                </option>
              );
            })}
          </select>
          <span className={`text-sm px-3 py-1 rounded-full ${dataSource.includes('DB') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
            {dataSource.includes('DB') ? '🟢 실시간 DB' : '🟡 ' + dataSource}
          </span>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <RefreshCw size={16} />
            새로고침
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any, index) => {
          const IconComponent = stat.icon || Users;
          return (
            <DashboardStatCard
              key={index}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              icon={IconComponent}
              color={stat.color}
              trendColor={stat.trendColor}
            />
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">월별 거래 추이</h3>
          <div className="h-64">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">단위: 만원</p>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">카테고리별 소비</h3>
          <div className="h-64">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">단위: 만원</p>
        </div>
      </div>

      {/* Table */}
      {tableData.length > 0 && <CategoryTable data={tableData} />}
    </div>
  );
}
