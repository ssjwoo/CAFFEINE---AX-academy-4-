/**
 * ============================================================
 * 포맷팅 유틸리티 함수
 * ============================================================
 * 
 * 역할:
 * - 금액, 날짜, 숫자 등을 사용자 친화적인 형식으로 변환
 * - 대시보드, 차트, 테이블 등에서 일관된 포맷 사용
 * 
 * ============================================================
 */

/**
 * 금액을 한국 통화 형식으로 포맷팅
 * 
 * @example
 * formatCurrency(1234567) // "₩1,234,567"
 * formatCurrency(1000) // "₩1,000"
 * formatCurrency(-5000) // "-₩5,000"
 * 
 * @param amount - 포맷팅할 금액 (숫자)
 * @returns 포맷된 문자열
 */
export function formatCurrency(amount: number): string {
    // 음수 처리
    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);

    // 숫자를 천 단위로 구분
    const formatted = absoluteAmount.toLocaleString('ko-KR');

    // 음수면 마이너스 기호 추가
    return isNegative ? `-₩${formatted}` : `₩${formatted}`;
}

/**
 * 날짜를 한국 형식으로 포맷팅
 * 
 * @example
 * formatDate("2024-12-03") // "2024년 12월 3일"
 * formatDate(new Date()) // "2024년 12월 3일"
 * formatDate("2024-12-03T15:30:00") // "2024년 12월 3일"
 * 
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @param includeTime - 시간 포함 여부 (기본: false)
 * @returns 포맷된 문자열
 */
export function formatDate(date: string | Date, includeTime: boolean = false): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    // 유효하지 않은 날짜 처리
    if (isNaN(d.getTime())) {
        return '-';
    }

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    if (includeTime) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
    }

    return `${year}년 ${month}월 ${day}일`;
}

/**
 * 숫자를 축약된 형식으로 포맷팅 (K, M, B)
 * 
 * @example
 * formatNumber(1234) // "1.2K"
 * formatNumber(1234567) // "1.2M"
 * formatNumber(1234567890) // "1.2B"
 * 
 * @param num - 포맷팅할 숫자
 * @returns 포맷된 문자열
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1) + 'B';
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * 퍼센트 형식으로 포맷팅
 * 
 * @example
 * formatPercent(0.1234) // "12.34%"
 * formatPercent(0.5) // "50.00%"
 * 
 * @param value - 포맷팅할 값 (0~1 사이)
 * @param decimals - 소수점 자릿수 (기본: 2)
 * @returns 포맷된 문자열
 */
export function formatPercent(value: number, decimals: number = 2): string {
    return (value * 100).toFixed(decimals) + '%';
}

/**
 * 상대 시간 포맷팅 (몇 시간 전, 며칠 전 등)
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1시간 전"
 * formatRelativeTime(new Date(Date.now() - 86400000)) // "1일 전"
 * 
 * @param date - 포맷팅할 날짜
 * @returns 포맷된 문자열
 */
export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
}
