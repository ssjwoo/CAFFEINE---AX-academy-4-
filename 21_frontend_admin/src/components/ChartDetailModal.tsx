/**
 * ============================================================
 * ChartDetailModal 컴포넌트
 * ============================================================
 * 
 * 역할:
 * - 차트 클릭 시 상세 정보 표시
 * - 라인 차트 특정 날짜 → 당일 거래 상세
 * - 바 차트 카테고리 → 해당 카테고리 거래 목록
 * 
 * 사용 시나리오:
 * 1. 월별 거래 추이 차트 클릭 → 해당 월 거래 목록
 * 2. 카테고리별 차트 클릭 → 해당 카테고리 상세
 * 3. Recharts onMouseDown/onClick 이벤트와 연동
 * 
 * Props:
 * - isOpen: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - title: 모달 제목
 * - data: 표시할 상세 데이터
 * ============================================================
 */

'use client';

import { useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/format';


/**
 * 차트 상세 데이터 타입
 */
export interface ChartDetailData {
    /** 타입 (날짜별 또는 카테고리별) */
    type: 'date' | 'category';

    /** 제목 (예: "2024년 11월" 또는 "식비") */
    label: string;

    /** 상세 데이터 배열 */
    items: Array<{
        id: string | number;
        description: string;
        amount: number;
        date?: string;
        category?: string;
        [key: string]: any;
    }>;

    /** 총 합계 */
    total: number;

    /** 거래 건수 */
    count: number;
}

/**
 * ChartDetailModal Props
 */
interface ChartDetailModalProps {
    /** 모달 표시 여부 */
    isOpen: boolean;

    /** 닫기 콜백 */
    onClose: () => void;

    /** 차트 상세 데이터 */
    data: ChartDetailData | null;
}

/**
 * 차트 상세 정보 모달
 * 
 * @example
 * // 사용 예시
 * const [modalData, setModalData] = useState<ChartDetailData | null>(null);
 * 
 * // 차트에서 사용
 * <BarChart onClick={(data) => {
 *   setModalData({
 *     type: 'category',
 *     label: data.name,
 *     items: getCategoryDetails(data.name),
 *     total: data.value,
 *     count: data.count,
 *   });
 * }} />
 * 
 * <ChartDetailModal 
 *   isOpen={!!modalData}
 *   data={modalData}
 *   onClose={() => setModalData(null)}
 * />
 */
export default function ChartDetailModal({
    isOpen,
    onClose,
    data,
}: ChartDetailModalProps) {
    // ──────────────────────────────────────
    // ESC 키로 모달 닫기
    // ──────────────────────────────────────
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // ──────────────────────────────────────
    // 모달 열림 시 body 스크롤 방지
    // ──────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 배경 오버레이 */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 모달 컨테이너 */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col z-10 mx-4">
                {/* ──────────────────────────────────────
         * 헤더
         * ────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {data.label}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            총 {data.count}건 · {formatCurrency(data.total)}
                        </p>
                    </div>

                    {/* 닫기 버튼 */}
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ──────────────────────────────────────
         * 본문 (스크롤 가능)
         * ────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {data.items.length === 0 ? (
                        // 빈 상태
                        <div className="text-center py-12">
                            <p className="text-gray-500">상세 데이터가 없습니다.</p>
                        </div>
                    ) : (
                        // 거래 목록
                        <div className="space-y-3">
                            {data.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">
                                                {item.description}
                                            </p>
                                            <div className="flex gap-3 mt-1 text-sm text-gray-600">
                                                {item.date && (
                                                    <span>📅 {formatDate(item.date)}</span>
                                                )}
                                                {item.category && (
                                                    <span>🏷️ {item.category}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">
                                                {formatCurrency(item.amount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ──────────────────────────────────────
         * 푸터
         * ────────────────────────────────────── */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * ============================================================
 * 사용 예시: Recharts와 통합
 * ============================================================
 * 
 * @example
 * // 라인 차트에서 특정 날짜 클릭
 * import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
 * 
 * function MonthlyChart() {
 *   const [modalData, setModalData] = useState<ChartDetailData | null>(null);
 * 
 *   const handleBarClick = async (data: any) => {
 *     // 백엔드에서 해당 월의 상세 거래 조회
 *     const details = await fetch(`/api/transactions?month=${data.month}`);
 *     const items = await details.json();
 *     
 *     setModalData({
 *       type: 'date',
 *       label: `${data.month}월 거래 내역`,
 *       items: items,
 *       total: data.amount,
 *       count: items.length,
 *     });
 *   };
 * 
 *   return (
 *     <>
 *       <LineChart data={monthlyData}>
 *         <Line 
 *           type="monotone" 
 *           dataKey="amount"
 *           onClick={handleBarClick}
 *         />
 *       </LineChart>
 *       
 *       <ChartDetailModal
 *         isOpen={!!modalData}
 *         data={modalData}
 *         onClose={() => setModalData(null)}
 *       />
 *     </>
 *   );
 * }
 * 
 * ============================================================
 * 
 * @example
 * // 바 차트에서 카테고리 클릭
 * function CategoryChart() {
 *   const [modalData, setModalData] = useState<ChartDetailData | null>(null);
 * 
 *   const handleCategoryClick = async (data: any) => {
 *     // 백엔드에서 해당 카테고리의 거래 조회
 *     const details = await fetch(`/api/transactions?category=${data.category}`);
 *     const items = await details.json();
 *     
 *     setModalData({
 *       type: 'category',
 *       label: `${data.category} 거래 내역`,
 *       items: items,
 *       total: data.amount,
 *       count: items.length,
 *     });
 *   };
 * 
 *   return (
 *     <>
 *       <BarChart data={categoryData}>
 *         <Bar 
 *           dataKey="amount"
 *           onClick={handleCategoryClick}
 *         />
 *       </BarChart>
 *       
 *       <ChartDetailModal
 *         isOpen={!!modalData}
 *         data={modalData}
 *         onClose={() => setModalData(null)}
 *       />
 *     </>
 *   );
 * }
 * 
 * ============================================================
 */
