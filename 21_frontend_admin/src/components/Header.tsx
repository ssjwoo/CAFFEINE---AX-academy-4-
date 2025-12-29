/**
 * ============================================================
 * 관리자 대시보드 헤더 컴포넌트
 * ============================================================
 * 용도: 모든 페이지 상단에 표시되는 고정 헤더
 * 위치: admin/src/components/Header.tsx
 * 
 * 주요 기능:
 * 1. 현재 페이지 제목 자동 표시 (URL 기반)
 * 2. 페이지 설명 표시
 * 3. 줌 레벨 조절 버튼 (67%, +, -, 초기화)
 * 4. 관리자 프로필 정보 표시
 * ============================================================
 */

"use client";

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * ============================================================
 * 페이지별 제목 매핑 객체
 * ============================================================
 */
const pageTitles: { [key: string]: string } = {
    '/': '대시보드',                              // 대시보드
    '/analysis': '소비 분석',                     // 분석 페이지
    '/reports': '보고서',                         // 보고서
    '/consumption/anomalies': '이상 거래 탐지',  // 이상 거래 탐지
    '/users': '사용자 관리',                      // 사용자 리스트
    '/transactions': '거래 관리',                 // 거래 내역
    '/settings': '설정',                          // 설정 페이지
};

/**
 * ============================================================
 * 페이지별 설명 매핑 객체
 * ============================================================
 */
const pageDescriptions: { [key: string]: string } = {
    '/': '전체 서비스 현황을 한눈에 확인하세요',
    '/age-analysis': '연령대별 소비 패턴과 선호 카테고리를 분석합니다',
    '/consumption': '전체적인 소비 트렌드와 카테고리별 지출을 분석합니다',
    '/consumption/anomalies': '실시간으로 감지된 이상 거래를 모니터링하고 관리합니다',
    '/summary': '지난 30일간의 주요 소비 분석 리포트입니다',
    '/settings': '시스템 설정을 관리합니다',
};

/**
 * ========================================
 * Header 컴포넌트
 * ========================================
 */
export default function Header() {
    const pathname = usePathname();
    const { user } = useAuth();

    // trailing slash 제거하여 비교 (예: '/users/' → '/users')
    const normalizedPath = pathname.endsWith('/') && pathname !== '/'
        ? pathname.slice(0, -1)
        : pathname;

    const title = pageTitles[normalizedPath] || '대시보드';
    const description = pageDescriptions[normalizedPath] || '';

    // 유저 이름의 첫 글자 (아바타 표시용)
    const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A';

    return (
        <header className="bg-[#1e293b] text-white h-16 flex items-center justify-between px-8 fixed top-0 left-64 right-0 z-10 shadow-sm">
            {/* 왼쪽: 경로 표시 (breadcrumb) */}
            <div>
                <div className="text-sm text-gray-400">
                    Caffeine 관리자 <span className="mx-2">/</span> {title}
                </div>
            </div>

            {/* 오른쪽: 줌 컨트롤 + 관리자 프로필 */}
            <div className="flex items-center space-x-4">
                {/* 줌 레벨 조절 버튼 */}
                <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-4 py-1.5 border border-gray-700">
                    <span className="text-sm text-gray-300">67%</span>
                    <button className="text-gray-400 hover:text-white">-</button>
                    <button className="text-gray-400 hover:text-white">+</button>
                    <button className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white ml-2">초기화</button>
                </div>

                {/* 관리자 프로필 영역 */}
                <div className="flex items-center">
                    <div className="text-right mr-3">
                        <p className="text-sm font-medium text-white">{user?.name || '관리자'}</p>
                        <p className="text-xs text-gray-400">{user?.email || '로그인 필요'}</p>
                    </div>
                    {/* 관리자 아바타 (원형, 이니셜 표시) */}
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {userInitial}
                    </div>
                </div>
            </div>
        </header>
    );
}

