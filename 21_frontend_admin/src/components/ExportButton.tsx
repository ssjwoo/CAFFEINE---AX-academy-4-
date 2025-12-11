/**
 * ============================================================
 * Export Button 컴포넌트
 * ============================================================
 * 
 * 역할:
 * - CSV, Excel, PNG 다운로드 버튼 제공
 * - 드롭다운 메뉴로 형식 선택
 * - 다운로드 중 로딩 상태 표시
 * 
 * 사용 위치:
 * - 대시보드 페이지 (통계 다운로드)
 * - 이상 거래 페이지 (목록 다운로드)
 * - 거래 내역 페이지
 * 
 * Props:
 * - data: 내보낼 데이터
 * - filename: 파일명
 * - type: 데이터 타입
 * - showChartExport: 차트 export 옵션 표시 여부
 * - chartElementId: 차트 요소 ID (PNG export 용)
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { exportToCSV, exportToExcel, exportChartToPNG } from '@/utils/export';

/**
 * ExportButton Props
 */
interface ExportButtonProps {
    /** 내보낼 데이터 배열 */
    data: any[];

    /** 데이터 타입 (파일명에 사용) */
    type: 'anomalies' | 'transactions' | 'dashboard';

    /** 파일명 (확장자 제외) */
    filename?: string;

    /** 차트 export 옵션 표시 여부 */
    showChartExport?: boolean;

    /** 차트 HTML 요소 ID (PNG export 용) */
    chartElementId?: string;
}

/**
 * Export 버튼 컴포넌트
 * 
 * @example
 * // 기본 사용
 * <ExportButton 
 *   data={anomalies} 
 *   type="anomalies" 
 *   filename="이상거래목록_20241203"
 * />
 * 
 * @example
 * // 차트 export 포함
 * <ExportButton 
 *   data={dashboardStats} 
 *   type="dashboard"
 *   showChartExport
 *   chartElementId="monthly-chart"
 * />
 */
export default function ExportButton({
    data,
    type,
    filename,
    showChartExport = false,
    chartElementId,
}: ExportButtonProps) {
    // 드롭다운 메뉴 열림/닫힘 상태
    const [isOpen, setIsOpen] = useState(false);

    // 다운로드 중 상태 (로딩 표시용)
    const [isExporting, setIsExporting] = useState(false);

    /**
     * CSV 다운로드 핸들러
     */
    const handleExportCSV = () => {
        setIsExporting(true);
        try {
            exportToCSV(data, type, filename);
        } finally {
            setIsExporting(false);
            setIsOpen(false);
        }
    };

    /**
     * Excel 다운로드 핸들러
     * 
     * TODO: 백엔드 연동 시 서버에서 생성된 파일 다운로드
     * 
     * @example
     * async function handleExportExcel() {
     *   setIsExporting(true);
     *   try {
     *     const response = await fetch('/api/export/excel', {
     *       method: 'POST',
     *       headers: { 'Content-Type': 'application/json' },
     *       body: JSON.stringify({ type, filters: {...} }),
     *     });
     *     
     *     const blob = await response.blob();
     *     const url = URL.createObjectURL(blob);
     *     const link = document.createElement('a');
     *     link.href = url;
     *     link.download = `${filename}.xlsx`;
     *     link.click();
     *   } catch (error) {
     *     console.error('Excel export 실패:', error);
     *   } finally {
     *     setIsExporting(false);
     *   }
     * }
     */
    const handleExportExcel = () => {
        setIsExporting(true);
        try {
            // 대시보드 데이터의 경우 여러 시트로 구성
            if (type === 'dashboard') {
                exportToExcel({
                    '통계': data,
                    // 필요시 추가 시트 추가 가능
                }, filename);
            } else {
                exportToExcel({ '데이터': data }, filename);
            }
        } finally {
            setIsExporting(false);
            setIsOpen(false);
        }
    };

    /**
     * 차트 PNG 다운로드 핸들러
     */
    const handleExportChart = async () => {
        if (!chartElementId) {
            alert('차트 ID가 지정되지 않았습니다.');
            return;
        }

        setIsExporting(true);
        try {
            await exportChartToPNG(chartElementId, filename);
        } finally {
            setIsExporting(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative inline-block">
            {/* Export 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting || !data || data.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                {isExporting ? (
                    <>
                        {/* 로딩 스피너 */}
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>다운로드 중...</span>
                    </>
                ) : (
                    <>
                        {/* 다운로드 아이콘 */}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>내보내기</span>
                        {/* 드롭다운 화살표 */}
                        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </>
                )}
            </button>

            {/* 드롭다운 메뉴 */}
            {isOpen && !isExporting && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    {/* CSV 옵션 */}
                    <button
                        onClick={handleExportCSV}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <span className="text-green-600">📄</span>
                        <span>CSV로 내보내기</span>
                    </button>

                    {/* Excel 옵션 */}
                    <button
                        onClick={handleExportExcel}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <span className="text-green-700">📊</span>
                        <span>Excel로 내보내기</span>
                    </button>

                    {/* 차트 PNG 옵션 (선택적) */}
                    {showChartExport && chartElementId && (
                        <>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                                onClick={handleExportChart}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <span className="text-blue-600">🖼️</span>
                                <span>차트 이미지로 저장</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* 드롭다운 닫기용 오버레이 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
