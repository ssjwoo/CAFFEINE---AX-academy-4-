/**
 * 앱 전역 상수 정의
 */

// ==================== 색상 상수 ====================
export const COLORS = {
    // Primary & Accent
    PRIMARY: '#9C27B0',
    PRIMARY_DARK: '#7B1FA2',
    PRIMARY_LIGHT: '#E1BEE7',
    ACCENT: '#E91E63',
    ACCENT_LIGHT: '#FCE4EC',
    
    // Chart Colors (보라색/핑크 계열)
    CHART_MAGENTA: '#E91E63',
    CHART_PURPLE: '#9C27B0',
    CHART_PURPLE_LIGHT: '#AB47BC',
    CHART_PINK: '#F48FB1',
    CHART_LAVENDER: '#CE93D8',
    CHART_HOT_PINK: '#FF80AB',
};

export const CHART_COLORS = [
    COLORS.CHART_MAGENTA,
    COLORS.CHART_PURPLE,
    COLORS.CHART_PURPLE_LIGHT,
    COLORS.CHART_PINK,
    COLORS.CHART_LAVENDER,
    COLORS.CHART_HOT_PINK,
];

// ==================== 카테고리 상수 ====================
export const CATEGORIES = {
    SHOPPING: '쇼핑',
    FOOD: '식비',
    UTILITIES: '공과금',
    LEISURE: '여가',
    TRANSPORT: '교통',
    OTHER: '기타',
    HEALTHCARE: '의료',
    EDUCATION: '교육',
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export const CATEGORY_ICONS = {
    [CATEGORIES.SHOPPING]: '🛍️',
    [CATEGORIES.FOOD]: '🍔',
    [CATEGORIES.UTILITIES]: '💡',
    [CATEGORIES.LEISURE]: '🎮',
    [CATEGORIES.TRANSPORT]: '🚗',
    [CATEGORIES.OTHER]: '📦',
    [CATEGORIES.HEALTHCARE]: '🏥',
    [CATEGORIES.EDUCATION]: '📚',
};

// ==================== 카드 타입 상수 ====================
export const CARD_TYPES = {
    CREDIT: '신용',
    DEBIT: '체크',
};

// ==================== 위험도 레벨 ====================
export const RISK_LEVELS = {
    HIGH: '높음',
    MEDIUM: '중간',
    LOW: '낮음',
};

export const RISK_COLORS = {
    [RISK_LEVELS.HIGH]: '#f44336',
    [RISK_LEVELS.MEDIUM]: '#ff9800',
    [RISK_LEVELS.LOW]: '#ffc107',
};

export const RISK_ICONS = {
    [RISK_LEVELS.HIGH]: '🔴',
    [RISK_LEVELS.MEDIUM]: '🟡',
    [RISK_LEVELS.LOW]: '🟢',
};

// ==================== 애니메이션 상수 ====================
export const ANIMATION_DURATION = {
    FAST: 200,
    NORMAL: 400,
    SLOW: 600,
    VERY_SLOW: 1000,
};

export const ANIMATION_DELAY = {
    NONE: 0,
    SHORT: 100,
    MEDIUM: 200,
    LONG: 400,
    VERY_LONG: 600,
};

// ==================== 스켈레톤 상수 ====================
export const SKELETON_COUNT = {
    STATS: 3,
    TRANSACTIONS: 10,
    ANOMALIES: 5,
};

// ==================== API 상수 ====================
export const API_ENDPOINTS = {
    // Auth
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    VERIFY: '/auth/verify',

    // Dashboard
    DASHBOARD_SUMMARY: '/dashboard/summary',
    DASHBOARD_MONTHLY: '/dashboard/monthly-stats',
    DASHBOARD_CATEGORY: '/dashboard/category-stats',

    // Transactions
    TRANSACTIONS: '/transactions',
    TRANSACTION_NOTE: (id) => `/transactions/${id}/note`,
    TRANSACTION_MARK_ANOMALY: (id) => `/transactions/${id}/mark-anomaly`,

    // Anomalies
    ANOMALIES: '/anomalies',
    ANOMALY_MARK_NORMAL: (id) => `/anomalies/${id}/mark-normal`,
    ANOMALY_BLOCK_CARD: (id) => `/anomalies/${id}/block-card`,

    // User
    USER_ME: '/users/me',
    USER_EXPORT: '/users/export-data',
    USER_SYNC: '/users/sync',

    // AI
    AI_ANALYZE: '/ai/analyze-transaction',
    AI_INSIGHTS: '/ai/insights',
};

// ==================== 스토리지 키 ====================
export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    THEME: 'theme',
};

// ==================== 화면 이름 ====================
export const SCREEN_NAMES = {
    LOGIN: 'Login',
    SIGNUP: 'Signup',
    DASHBOARD: '대시보드',
    TRANSACTIONS: '거래내역',
    ANOMALIES: '이상탐지',
    PROFILE: '프로필',
};

// ==================== 검증 규칙 상수 ====================
export const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
};

// ==================== 기타 상수 ====================
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_SEARCH_RESULTS = 100;
export const CACHE_DURATION_MS = 5 * 60 * 1000; // 5분

// 빈 상태 메시지
export const EMPTY_MESSAGES = {
    NO_TRANSACTIONS: {
        icon: '💳',
        title: '첫 거래를 시작해보세요!',
        description: '아직 등록된 거래가 없습니다.',
    },
    NO_SEARCH_RESULTS: {
        icon: '🔍',
        title: '검색 결과를 찾을 수 없어요',
        description: '다른 검색어로 시도해보세요.',
    },
    NO_ANOMALIES: {
        icon: '🛡️',
        title: '안전해요!',
        description: '의심스러운 거래가 없습니다.',
    },
};
