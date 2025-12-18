/**
 * PII Masking Utility Functions
 * 개인정보 보호를 위한 마스킹 함수들
 */

/**
 * 이메일 마스킹
 * - 아이디 앞 3글자만 노출, 나머지는 * 처리
 * - 도메인은 그대로 노출
 * @example maskEmail("wjswhddls277@naver.com") => "wjs*********@naver.com"
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;

    const [localPart, domain] = email.split('@');

    if (localPart.length <= 3) {
        // 3글자 이하: 첫 글자만 노출
        return localPart.charAt(0) + '*'.repeat(localPart.length - 1) + '@' + domain;
    }

    // 앞 3글자 + 나머지 마스킹
    const visiblePart = localPart.substring(0, 3);
    const maskedPart = '*'.repeat(localPart.length - 3);

    return visiblePart + maskedPart + '@' + domain;
}

/**
 * 생년월일 마스킹
 * 예: 2000-01-15 → 20**.**.**
 * @param birthDate - 생년월일 (문자열 또는 Date 객체)
 */
export function maskBirthDate(birthDate: string | Date | null | undefined): string {
    if (!birthDate) return 'N/A';

    try {
        const dateStr = typeof birthDate === 'string' ? birthDate : birthDate.toISOString();
        const year = dateStr.substring(0, 4);
        const yearPrefix = year.substring(0, 2); // 앞 2자리 (예: "20")

        return `${yearPrefix}**.**.**`;
    } catch (error) {
        return 'N/A';
    }
}

/**
 * 이름 마스킹
 * - 2글자: 뒤 1글자 마스킹 (예: 김철 → 김*)
 * - 3글자 이상: 가운데만 마스킹 (예: 홍길동 → 홍*동, 남궁민수 → 남궁*수)
 */
export function maskName(name: string): string {
    if (!name) return name;

    const length = name.length;

    if (length === 1) {
        return name;
    } else if (length === 2) {
        return name.charAt(0) + '*';
    } else if (length === 3) {
        return name.charAt(0) + '*' + name.charAt(2);
    } else {
        // 4글자 이상: 앞/뒤 1글자씩 노출, 중간 마스킹
        const firstChar = name.charAt(0);
        const lastChar = name.charAt(length - 1);
        const middleMask = '*'.repeat(length - 2);
        return firstChar + middleMask + lastChar;
    }
}

/**
 * 전화번호 마스킹
 * - 가운데 4자리를 **** 처리
 * - 하이픈 포함/미포함 모두 처리
 * @example maskPhone("010-1234-5678") => "010-****-5678"
 * @example maskPhone("01012345678") => "010****5678"
 */
export function maskPhone(phone: string): string {
    if (!phone) return phone;

    // 하이픈 제거
    const digits = phone.replace(/-/g, '');

    if (digits.length === 11) {
        // 010-1234-5678 형식
        const part1 = digits.substring(0, 3);
        const part3 = digits.substring(7, 11);

        if (phone.includes('-')) {
            return `${part1}-****-${part3}`;
        } else {
            return `${part1}****${part3}`;
        }
    } else if (digits.length === 10) {
        // 02-1234-5678 형식 (서울)
        const part1 = digits.substring(0, 2);
        const part3 = digits.substring(6, 10);

        if (phone.includes('-')) {
            return `${part1}-****-${part3}`;
        } else {
            return `${part1}****${part3}`;
        }
    }

    // 형식이 맞지 않으면 원본 반환
    return phone;
}
