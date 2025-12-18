import React, { useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, ActivityIndicator, View, Platform } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { TransactionProvider } from './src/contexts/TransactionContext';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import DashboardScreen from './src/screens/DashboardScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import CouponScreen from './src/screens/CouponScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import MoreScreen from './src/screens/MoreScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import FindEmailScreen from './src/screens/FindEmailScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// 스플래시 스크린 유지
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
import { Feather } from '@expo/vector-icons';

const TabBarIcon = ({ name, focused, colors }) => {
  const icons = {
    '대시보드': { icon: 'home' },
    '거래내역': { icon: 'credit-card' },
    '쿠폰함': { icon: 'gift' },
    '프로필': { icon: 'user' },
    '더보기': { icon: 'more-horizontal' }
  };

  const iconData = icons[name] || { icon: 'help-circle' };
  const activeColor = colors?.tabBarActive || '#2563EB';
  const inactiveColor = colors?.tabBarInactive || '#64748B';

  return (
    <View style={{
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: focused ? activeColor + '15' : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
    }}>
      <Feather
        name={iconData.icon}
        size={22}
        color={focused ? activeColor : inactiveColor}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
};

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="대시보드"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabBarIcon name={route.name} focused={focused} colors={colors} />,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          marginTop: -4,
          marginBottom: 6,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 80,
          paddingTop: 8,
          shadowColor: colors.tabBarActive,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
        headerStyle: {
          backgroundColor: colors.headerBackground,
          borderBottomColor: colors.tabBarBorder,
          borderBottomWidth: 0,
          shadowColor: colors.tabBarActive,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontFamily: 'Inter_700Bold',
          fontSize: 18,
        },
      })}>
      <Tab.Screen name="대시보드" component={DashboardScreen} />
      <Tab.Screen name="거래내역" component={TransactionScreen} />
      <Tab.Screen name="쿠폰함" component={CouponScreen} />
      {/* 프로필 탭 제거 → 더보기에서 접근 */}
      <Tab.Screen name="더보기" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background }
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="FindEmail" component={FindEmailScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { colors, isDarkMode } = useTheme();
  const { user, loading, kakaoLogin } = useAuth();

  // 카카오 OAuth 콜백 처리 (웹 환경에서만)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const pathname = window.location.pathname;
      
      // /auth/kakao/callback 경로이거나 code가 있을 때 처리
      if (code && !user) {
        console.log('카카오 인증 코드 감지:', code);
        console.log('현재 경로:', pathname);
        // URL에서 code 파라미터 제거하고 메인으로 이동
        window.history.replaceState({}, document.title, '/');
        // 카카오 로그인 처리
        kakaoLogin(code);
      }
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: colors.text, fontFamily: 'Inter_400Regular' }}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'auto'} />
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="분석"
            component={AnalysisScreen}
            options={{
              headerShown: true,
              headerTitle: '지출 분석',
              headerStyle: { backgroundColor: colors.headerBackground },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: 'Inter_700Bold' },
              cardStyle: { flex: 1 },
            }}
          />
          {/* 프로필 화면 (더보기에서 접근) */}
          <Stack.Screen
            name="프로필"
            component={ProfileScreen}
            options={{
              headerShown: true,
              headerTitle: '프로필',
              headerStyle: { backgroundColor: colors.headerBackground },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: 'Inter_700Bold' },
              cardStyle: { flex: 1 },
            }}
          />
          {/* 설정 화면 */}
          <Stack.Screen
            name="설정"
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerTitle: '앱 설정',
              headerStyle: { backgroundColor: colors.headerBackground },
              headerTintColor: colors.text,
              headerTitleStyle: { fontFamily: 'Inter_700Bold' },
              cardStyle: { flex: 1 },
            }}
          />
        </Stack.Navigator>
      ) : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <AuthProvider>
          <TransactionProvider>
            <AppContent />
          </TransactionProvider>
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}
