import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Search, Calendar, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

const CATEGORY_COLORS = {
    // Existing & Observed Categories
    '식비': '#FF6B6B',     // Soft Red
    '외식': '#FF8787',     // Light Red
    '식료품': '#FFA07A',   // Light Salmon
    '카페/간식': '#F06595', // Pink

    '교통': '#4ECDC4',     // Teal
    '주유': '#20C997',     // Green

    '쇼핑': '#45B7D1',     // Sky Blue
    '생활': '#748FFC',     // Indigo
    '편의점': '#4DABF7',   // Blue

    '의료': '#FFD43B',     // Yellow
    '통신': '#FCC419',     // Orange
    '주거': '#D4A5A5',     // Pale Pink
    '문화': '#9B59B6',     // Amethyst

    '교육': '#845EF7',     // Violet
    '여행': '#3BC9DB',     // Cyan

    '기타': '#ADB5BD'      // Gray
};

const AdminIntegratedAnalysis = () => {
    const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'demographics'
    const [selectedMonth, setSelectedMonth] = useState(''); // 빈 값 = 전체 데이터
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('merchant'); // 검색 타입: 날짜/가맹점명/카테고리
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [ageData, setAgeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);

    // 필터 변경 시 페이지 1로 초기화
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, selectedDate]);



    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    page: '1',
                    page_size: '999999'  // Unlimited - fetch all available data
                });

                // 월이 선택된 경우에만 날짜 필터 추가
                if (selectedMonth) {
                    const [year, month] = selectedMonth.split('-');
                    const startDate = `${selectedMonth}-01`;
                    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endDate = `${selectedMonth}-${lastDay}`;
                    params.set('start_date', startDate);
                    params.set('end_date', endDate);
                }

                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(`${API_BASE_URL}/admin/transactions?${params}`, {
                    headers,
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error('API Error Response:', errorBody);
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();

                const formattedTransactions = data.transactions.map(tx => {
                    const [datePart, timePart] = tx.transaction_date.split(' ');
                    return {
                        id: tx.id,
                        userId: tx.user_id ? `user_${String(tx.user_id).padStart(3, '0')}` : `id_${tx.id}`,
                        merchant: tx.merchant,
                        category: tx.category,
                        amount: tx.amount,
                        date: datePart,
                        time: timePart?.substring(0, 5) || '00:00',
                        ipAddress: 'N/A'
                    };
                });

                setTransactions(formattedTransactions);
            } catch (err) {
                console.error('Failed to fetch transactions:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [selectedMonth]);

    // 연령대별 데이터 페칭
    useEffect(() => {
        if (activeTab === 'demographics') {
            fetchAgeData();
        }
    }, [activeTab]);

    const fetchAgeData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/analytics/demographics/consumption-by-age`, {
                headers
            });
            if (!response.ok) throw new Error('Failed to fetch age data');
            const data = await response.json();
            setAgeData(data);
        } catch (err) {
            console.error('Failed to fetch age data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        // searchType에 따라 다른 필터 적용
        if (searchQuery) {
            if (searchType === 'date') {
                // 날짜 검색 (YYYY-MM-DD 형식)
                filtered = filtered.filter(tx => tx.date.includes(searchQuery));
            } else if (searchType === 'merchant') {
                // 가맹점명 검색
                filtered = filtered.filter(tx => tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()));
            } else if (searchType === 'category') {
                // 카테고리 검색
                filtered = filtered.filter(tx => tx.category.toLowerCase().includes(searchQuery.toLowerCase()));
            }
        }

        if (selectedCategory) filtered = filtered.filter(tx => tx.category === selectedCategory);
        if (selectedDate) filtered = filtered.filter(tx => tx.date === selectedDate);
        return filtered;
    }, [transactions, searchQuery, searchType, selectedCategory, selectedDate]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const categoryData = useMemo(() => {
        const categoryMap = {};
        filteredTransactions.forEach(tx => {
            if (!categoryMap[tx.category]) categoryMap[tx.category] = 0;
            categoryMap[tx.category] += tx.amount;
        });
        return Object.keys(categoryMap).map(category => ({
            name: category,
            value: categoryMap[category],
            color: CATEGORY_COLORS[category] || CATEGORY_COLORS['기타']
        }));
    }, [filteredTransactions]);

    const dailyData = useMemo(() => {
        const dataMap = {};

        // 월이 선택되지 않았을 때: 월별 데이터
        if (!selectedMonth) {
            filteredTransactions.forEach(tx => {
                const yearMonth = tx.date.substring(0, 7); // YYYY-MM
                if (!dataMap[yearMonth]) dataMap[yearMonth] = 0;
                dataMap[yearMonth] += tx.amount;
            });
            return Object.keys(dataMap).sort().map(yearMonth => ({
                date: yearMonth.substring(5) + '월', // MM월
                fullDate: yearMonth,
                amount: dataMap[yearMonth]
            }));
        }

        // 월이 선택되었을 때: 일별 데이터
        filteredTransactions.forEach(tx => {
            if (!dataMap[tx.date]) dataMap[tx.date] = 0;
            dataMap[tx.date] += tx.amount;
        });
        return Object.keys(dataMap).sort().map(date => ({
            date: date.split('-')[2] + '일',
            fullDate: date,
            amount: dataMap[date]
        }));
    }, [filteredTransactions, selectedMonth]);

    const handlePieClick = (data) => setSelectedCategory(prev => prev === data.name ? null : data.name);
    const handleBarClick = (data) => setSelectedDate(prev => prev === data.fullDate ? null : data.fullDate);

    const handleExport = () => {
        const csvContent = [
            ['No', 'Transaction ID', 'User ID', 'Date', 'Time', 'Merchant', 'Category', 'Amount', 'IP Address'],
            ...filteredTransactions.map((tx, index) => [index + 1, tx.id, tx.userId, tx.date, tx.time, tx.merchant, tx.category, tx.amount, tx.ipAddress])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_${selectedMonth}.csv`;
        link.click();
    };

    const getFilterText = () => {
        const filters = [];
        if (selectedCategory) filters.push(selectedCategory);
        if (selectedDate) filters.push(selectedDate);
        if (searchQuery) filters.push(`"${searchQuery}"`);
        return filters.length > 0 ? `필터링: ${filters.join(' / ')}` : '전체 거래 내역';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">데이터 로딩 실패</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">다시 시도</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1600px] mx-auto">

                {/* 탭 버튼 */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${activeTab === 'transactions'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        거래 내역
                    </button>
                    <button
                        onClick={() => setActiveTab('demographics')}
                        className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${activeTab === 'demographics'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        연령대별 분석
                    </button>
                </div>

                {/* 거래 내역 탭 */}
                {activeTab === 'transactions' && (
                    <>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="flex items-center gap-2 ml-6">
                                    <select
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={searchType}
                                        onChange={(e) => setSearchType(e.target.value)}
                                    >
                                        <option value="date">날짜</option>
                                        <option value="merchant">가맹점명</option>
                                        <option value="category">카테고리</option>
                                    </select>
                                    <div className="relative" style={{ width: '400px' }}>
                                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder={
                                                searchType === 'date' ? '날짜 검색 (YYYY-MM-DD)...' :
                                                    searchType === 'merchant' ? '가맹점명 검색...' :
                                                        '카테고리 검색...'
                                            }
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md ml-auto">
                                    <Download className="w-4 h-4" />엑셀 다운로드
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">카테고리별 거래 비중</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            onClick={handlePieClick}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => `₩${value.toLocaleString()}`}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                                {selectedCategory && (
                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            {selectedCategory} <span className="text-blue-400">✕</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Bar Chart Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    {selectedMonth ? '일별 거래액 추이' : '월별 거래액 추이'}
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            tickFormatter={(value) => `₩${(value / 10000).toLocaleString()}만`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F9FAFB' }}
                                            formatter={(value) => [`₩${value.toLocaleString()}`, '거래액']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar
                                            dataKey="amount"
                                            fill="#6366F1"
                                            radius={[4, 4, 0, 0]}
                                            barSize={32}
                                            onClick={handleBarClick}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                                {selectedDate && (
                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={() => setSelectedDate(null)}
                                            className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            {selectedDate} <span className="text-blue-400">✕</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-800">{getFilterText()}</h3>
                                <p className="text-sm text-gray-500 mt-1">총 {filteredTransactions.length}건 / 합계: ₩{filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedTransactions.map((tx, index) => (
                                            <tr key={tx.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-700">{tx.id}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-500">{tx.userId}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{tx.date} {tx.time}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{tx.merchant}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: (CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['기타']) + '20', color: CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['기타'] }}>{tx.category}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">₩{tx.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-500">{tx.ipAddress}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredTransactions.length === 0 && (<div className="text-center py-12"><p className="text-gray-500">조건에 맞는 거래 내역이 없습니다.</p></div>)}

                            {/* 페이지네이션 UI */}
                            {filteredTransactions.length > 0 && (
                                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        전체 {filteredTransactions.length.toLocaleString()}건 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}건 표시
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600 bg-white"
                                        >
                                            이전
                                        </button>
                                        {Array.from({ length: Math.min(5, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)) }, (_, i) => {
                                            const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
                                            let startPage = Math.max(1, currentPage - 2);
                                            if (startPage + 4 > totalPages) {
                                                startPage = Math.max(1, totalPages - 4);
                                            }
                                            const pageNum = startPage + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`px-3 py-1 rounded text-sm font-medium ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 bg-white hover:bg-gray-100'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE), prev + 1))}
                                            disabled={currentPage === Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)}
                                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600 bg-white"
                                        >
                                            다음
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 연령대별 분석 탭 */}
                {activeTab === 'demographics' && (
                    <div className="space-y-6">
                        {/* 스택 바 차트 */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">연령대별 총 지출 비교</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={ageData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="age_group"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        tickFormatter={(value) => `₩${(value / 10000).toLocaleString()}만`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`₩${value.toLocaleString()}`, '총 지출']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total_spending" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 상세 테이블 */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-800">연령대별 상세 분석</h3>
                                <p className="text-sm text-gray-500 mt-1">각 연령대의 사용자 수, 총 지출, 상위 카테고리를 확인하세요</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연령대</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자 수</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">총 지출</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">평균 거래액</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상위 카테고리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {ageData.map((group, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">{group.age_group}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">{group.user_count}명</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-medium text-gray-900">₩{group.total_spending.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm text-gray-600">₩{Math.round(group.avg_transaction_amount).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.top_categories.map((cat, catIndex) => (
                                                            <span
                                                                key={catIndex}
                                                                className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                                                                style={{
                                                                    backgroundColor: (CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['기타']) + '20',
                                                                    color: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['기타']
                                                                }}
                                                            >
                                                                {cat.category}: ₩{(cat.amount / 10000).toFixed(0)}만
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {ageData.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">연령대별 데이터가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminIntegratedAnalysis;
