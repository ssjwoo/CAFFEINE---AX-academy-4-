/**
 * ============================================================
 * FilterPanel 컴포넌트
 * ============================================================
 * 
 * 역할:
 * - 이상 거래 페이지의 고급 필터링
 * - 날짜 범위, 위험도, 금액 범위, 사용자 검색
 * - 필터 적용/초기화 기능
 * 
 * 사용 위치:
 * - 이상 거래 페이지 (/consumption/anomalies)
 * - 거래 내역 페이지 (확장 가능)
 * 
 * Props:
 * - onFilterChange: 필터 변경 시 콜백
 * - onApply: 필터 적용 버튼 클릭 시
 * - onReset: 필터 초기화 버튼 클릭 시
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { RiskLevel } from '../types/anomaly';

/**
 * 필터 상태 인터페이스
 */
export interface FilterState {
    /** 시작 날짜 (YYYY-MM-DD) */
    dateFrom: string;

    /** 종료 날짜 (YYYY-MM-DD) */
    dateTo: string;

    /** 위험도 필터 (복수 선택 가능) */
    riskLevels: RiskLevel[];

    /** 최소 금액 */
    amountMin: number | null;

    /** 최대 금액 */
    amountMax: number | null;

    /** 사용자 검색어 (이름 또는 ID) */
    userSearch: string;
}

/**
 * FilterPanel Props
 */
interface FilterPanelProps {
    /** 필터 변경 시 콜백 (실시간 업데이트) */
    onFilterChange?: (filters: FilterState) => void;

    /** 필터 적용 버튼 클릭 시 */
    onApply: (filters: FilterState) => void;

    /** 필터 초기화 버튼 클릭 시 */
    onReset: () => void;

    /** 초기 필터 값 */
    initialFilters?: Partial<FilterState>;
}

/**
 * 필터 패널 컴포넌트
 * 
 * @example
 * // 이상 거래 페이지에서 사용
 * const [filters, setFilters] = useState<FilterState>(defaultFilters);
 * 
 * <FilterPanel
 *   onApply={(newFilters) => {
 *     setFilters(newFilters);
 *     refetchAnomalies(newFilters);
 *   }}
 *   onReset={() => {
 *     setFilters(defaultFilters);
 *     refetchAnomalies(defaultFilters);
 *   }}
 * />
 */
export default function FilterPanel({
    onFilterChange,
    onApply,
    onReset,
    initialFilters = {},
}: FilterPanelProps) {
    // ──────────────────────────────────────
    // 기본 필터 값
    // ──────────────────────────────────────
    const defaultFilters: FilterState = {
        dateFrom: '',
        dateTo: '',
        riskLevels: [],
        amountMin: null,
        amountMax: null,
        userSearch: '',
        ...initialFilters,
    };

    // ──────────────────────────────────────
    //  State
    // ──────────────────────────────────────
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    /**
     * ──────────────────────────────────────
     * 필터 업데이트 핸들러
     * ──────────────────────────────────────
     */
    const updateFilter = <K extends keyof FilterState>(
        key: K,
        value: FilterState[K]
    ) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    };

    /**
     * ──────────────────────────────────────
     * 위험도 토글 (복수 선택)
     * ──────────────────────────────────────
     */
    const toggleRiskLevel = (level: RiskLevel) => {
        const newLevels = filters.riskLevels.includes(level)
            ? filters.riskLevels.filter(l => l !== level)
            : [...filters.riskLevels, level];

        updateFilter('riskLevels', newLevels);
    };

    /**
     * ──────────────────────────────────────
     * 필터 적용
     * ──────────────────────────────────────
     * 
     * TODO: 백엔드 API 호출 예시
     * 
     * @example
     * async function applyFilters(filters: FilterState) {
     *   const params = new URLSearchParams();
     *   
     *   if (filters.dateFrom) params.append('date_from', filters.dateFrom);
     *   if (filters.dateTo) params.append('date_to', filters.dateTo);
     *   if (filters.riskLevels.length) params.append('risk_levels', filters.riskLevels.join(','));
     *   if (filters.amountMin) params.append('amount_min', String(filters.amountMin));
     *   if (filters.amountMax) params.append('amount_max', String(filters.amountMax));
     *   if (filters.userSearch) params.append('user_search', filters.userSearch);
     *   
     *   const response = await fetch(`/api/anomalies?${params}`);
     *   const data = await response.json();
     *   setAnomalies(data);
     * }
     */
    const handleApply = () => {
        onApply(filters);
    };

    /**
     * ──────────────────────────────────────
     * 필터 초기화
     * ──────────────────────────────────────
     */
    const handleReset = () => {
        setFilters(defaultFilters);
        onReset();
    };

    /**
     * ──────────────────────────────────────
     * 활성 필터 개수 계산
     * ──────────────────────────────────────
     */
    const activeFilterCount =
        (filters.dateFrom ? 1 : 0) +
        (filters.dateTo ? 1 : 0) +
        (filters.riskLevels.length > 0 ? 1 : 0) +
        (filters.amountMin !== null ? 1 : 0) +
        (filters.amountMax !== null ? 1 : 0) +
        (filters.userSearch ? 1 : 0);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            {/* ──────────────────────────────────────
       * 헤더 (접기/펼치기)
       * ────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">🔍 필터</h3>
                    {activeFilterCount > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                            {activeFilterCount}개 활성
                        </span>
                    )}
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* ──────────────────────────────────────
       * 필터 옵션 (접기 가능)
       * ────────────────────────────────────── */}
            {isExpanded && (
                <div className="space-y-4">
                    {/* 날짜 범위 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📅 날짜 범위
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="시작일"
                            />
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => updateFilter('dateTo', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="종료일"
                            />
                        </div>
                    </div>

                    {/* 위험도 필터 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ⚠️ 위험도 (복수 선택 가능)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {(['위험', '경고', '주의'] as RiskLevel[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => toggleRiskLevel(level)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filters.riskLevels.includes(level)
                                        ? level === '위험'
                                            ? 'bg-red-600 text-white'
                                            : level === '경고'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-yellow-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 금액 범위 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            💰 금액 범위 (원)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                value={filters.amountMin ?? ''}
                                onChange={(e) => updateFilter('amountMin', e.target.value ? Number(e.target.value) : null)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="최소 금액"
                            />
                            <input
                                type="number"
                                value={filters.amountMax ?? ''}
                                onChange={(e) => updateFilter('amountMax', e.target.value ? Number(e.target.value) : null)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="최대 금액"
                            />
                        </div>
                    </div>

                    {/* 사용자 검색 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            👤 사용자 검색
                        </label>
                        <input
                            type="text"
                            value={filters.userSearch}
                            onChange={(e) => updateFilter('userSearch', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="사용자 이름 또는 ID"
                        />
                    </div>

                    {/* 버튼 그룹 */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleApply}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            필터 적용
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                        >
                            초기화
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
