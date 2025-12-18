"use client";

import { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Mail, Calendar, CheckCircle2, XCircle, TrendingUp, TrendingDown, UserPlus, Eye, EyeOff } from 'lucide-react';
import { UserData, ChurnMetrics } from '@/types';
import { getAllUsers, getNewSignups, getChurnedUsers, getChurnMetrics } from '@/api/client';
import { maskEmail, maskName, maskPhone, maskBirthDate } from '@/utils/masking';

type TabType = 'all' | 'new' | 'active' | 'churned';

export default function UsersPage() {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [users, setUsers] = useState<UserData[]>([]);
    const [newUsers, setNewUsers] = useState<UserData[]>([]);
    const [churnedUsers, setChurnedUsers] = useState<UserData[]>([]);
    const [churnMetrics, setChurnMetrics] = useState<ChurnMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [unmaskedUserIds, setUnmaskedUserIds] = useState<Set<number>>(new Set());
    const [showAllUnmasked, setShowAllUnmasked] = useState(false);
    const [days, setDays] = useState(30);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 20;

    useEffect(() => {
        fetchAllData();
    }, [days]);

    const fetchAllData = async () => {
        try {
            setIsLoading(true);
            const [allUsersData, newSignupsData, churnedData, metricsData] = await Promise.all([
                getAllUsers(),
                getNewSignups(days),
                getChurnedUsers(days),
                getChurnMetrics(days, days)
            ]);

            setUsers(allUsersData);
            setNewUsers(newSignupsData);
            setChurnedUsers(churnedData);
            setChurnMetrics(metricsData);

            console.log('✅ 사용자 데이터 로드 완료');
        } catch (error) {
            console.error('❌ 데이터 로드 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 현재 탭에 따라 표시할 사용자 목록 결정
    const getCurrentUsers = () => {
        let tabUsers;
        switch (activeTab) {
            case 'new': tabUsers = newUsers; break;
            case 'active': tabUsers = users.filter(u => u.has_recent_activity === true); break;
            case 'churned': tabUsers = churnedUsers; break;
            default: tabUsers = users; break;
        }
        // ID 순서로 정렬 (오름차순)
        return [...tabUsers].sort((a, b) => a.id - b.id);
    };

    // 현재 탭과 검색어에 따른 필터링 결과
    const getFilteredResults = () => {
        const currentTabUsers = getCurrentUsers();
        return currentTabUsers.filter(user =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const allFilteredUsers = getFilteredResults();
    const totalPages = Math.ceil(allFilteredUsers.length / pageSize);

    // 현재 페이지에 해당하는 데이터만 추출
    const paginatedUsers = allFilteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // 탭이나 검색어 변경 시 페이지 초기화
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, days]);

    // 마스킹 토글 함수
    const toggleUserMask = (userId: number) => {
        setUnmaskedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const toggleAllMask = () => {
        if (showAllUnmasked) {
            setUnmaskedUserIds(new Set());
            setShowAllUnmasked(false);
        } else {
            const allIds = new Set(getCurrentUsers().map(u => u.id));
            setUnmaskedUserIds(allIds);
            setShowAllUnmasked(true);
        }
    };

    const isUserUnmasked = (userId: number) => {
        return showAllUnmasked || unmaskedUserIds.has(userId);
    };

    const totalUsers = churnMetrics?.total_users || users.length;
    const activeUsers = churnMetrics?.active_users || users.filter(u => u.is_active).length;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">사용자 관리</h2>
                    <p className="text-gray-500 mt-1">사용자 목록 및 이탈 분석</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">조회 기간:</span>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={7}>최근 7일</option>
                        <option value={30}>최근 30일</option>
                        <option value={90}>최근 90일</option>
                    </select>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">전체 사용자</p>
                            <p className="text-2xl font-bold text-gray-800">{totalUsers}명</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <UsersIcon className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">신규 가입</p>
                            <p className="text-2xl font-bold text-gray-800">{churnMetrics?.new_signups || 0}명</p>
                            <p className="text-xs text-gray-400 mt-1">최근 {days}일</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Active</p>
                            <p className="text-2xl font-bold text-gray-800">{churnMetrics?.active_users || 0}명</p>
                            <p className="text-xs text-gray-400 mt-1">최근 30일 거래</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Deactive</p>
                            <p className="text-2xl font-bold text-gray-800">{churnMetrics?.total_churned || 0}명</p>
                            <p className="text-xs text-gray-400 mt-1">30일 이상 거래 없음</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            전체 사용자 ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'new'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            신규 가입 ({newUsers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Active ({users.filter(u => u.has_recent_activity === true).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('churned')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'churned'
                                ? 'border-red-600 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Deactive ({churnedUsers.length})
                        </button>
                    </div>
                </div>

                {/* 검색바 및 마스킹 토글 */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="검색할 이메일(전체) 또는 이름을 입력하세요"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                    <button
                        onClick={toggleAllMask}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${showAllUnmasked
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {showAllUnmasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showAllUnmasked ? '전체 마스킹' : '전체 열람'}
                    </button>
                </div>

                {/* 사용자 테이블 */}
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
                    </div>
                ) : allFilteredUsers.length === 0 ? (
                    <div className="p-12 text-center">
                        <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">검색 결과가 없습니다</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            사용자
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            이메일
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            가입일
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            생년월일
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            상태
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            권한
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            열람
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedUsers.map((user) => {
                                        const isUnmasked = isUserUnmasked(user.id);
                                        const displayName = isUnmasked ? user.name : maskName(user.name || '');
                                        const displayEmail = isUnmasked ? user.email : maskEmail(user.email);
                                        const displayBirthDate = isUnmasked
                                            ? (user.birth_date ? new Date(user.birth_date).toLocaleDateString('ko-KR') : 'N/A')
                                            : maskBirthDate(user.birth_date);

                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <span className="text-blue-600 font-semibold text-sm">
                                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{displayName || '이름 없음'}</div>
                                                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                                        {displayEmail}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {displayBirthDate}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.has_recent_activity !== undefined ? (
                                                        user.has_recent_activity ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Deactive
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Unknown
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.is_superuser ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            관리자
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            일반 사용자
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleUserMask(user.id)}
                                                        className={`p-2 rounded-lg transition-colors ${isUnmasked
                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        title={isUnmasked ? '마스킹하기' : '열람하기'}
                                                    >
                                                        {isUnmasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* 페이지네이션 버튼 */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600"
                                >
                                    이전
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1 rounded text-sm font-medium ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600"
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* 결과 표시 */}
                {!isLoading && allFilteredUsers.length > 0 && (
                    <div className="p-4 text-sm text-gray-500 text-center border-t border-gray-100">
                        전체 {getCurrentUsers().length}명 중 {allFilteredUsers.length}명 검색됨
                        {totalPages > 1 && ` (현재 ${currentPage}/${totalPages} 페이지)`}
                    </div>
                )}
            </div>
        </div>
    );
}
