/**
 * 입력 검증 유틸리티
 */

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효한 이메일 여부
 */
export function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 비밀번호 강도 검증
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validatePassword(password) {
    const errors = [];

    if (!password) {
        return { isValid: false, errors: ['비밀번호를 입력해주세요'] };
    }

    if (password.length < 8) {
        errors.push('최소 8자 이상이어야 합니다');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('대문자를 포함해야 합니다');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('소문자를 포함해야 합니다');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('숫자를 포함해야 합니다');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * 이름 검증 (한글 또는 영문)
 * @param {string} name - 검증할 이름
 * @returns {boolean} 유효한 이름 여부
 */
export function isValidName(name) {
    if (!name || name.trim().length < 2) return false;

    // 한글 또는 영문만 허용 (공백 포함)
    const nameRegex = /^[가-힣a-zA-Z\s]{2,}$/;
    return nameRegex.test(name);
}

/**
 * 전화번호 형식 검증
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} 유효한 전화번호 여부
 */
export function isValidPhone(phone) {
    if (!phone) return false;

    // 01X-XXXX-XXXX 또는 01XXXXXXXXX 형식
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone);
}

/**
 * 카드 번호 형식 검증 (간단한 체크)
 * @param {string} cardNumber - 검증할 카드 번호
 * @returns {boolean} 유효한 카드 번호 여부
 */
export function isValidCardNumber(cardNumber) {
    if (!cardNumber) return false;

    // 하이픈 제거
    const cleaned = cardNumber.replace(/[-\s]/g, '');

    // 13-19자리 숫자
    return /^[0-9]{13,19}$/.test(cleaned);
}

/**
 * 빈 문자열 또는 공백만 있는지 확인
 * @param {string} str - 확인할 문자열
 * @returns {boolean} 비어있는지 여부
 */
export function isEmpty(str) {
    return !str || str.trim().length === 0;
}

/**
 * 금액 범위 검증
 * @param {number} amount - 검증할 금액
 * @param {number} min - 최소 금액 (기본: 0)
 * @param {number} max - 최대 금액 (기본: 무제한)
 * @returns {boolean} 유효한 금액 범위 여부
 */
export function isValidAmount(amount, min = 0, max = Infinity) {
    if (typeof amount !== 'number' || isNaN(amount)) return false;
    return amount >= min && amount <= max;
}
