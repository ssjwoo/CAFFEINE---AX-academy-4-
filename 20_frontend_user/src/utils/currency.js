/**
 * 통화 포맷팅 유틸리티
 * 숫자를 한국 원화 형식으로 변환
 */

/**
 * 숫자를 천 단위 콤마로 포맷팅
 * @param {number} num - 포맷팅할 숫자
 * @returns {string} 포맷팅된 문자열 (예: "1,000")
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 숫자를 원화 형식으로 포맷팅
 * @param {number} num - 포맷팅할 숫자
 * @param {boolean} includeUnit - "원" 단위 포함 여부 (기본: true)
 * @returns {string} 포맷팅된 문자열 (예: "1,000원")
 */
export function formatCurrency(num, includeUnit = true) {
    if (num === null || num === undefined) return includeUnit ? '0원' : '0';
    const formatted = formatNumber(num);
    return includeUnit ? `${formatted}원` : formatted;
}

/**
 * 숫자를 간략한 형식으로 포맷팅 (억, 만 단위)
 * @param {number} num - 포맷팅할 숫자
 * @param {boolean} includeUnit - "원" 단위 포함 여부 (기본: true)
 * @returns {string} 포맷팅된 문자열 (예: "150만원")
 */
export function formatCompactCurrency(num, includeUnit = true) {
    if (num === null || num === undefined) return includeUnit ? '0원' : '0';

    let result;
    if (num >= 100000000) {
        // 억 단위
        const eok = (num / 100000000).toFixed(1);
        result = `${eok}억`;
    } else if (num >= 10000) {
        // 만 단위
        const man = Math.floor(num / 10000);
        result = `${man}만`;
    } else {
        result = formatNumber(num);
    }

    return includeUnit ? `${result}원` : result;
}

/**
 * 퍼센트 포맷팅
 * @param {number} num - 포맷팅할 숫자
 * @param {number} decimals - 소수점 자릿수 (기본: 1)
 * @returns {string} 포맷팅된 문자열 (예: "12.5%")
 */
export function formatPercent(num, decimals = 1) {
    if (num === null || num === undefined) return '0%';
    return `${num.toFixed(decimals)}%`;
}

/**
 * 금액과 카드 타입을 함께 표시
 * @param {number} amount - 금액
 * @param {string} cardType - 카드 타입 ('신용' 또는 '체크')
 * @returns {string} 포맷팅된 문자열 (예: "-15,000원 (신용)")
 */
export function formatAmountWithCardType(amount, cardType) {
    return `${formatCurrency(amount)} (${cardType})`;
}
