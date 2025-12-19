/**
 * Web용 Dummy Notification Service
 * 웹 브라우저에서는 expo-notifications를 지원하지 않으므로 빈 함수로 대체
 */

export async function requestNotificationPermissions() {
    console.log('Web: Notifications not supported');
    return false;
}

export async function registerForPushNotifications() {
    return null;
}

export async function sendLocalNotification() {}

export async function scheduleAnomalyNotification() {}

export async function schedulePredictionNotification() {}

export function addNotificationResponseListener() {
    return { remove: () => {} };
}

export function addNotificationReceivedListener() {
    return { remove: () => {} };
}

export async function cancelAllNotifications() {}

export async function cancelNotification() {}

export async function setBadgeCount() {}
