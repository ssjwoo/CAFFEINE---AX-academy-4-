import { Alert, Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') {
        // alert은 브라우저 기본 alert이 뜰 수 있음
        console.warn('푸시 알림은 모바일 앱에서만 지원됩니다.');
        alert('웹 브라우저에서는 푸시 알림을 지원하지 않습니다.');
    }
    return null;
}
