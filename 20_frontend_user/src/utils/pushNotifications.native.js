import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

// 앱 포그라운드 실행 시 알림 처리 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            Alert.alert('알림 권한 필요', '푸시 알림을 받으려면 권한이 필요합니다.');
            return null;
        }
        
        try {
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo Push Token:', token);
        } catch (e) {
            console.error('토큰 발급 실패:', e);
            Alert.alert('오류', '푸시 토큰을 가져올 수 없습니다.');
            return null;
        }
    } else {
        Alert.alert('에뮬레이터', '물리적 기기에서만 푸시 알림이 작동합니다.');
    }

    return token;
}
