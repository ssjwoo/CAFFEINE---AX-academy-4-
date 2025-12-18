"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionData, TransactionListResponse } from '@/types';
import { getTransactions, getTransactionStats } from '@/api/client';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ transaction_count: 0, total_amount: 0, average_amount: 0 });

    // 필터 상태
    const [filters, setFilters] = useState({
        search: '',
        category: '모든 카테고리',
        start_date: '',
        end_date: '',
        min_amount: '',
        max_amount: '',
    });

    // 페이지네이션
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        total: 0
    });

    useEffect(() => {
        fetchTransactions();
        fetchStats();
    }, [pagination.page, filters]);

    /**
     * Backend API에서 거래 데이터를 가져오는 함수
     */
    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            const filterParams = {
                search: filters.search || undefined,
                category: filters.category !== '모든 카테고리' ? filters.category : undefined,
                start_date: filters.start_date || undefined,
                end_date: filters.end_date || undefined,
                min_amount: filters.min_amount ? parseFloat(filters.min_amount) : undefined,
                max_amount: filters.max_amount ? parseFloat(filters.max_amount) : undefined,
                page: pagination.page,
                page_size: pagination.pageSize,
            };

            const response: TransactionListResponse = await getTransactions(filterParams);
            setTransactions(response.transactions);
            setPagination(prev => ({ ...prev, total: response.total }));
            console.log('✅ 거래 데이터 로드 완료:', response.transactions.length, '건');
        } catch (error) {
            console.error('❌ 거래 데이터 로드 실패:', error);
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 거래 통계 가져오기
     */
    const fetchStats = async () => {
        try {
            const statsData = await getTransactionStats();
            setStats(statsData.stats);
        } catch (error) {
            console.error('통계 로드 실패:', error);
        }
    };

    // 필터 변경 핸들러
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // 필터 변경 시 첫 페이지로
    };

    // 필터 초기화
    const handleResetFilters = () => {
        setFilters({
            search: '',
            category: '모든 카테고리',
            start_date: '',
            end_date: '',
            min_amount: '',
            max_amount: '',
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // 금액 포맷팅
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
        }).format(amount);
    };

    // 카테고리 색상
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            '외식': 'bg-orange-100 text-orange-800',
            '교통': 'bg-blue-100 text-blue-800',
            '쇼핑': 'bg-pink-100 text-pink-800',
            '문화생활': 'bg-purple-100 text-purple-800',
            '생활비': 'bg-green-100 text-green-800',
            '기타': 'bg-gray-100 text-gray-800',
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">거래 관리</h2>
                    <p className="text-gray-500 mt-1">전체 거래 내역을 조회하고 관리합니다</p>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">총 거래 건수</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.transaction_count.toLocaleString()}건</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">총 거래액</p>
                            <p className="text-2xl font-bold text-gray-800">{formatAmount(stats.total_amount)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">평균 거래액</p>
                            <p className="text-2xl font-bold text-gray-800">{formatAmount(stats.average_amount)}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 필터 패널 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">필터</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 검색 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="가맹점 또는 메모 검색..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 카테고리 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option>모든 카테고리</option>
                            <option>외식</option>
                            <option>교통</option>
                            <option>쇼핑</option>
                            <option>문화생활</option>
                            <option>생활비</option>
                            <option>기타</option>
                        </select>
                    </div>

                    {/* 날짜 범위 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        />
                    </div>

                    {/* 금액 범위 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">최소 금액</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.min_amount}
                            onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">최대 금액</label>
                        <input
                            type="number"
                            placeholder="무제한"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.max_amount}
                            onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                        />
                    </div>

                    {/* 필터 초기화 버튼 */}
                    <div className="flex items-end">
                        <button
                            onClick={handleResetFilters}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            필터 초기화
                        </button>
                    </div>
                </div>
            </div>

            {/* 거래 테이블 */}
            {isLoading ? (
                <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-500">거래 정보를 불러오는 중...</p>
                </div>
            ) : transactions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">거래 내역이 없습니다</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            가맹점
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            카테고리
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            금액
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            거래일시
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            상태
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                #{tx.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{tx.merchant}</div>
                                                {tx.description && (
                                                    <div className="text-sm text-gray-500">{tx.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(tx.category)}`}>
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {formatAmount(tx.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    {new Date(tx.transaction_date).toLocaleString('ko-KR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {tx.status === 'completed' ? '완료' : tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 페이지네이션 */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            전체 {pagination.total.toLocaleString()}건 중 {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)}건 표시
                        </div>

                        <div className="flex items-center gap-1">
                            {/* 이전 페이지 그룹 */}
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600"
                            >
                                이전
                            </button>

                            {/* 페이지 번호 (최대 5개 표시) */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // 현재 페이지를 중심으로 표시하되, 범위를 벗어나지 않도록 조정
                                let startPage = Math.max(1, pagination.page - 2);
                                if (startPage + 4 > totalPages) {
                                    startPage = Math.max(1, totalPages - 4);
                                }
                                const pageNum = startPage + i;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                        className={`px-3 py-1 rounded text-sm font-medium ${pagination.page === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            {/* 다음 페이지 그룹 */}
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                                disabled={pagination.page === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600"
                            >
                                다음
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
