# 사용자 앱 기능 추가 설치 가이드

##  추가된 기능

1. **에러 바운더리 (Error Boundary)** 
2. **푸시 알림 시스템** 

---

##  필수 패키지 설치

### 1. Expo Notifications 설치

터미널에서 실행:

```bash
cd "c:\Users\hi\Desktop\1129\caffeine-app -\20_frontend_user"
npx expo install expo-notifications
```

### 2. 설치 확인

`package.json`에 다음이 추가되었는지 확인:

```json
{
  "dependencies": {
    "expo-notifications": "~0.latest",
    "@react-native-async-storage/async-storage": "^2.2.0"  // 이미 있음
  }
}
```

---

##  사용 방법

### 1. 에러 바운더리 (자동 적용됨)

**파일**: `src/components/ErrorBoundary.js`

이미 `App.js`에 적용되어 있어서 별도 작업 불필요!

```javascript
// App.js에 이미 적용됨
<ErrorBoundary>
  <ThemeProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ThemeProvider>
</ErrorBoundary>
```

**테스트 방법**:
```javascript
// 아무 컴포넌트에서 에러 발생시켜보기
throw new Error('테스트 에러');
//  흰 화면 대신 친절한 에러 화면 표시됨!
```

---

### 2. 푸시 알림 시스템

**파일**: `src/services/notification.js`

#### A. 앱 시작 시 권한 요청

`App.js` 또는 `DashboardScreen.js`에 추가:

```javascript
import { useEffect } from 'react';
import { 
  requestNotificationPermissions, 
  registerForPushNotifications 
} from './src/services/notification';

function AppContent() {
  useEffect(() => {
    // 앱 시작 시 알림 권한 요청 및 토큰 등록
    (async () => {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        const token = await registerForPushNotifications();
        console.log('Push Token:', token);
        // TODO: 백엔드로 토큰 전송
      }
    })();
  }, []);

  // ...rest of code
}
```

#### B. 이상 거래 알림 발송

```javascript
import { scheduleAnomalyNotification } from '@/services/notification';

// 이상 거래 감지 시
await scheduleAnomalyNotification({
  merchant: '해외 사이트',
  amount: 1250000,
  reason: '심야 시간 고액 결제',
});
```

#### C. 알림 클릭 처리

```javascript
import { addNotificationResponseListener } from '@/services/notification';

useEffect(() => {
  const subscription = addNotificationResponseListener((response) => {
    const { type, transaction } = response.notification.request.content.data;
    
    if (type === 'anomaly') {
      navigation.navigate('AnomalyDetection', { 
        transactionId: transaction.id 
      });
    }
  });

  return () => subscription.remove();
}, []);
```

---

##  백엔드 연동 가이드

### 1. Push Token 전송

`src/services/notification.js`의 TODO 부분:

```javascript
// registerForPushNotifications() 함수에서
const token = (await Notifications.getExpoPushTokenAsync()).data;

// 백엔드로 전송
await fetch('YOUR_BACKEND_URL/api/users/register-push-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}`,
  },
  body: JSON.stringify({
    pushToken: token,
    platform: Platform.OS, // 'ios' 또는 'android'
  }),
});
```

### 2. 백엔드에서 알림 발송

백엔드 API 예시 (FastAPI):

```python
import requests

def send_push_notification(push_token: str, title: str, body: str, data: dict):
    message = {
        "to": push_token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data,
    }
    
    response = requests.post(
        'https://exp.host/--/api/v2/push/send',
        headers={
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        json=message
    )
    
    return response.json()

# 사용 예시
send_push_notification(
    push_token="ExponentPushToken[xxx]",
    title=" 이상 거래 감지",
    body="해외 결제 125만원이 감지되었습니다.",
    data={"type": "anomaly", "transactionId": 123}
)
```

---

##  테스트 방법

### 1. 로컬 알림 테스트

```javascript
import { sendLocalNotification } from '@/services/notification';

// 버튼 클릭 시 테스트
<Button 
  title="알림 테스트" 
  onPress={() => {
    sendLocalNotification({
      title: '테스트 알림',
      body: '푸시 알림이 정상 작동합니다!',
    });
  }}
/>
```

### 2. 실제 디바이스에서 테스트

```bash
# Expo Go 앱 실행
npm start

# QR 코드 스캔 후 알림 권한 허용
# 알림 테스트 버튼 클릭
```

---

##  주의사항

### iOS
- 실제 디바이스에서만 푸시 알림 테스트 가능 (시뮬레이터 X)
- Apple Developer 계정 필요 (프로덕션 배포 시)

### Android
- 에뮬레이터에서도 테스트 가능
- Android 8.0+ 에서는 Notification Channel 필수 (이미 구현됨)

### Expo Go 제한사항
- Expo Go 앱에서는 백그라운드 알림 제한적
- 프로덕션 빌드에서는 정상 작동

---

##  추가 리소스

- [Expo Notifications 공식 문서](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)

---

##  완료 체크리스트

- [ ] `expo-notifications` 패키지 설치
- [ ] `App.js`에서 알림 권한 요청 코드 추가
- [ ] 실제 디바이스에서 테스트
- [ ] 백엔드에 Push Token 전송 API 구현
- [ ] 이상 거래 감지 시 알림 발송 로직 추가
