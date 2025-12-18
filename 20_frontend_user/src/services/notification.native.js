import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 푸시 알림 서비스
 * 
 * 역할:
 * - 푸시 알림 권한 요청 및 관리
 * - 이상 거래 감지 시 실시간 알림
 * - 예정된 대형 지출 알림
 * - 알림 토큰 관리 및 백엔드 전송
 * 
 * 사용법:
 * import { 
 *   requestNotificationPermissions, 
 *   sendLocalNotification,
 *   scheduleAnomalyNotification 
 * } from '@/services/notification';
 * 
 * 백엔드 연동:
 * - Expo Push Token을 백엔드로 전송하여 서버에서 알림 발송
 * - 이상 거래 감지 시 백엔드에서 푸시 알림 트리거
 */

// 알림 버튼 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,    // 알림 표시
        shouldPlaySound: true,    // 소리 재생
        shouldSetBadge: true,     // 배지 표시
    }),
});

/**
 * 알림 권한 요청
 * 
 * @returns {Promise<boolean>} 권한 허용 여부
 * 
 * @example
 * const hasPermission = await requestNotificationPermissions();
 * if (hasPermission) {
 *   console.log('알림 권한 허용됨');
 * }
 */
export async function requestNotificationPermissions() {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // 권한이 없으면 요청
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('알림 권한이 거부되었습니다.');
            return false;
        }

        // Android 채널 설정 (Android 8.0 이상 필수)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#bfa094',
            });

            // 이상 거래 전용 채널
            await Notifications.setNotificationChannelAsync('anomaly', {
                name: '이상 거래 알림',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 250, 500],
                lightColor: '#ff0000',
                sound: 'default',
            });
        }

        return true;
    } catch (error) {
        console.error('알림 권한 요청 실패:', error);
        return false;
    }
}

/**
 * Expo Push Token 가져오기 및 백엔드 전송
 * 
 * TODO: 백엔드 API 연동 필수!
 * 
 * @returns {Promise<string|null>} Push Token
 * 
 * @example
 * // 백엔드 연동 방법:
 * const token = await registerForPushNotifications();
 * if (token) {
 *   // 백엔드로 토큰 전송
 *   await fetch('/api/users/register-push-token', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ pushToken: token }),
 *   });
 * }
 */
export async function registerForPushNotifications() {
    try {
        // 권한 확인
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            return null;
        }

        // Expo Push Token 가져오기
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push Token:', token);

        // AsyncStorage에 저장
        await AsyncStorage.setItem('pushToken', token);

        // TODO: 백엔드로 토큰 전송
        // await sendPushTokenToBackend(token);

        return token;
    } catch (error) {
        console.error('Push Token 등록 실패:', error);
        return null;
    }
}

/**
 * 로컬 알림 발송 (테스트용)
 * 
 * @param {Object} options - 알림 옵션
 * @param {string} options.title - 알림 제목
 * @param {string} options.body - 알림 내용
 * @param {Object} options.data - 추가 데이터
 * 
 * @example
 * await sendLocalNotification({
 *   title: '이상 거래 감지',
 *   body: '해외 결제 125만원이 감지되었습니다.',
 *   data: { transactionId: 123, type: 'anomaly' },
 * });
 */
export async function sendLocalNotification({ title, body, data = {} }) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // 즉시 발송
        });
    } catch (error) {
        console.error('로컬 알림 발송 실패:', error);
    }
}

/**
 * 이상 거래 알림 발송
 * 
 * @param {Object} transaction - 거래 정보
 * @param {string} transaction.merchant - 가맹점명
 * @param {number} transaction.amount - 금액
 * @param {string} transaction.reason - 의심 사유
 * 
 * @example
 * await scheduleAnomalyNotification({
 *   merchant: '해외 사이트',
 *   amount: 1250000,
 *   reason: '심야 시간 고액 결제',
 * });
 */
export async function scheduleAnomalyNotification(transaction) {
    const { merchant, amount, reason } = transaction;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '⚠️ 이상 거래 감지',
            body: `${merchant}에서 ${formatCurrency(amount)} 결제가 감지되었습니다.\n사유: ${reason}`,
            data: {
                type: 'anomaly',
                transaction,
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // 즉시 발송
    });
}

/**
 * 예정된 대형 지출 알림 스케줄링
 * 
 * @param {Object} prediction - 예측 정보
 * @param {string} prediction.category - 카테고리
 * @param {number} prediction.amount - 예상 금액
 * @param {Date} prediction.date - 예상 날짜
 * 
 * @example
 * await schedulePredictionNotification({
 *   category: '식비',
 *   amount: 150000,
 *   date: new Date(Date.now() + 86400000), // 내일
 * });
 */
export async function schedulePredictionNotification(prediction) {
    const { category, amount, date } = prediction;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '💡 예정된 지출 알림',
            body: `${category} 카테고리에서 ${formatCurrency(amount)} 지출이 예상됩니다.`,
            data: {
                type: 'prediction',
                prediction,
            },
        },
        trigger: {
            date: date,
        },
    });
}

/**
 * 알림 클릭 리스너 등록
 * 
 * @param {Function} callback - 알림 클릭 시 실행할 콜백
 * @returns {Subscription} 구독 객체
 * 
 * @example
 * const subscription = addNotificationResponseListener((response) => {
 *   const { type, transaction } = response.notification.request.content.data;
 *   
 *   if (type === 'anomaly') {
 *     navigation.navigate('AnomalyDetection', { transactionId: transaction.id });
 *   }
 * });
 * 
 * // 컴포넌트 언마운트 시 구독 해제
 * return () => subscription.remove();
 */
export function addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * 앱이 포그라운드에 있을 때 알림 수신 리스너
 * 
 * @param {Function} callback - 알림 수신 시 실행할 콜백
 * @returns {Subscription} 구독 객체
 * 
 * @example
 * const subscription = addNotificationReceivedListener((notification) => {
 *   console.log('알림 수신:', notification);
 * });
 */
export function addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * 모든 알림 취소
 */
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 특정 알림 취소
 * 
 * @param {string} notificationId - 알림 ID
 */
export async function cancelNotification(notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * 배지 숫자 설정 (iOS)
 * 
 * @param {number} count - 배지 숫자
 */
export async function setBadgeCount(count) {
    if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
    }
}

// ===== 헬퍼 함수 =====

/**
 * 금액 포맷팅
 */
function formatCurrency(amount) {
    return `${amount.toLocaleString()}원`;
}

/**
 * TODO: 백엔드로 Push Token 전송
 * 
 * @example
 * async function sendPushTokenToBackend(token) {
 *   try {
 *     const response = await fetch('/api/users/register-push-token', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'Authorization': `Bearer ${getAuthToken()}`,
 *       },
 *       body: JSON.stringify({
 *         pushToken: token,
 *         platform: Platform.OS,
 *       }),
 *     });
 * 
 *     if (!response.ok) {
 *       throw new Error('토큰 전송 실패');
 *     }
 *   } catch (error) {
 *     console.error('Push Token 전송 실패:', error);
 *   }
 * }
 */
