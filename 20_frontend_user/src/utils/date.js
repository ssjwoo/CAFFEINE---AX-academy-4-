/**
 * 날짜 및 시간 포맷팅 유틸리티
 */

/**
 * ISO 날짜 문자열을 한국어 형식으로 변환
 * @param {string} dateString - ISO 날짜 문자열
 * @param {boolean} includeTime - 시간 포함 여부 (기본: false)
 * @returns {string} 포맷팅된 날짜 (예: "2024-11-29" 또는 "2024-11-29 10:30")
 */
export function formatDate(dateString, includeTime = false) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (!includeTime) {
        return `${year}-${month}-${day}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * ISO 날짜 문자열을 한글 형식으로 변환
 * @param {string} dateString - ISO 날짜 문자열
 * @param {boolean} includeTime - 시간 포함 여부 (기본: false)
 * @returns {string} 포맷팅된 날짜 (예: "2024년 11월 29일" 또는 "2024년 11월 29일 10시 30분")
 */
export function formatDateKorean(dateString, includeTime = false) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (!includeTime) {
        return `${year}년 ${month}월 ${day}일`;
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
}

/**
 * 상대적인 시간 표시 (몇 분 전, 몇 시간 전 등)
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 상대 시간 (예: "5분 전", "2시간 전")
 */
export function getRelativeTime(dateString) {
    if (!dateString) return '';

    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;

    return `${Math.floor(diffDays / 365)}년 전`;
}

/**
 * 시간대 정보를 포함한 시간 표시
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 시간 (예: "오전 10:30", "오후 3:45")
 */
export function formatTimeWithPeriod(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours % 12 || 12;

    return `${period} ${displayHours}:${minutes}`;
}

/**
 * 월-일 형식으로 변환
 * @param {string} dateString - ISO 날짜 문자열 또는 "YYYY-MM" 형식
 * @returns {string} "MM월" 형식 (예: "11월")
 */
export function formatMonth(dateString) {
    if (!dateString) return '';

    const parts = dateString.split('-');
    const month = parseInt(parts[1] || parts[0], 10);

    return `${month}월`;
}
