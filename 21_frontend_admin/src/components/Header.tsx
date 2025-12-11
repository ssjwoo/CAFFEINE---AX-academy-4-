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
 * 
 * 팀원들이 수정할 부분:
 * - 새 페이지 추가 시: pageTitles와 pageDescriptions에 경로 추가
 * - 관리자 정보 변경: 42-48번 줄의 이메일/이름 수정
 * ============================================================
 */

"use client";

import { usePathname } from 'next/navigation';

/**
 * ============================================================
 * 페이지별 제목 매핑 객체
 * ============================================================
 * 새로운 페이지를 만들 때 여기에 추가하세요!
 * 
 * 형식: '/경로': '페이지 제목'
 * 
 * 예시: 
 * '/my-new-page': '내 새로운 페이지',
 * ============================================================
 */
const pageTitles: { [key: string]: string } = {
    '/': '대시보드',                          // 메인 대시보드
    '/age-analysis': '연령대별 소비 분석',    // 연령대 분석 페이지
    '/consumption': '소비 분석',              // 소비 분석 메인
    '/consumption/anomalies': '이상 거래 탐지',  // 이상 거래 탐지 (서브 페이지)
    '/summary': '분석 요약',                  // 요약 리포트
    '/settings': '설정',                      // 설정 페이지
};

/**
 * ============================================================
 * 페이지별 설명 매핑 객체
 * ============================================================
 * pageTitles와 매칭되는 설명을 여기에 추가하세요
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
 * 모든 페이지 상단에 고정되는 헤더 컴포넌트
 * ========================================
 */
export default function Header() {
    // 현재 URL 경로 가져오기 (예: '/consumption/anomalies')
    const pathname = usePathname();

    // 현재 경로에 맞는 제목 찾기 (없으면 기본값 '대시보드')
    const title = pageTitles[pathname] || '대시보드';

    // 현재 경로에 맞는 설명 찾기
    const description = pageDescriptions[pathname] || '';

    return (
        /**
         * 헤더 전체 컨테이너
         * - 고정 위치 (fixed)
         * - 사이드바 너비(256px) 만큼 왼쪽 여백
         * - 상단에 고정 (z-index: 10)
         */
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
                    {/* 관리자 정보 (이름, 이메일) */}
                    <div className="text-right mr-3">
                        {/* 
                         * ⭐ 팀원 TODO: 백엔드 연동 시 수정 필요 ⭐
                         * 현재: 하드코딩된 값
                         * 수정 방법:
                         * 1. 로그인한 관리자 정보를 Context나 Store에서 가져오기
                         * 2. 예: const { admin } = useAuth();
                         * 3. {admin.name}, {admin.email}로 변경
                         */}
                        <p className="text-sm font-medium text-white">관리자</p>
                        <p className="text-xs text-gray-400">admin@smartwallet.com</p>
                    </div>
                    {/* 관리자 아바타 (원형, 이니셜 표시) */}
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        A
                    </div>
                </div>
            </div>
        </header>
    );
}
