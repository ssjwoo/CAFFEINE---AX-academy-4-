import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json([
        { title: '전체 사용자', value: '15,420', trend: '+12.5% 전월 대비', icon: 'Users', color: 'text-blue-600', trendColor: 'text-green-500' },
        { title: '총 거래 건수', value: '89,234', trend: '+8.2% 전월 대비', icon: 'ShoppingCart', color: 'text-blue-600', trendColor: 'text-green-500' },
        { title: '총 거래액', value: '₩12.5억', trend: '+15.3% 전월 대비', icon: 'DollarSign', color: 'text-blue-600', trendColor: 'text-green-500' },
        { title: '평균 거래액', value: '₩1.4만', trend: '▼ 3.1% 전월 대비', icon: 'TrendingUp', color: 'text-blue-600', trendColor: 'text-red-500' },
    ]);
}
