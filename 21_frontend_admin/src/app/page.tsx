"use client";

import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DashboardStatCard } from '@/components/ui/DashboardStatCard';
import { CategoryTable } from '@/components/ui/CategoryTable';

// [왕초보 백엔드 연동 가이드]
// 1. 맨 위에 이 줄을 추가하세요: import { useState, useEffect } from 'react';
// 2. 아래의 'stats' 변수(여기부터 ]; 까지)를 모두 지우세요.
// 3. 지운 자리에 아래 코드를 복사해서 붙여넣으세요.
/*
const [stats, setStats] = useState([]);

useEffect(() => {
    // 백엔드에서 대시보드 통계 가져오기
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/v1/dashboard/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('통계 데이터를 가져오는데 실패했습니다:', error);
        }
    };
    fetchStats();
}, []);
*/
const stats = [
  { title: '전체 사용자', value: '15,420', trend: '+12.5% 전월 대비', icon: Users, color: 'text-blue-600', trendColor: 'text-green-500' },
  { title: '총 거래 건수', value: '89,234', trend: '+8.2% 전월 대비', icon: ShoppingCart, color: 'text-blue-600', trendColor: 'text-green-500' },
  { title: '총 거래액', value: '₩12.5억', trend: '+15.3% 전월 대비', icon: DollarSign, color: 'text-blue-600', trendColor: 'text-green-500' },
  { title: '평균 거래액', value: '₩1.4만', trend: '▼ 3.1% 전월 대비', icon: TrendingUp, color: 'text-blue-600', trendColor: 'text-red-500' },
];

// [왕초보 백엔드 연동 가이드]
// 1. 아래의 'lineData' 변수(여기부터 ]; 까지)를 모두 지우세요.
// 2. 지운 자리에 아래 코드를 복사해서 붙여넣으세요.
/*
const [lineData, setLineData] = useState([]);

useEffect(() => {
    // 백엔드에서 차트 데이터 가져오기
    const fetchChartData = async () => {
        try {
            const response = await fetch('/api/v1/dashboard/charts');
            const data = await response.json();
            setLineData(data.dailyTransactions); // 라인 차트 데이터 설정
            // setBarData(data.categoryConsumption); // 바 차트 데이터도 여기서 설정하면 좋아요
        } catch (error) {
            console.error('차트 데이터를 가져오는데 실패했습니다:', error);
        }
    };
    fetchChartData();
}, []);
*/
const lineData = [
  { name: '1', value: 4000 }, { name: '2', value: 3000 }, { name: '3', value: 2000 }, { name: '4', value: 2780 },
  { name: '5', value: 1890 }, { name: '6', value: 2390 }, { name: '7', value: 3490 }, { name: '8', value: 4000 },
  { name: '9', value: 3000 }, { name: '10', value: 2000 }, { name: '11', value: 2780 }, { name: '12', value: 1890 },
  { name: '13', value: 2390 }, { name: '14', value: 3490 }, { name: '15', value: 4200 }, { name: '16', value: 3800 },
  { name: '17', value: 3500 }, { name: '18', value: 3000 }, { name: '19', value: 2500 }, { name: '20', value: 2800 },
  { name: '21', value: 3200 }, { name: '22', value: 3600 }, { name: '23', value: 4000 }, { name: '24', value: 4500 },
  { name: '25', value: 4800 }, { name: '26', value: 4600 }, { name: '27', value: 4200 }, { name: '28', value: 3800 },
  { name: '29', value: 3500 }, { name: '30', value: 3200 },
];

const barData = [
  { name: '마트/편의점', value: 4000 },
  { name: '배달음식', value: 3000 },
  { name: '카페/디저트', value: 2000 },
  { name: '교육', value: 1800 },
  { name: '패션/뷰티', value: 1500 },
  { name: '주유', value: 1200 },
  { name: '기타', value: 800 },
];

const tableData = [
  { category: '마트/편의점', amount: '₩4.2억', count: '28,934', ratio: '34.0%' },
  { category: '배달음식', amount: '₩3억', count: '15,678', ratio: '23.9%' },
  { category: '카페/디저트', amount: '₩1.6억', count: '12,456', ratio: '12.6%' },
  { category: '교육', amount: '₩1.3억', count: '8,234', ratio: '10.3%' },
  { category: '패션/뷰티', amount: '₩9823.5만', count: '6,789', ratio: '7.9%' },
  { category: '주유', amount: '₩8923.5만', count: '5,234', ratio: '7.1%' },
  { category: '기타', amount: '₩4505만', count: '11,909', ratio: '3.6%' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
        <p className="text-gray-500 mt-1">전체 서비스 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <DashboardStatCard
            key={index}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
            trendColor={stat.trendColor}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">일별 거래 추이</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">카테고리별 소비</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <CategoryTable data={tableData} />
    </div>
  );
}
