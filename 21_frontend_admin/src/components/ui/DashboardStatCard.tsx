/**
 * ============================================================
 * 대시보드 통계 카드 컴포넌트
 * ============================================================
 * 용도: 대시보드 상단에 표시되는 주요 통계 정보 카드
 * 위치: admin/src/components/ui/DashboardStatCard.tsx
 * 
 * 사용하는 곳:
 * - admin/src/app/page.tsx (메인 대시보드)
 * 
 * 팀원들이 알아야 할 것:
 * 1. 이 컴포넌트는 재사용 가능한 UI 컴포넌트입니다
 * 2. props로 데이터만 넘기면 자동으로 카드가 생성됩니다
 * 3. 아이콘은 lucide-react 라이브러리를 사용합니다
 * ============================================================
 */

import { LucideIcon } from 'lucide-react';

/**
 * ============================================================
 * Props 타입 정의 (이 컴포넌트에 전달할 수 있는 값들)
 * ============================================================
 */
interface DashboardStatCardProps {
    title: string;        // 카드 제목 (예: "전체 사용자")
    value: string;        // 표시할 숫자 값 (예: "15,420")
    trend: string;        // 증감 추세 (예: "+12.5% 전월 대비")
    icon: LucideIcon;     // 표시할 아이콘 (lucide-react에서 가져옴)
    color: string;        // 아이콘 색상 클래스 (예: "text-blue-600")
    trendColor: string;   // 추세 텍스트 색상 (예: "text-green-500")
}

/**
 * ========================================
 * DashboardStatCard 컴포넌트
 * ========================================
 * 
 * 사용 예시:
 * <DashboardStatCard
 *   title="전체 사용자"
 *   value="15,420"
 *   trend="+12.5% 전월 대비"
 *   icon={Users}
 *   color="text-blue-600"
 *   trendColor="text-green-500"
 * />
 * 
 * 백엔드 연동 시:
 * - 백엔드에서 받은 통계 데이터를 이 컴포넌트에 props로 전달하세요
 * - 예: stats.map(stat => <DashboardStatCard {...stat} />)
 * ========================================
 */
export function DashboardStatCard({ title, value, trend, icon: Icon, color, trendColor }: DashboardStatCardProps) {
    return (
        // 카드 전체 컨테이너: 흰색 배경, 둥근 모서리, 약간의 그림자
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* 상단 영역: 제목/값 + 아이콘 */}
            <div className="flex justify-between items-start mb-4">
                {/* 왼쪽: 제목과 숫자 값 */}
                <div>
                    {/* 카드 제목 (작은 회색 텍스트) */}
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    {/* 메인 숫자 값 (크고 굵은 텍스트) */}
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
                </div>
                {/* 오른쪽: 아이콘 배경 박스 */}
                <div className="p-2 bg-gray-50 rounded-lg">
                    {/* 동적으로 전달받은 아이콘 표시 */}
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
            </div>
            {/* 하단: 증감 추세 텍스트 (색상이 동적으로 변경됨) */}
            <p className={`text-sm font-medium ${trendColor}`}>
                {trend}
            </p>
        </div>
    );
}
