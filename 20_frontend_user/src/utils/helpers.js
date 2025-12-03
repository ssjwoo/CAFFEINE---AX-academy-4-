/**
 * 기타 유틸리티 함수들
 */

/**
 * 문자열 자르기 (ellipsis)
 * @param {string} str - 자를 문자열
 * @param {number} maxLength - 최대 길이
 * @returns {string} 잘린 문자열 (예: "긴 문자열...")
 */
export function truncate(str, maxLength = 20) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 랜덤 ID 생성
 * @param {number} length - ID 길이 (기본: 8)
 * @returns {string} 랜덤 ID
 */
export function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 깊은 복사
 * @param {*} obj - 복사할 객체
 * @returns {*} 복사된 객체
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 배열을 청크로 나누기
 * @param {Array} array - 나눌 배열
 * @param {number} size - 청크 크기
 * @returns {Array[]} 청크 배열
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * 객체에서 특정 키만 추출
 * @param {Object} obj - 원본 객체
 * @param {Array} keys - 추출할 키 배열
 * @returns {Object} 추출된 객체
 */
export function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * 객체에서 특정 키 제외
 * @param {Object} obj - 원본 객체
 * @param {Array} keys - 제외할 키 배열
 * @returns {Object} 결과 객체
 */
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}

/**
 * Sleep 함수 (async/await용)
 * @param {number} ms - 대기 시간 (ms)
 * @returns {Promise} Promise 객체
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 배열을 특정 키로 그룹화
 * @param {Array} array - 그룹화할 배열
 * @param {string} key - 그룹화 기준 키
 * @returns {Object} 그룹화된 객체
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}
