/**
 * ============================================================
 * 이상 거래 타입 정의
 * ============================================================
 * 
 * 역할:
 * - 이상 거래 관련 타입 정의
 * - 위험도, 상태, 필터 등의 타입
 * 
 * 사용 위치:
 * - 이상 거래 페이지 (/consumption/anomalies)
 * - FilterPanel 컴포넌트
 * - AnomalyTable 컴포넌트
 * ============================================================
 */

/**
 * 위험도 레벨
 */
export type RiskLevel = '위험' | '경고' | '주의';

/**
 * 이상 거래 상태
 */
export type AnomalyStatus = 'pending' | 'approved' | 'rejected';

/**
 * 이상 거래 데이터 인터페이스
 */
export interface AnomalyData {
    /** 고유 ID */
    id: number;

    /** 카테고리 (예: 식비, 쇼핑 등) */
    category: string;

    /** 거래 금액 */
    amount: number;

    /** 거래 날짜 (YYYY-MM-DD) */
    date: string;

    /** 이상 탐지 사유 */
    reason: string;

    /** 위험도 레벨 */
    riskLevel: RiskLevel;

    /** 처리 상태 */
    status: AnomalyStatus;

    /** 사용자 ID */
    userId: string;

    /** 사용자 이름 */
    userName: string;

    /** 가맹점명 (선택적) */
    merchant?: string;

    /** 추가 메타데이터 (선택적) */
    metadata?: Record<string, any>;
}

/**
 * 이상 거래 통계
 */
export interface AnomalyStats {
    /** 총 이상 거래 건수 */
    totalCount: number;

    /** 위험 건수 */
    highRiskCount: number;

    /** 경고 건수 */
    mediumRiskCount: number;

    /** 주의 건수 */
    lowRiskCount: number;

    /** 총 금액 */
    totalAmount: number;

    /** 처리 대기 건수 */
    pendingCount: number;
}

/**
 * 이상 거래 필터 (API 요청용)
 */
export interface AnomalyFilter {
    /** 시작 날짜 */
    dateFrom?: string;

    /** 종료 날짜 */
    dateTo?: string;

    /** 위험도 레벨 */
    riskLevels?: RiskLevel[];

    /** 최소 금액 */
    amountMin?: number;

    /** 최대 금액 */
    amountMax?: number;

    /** 사용자 검색어 */
    userSearch?: string;

    /** 상태 필터 */
    status?: AnomalyStatus[];

    /** 페이지 번호 */
    page?: number;

    /** 페이지 크기 */
    pageSize?: number;
}
