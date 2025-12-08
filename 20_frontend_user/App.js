import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, ActivityIndicator, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { TransactionProvider } from './src/contexts/TransactionContext';

import DashboardScreen from './src/screens/DashboardScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import CouponScreen from './src/screens/CouponScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabBarIcon = ({ name, focused }) => {
  const icons = {
    '대시보드': '📊',
    '거래내역': '💳',
    '쿠폰함': '🎟️',
    '프로필': '👤'
  };
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{icons[name] || ''}</Text>;
};

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="대시보드"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabBarIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
      })}>
      <Tab.Screen name="대시보드" component={DashboardScreen} />
      <Tab.Screen name="거래내역" component={TransactionScreen} />
      <Tab.Screen name="쿠폰함" component={CouponScreen} />
      <Tab.Screen name="프로필" component={ProfileScreen} />
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
    </Stack.Navigator>
  );
}

function AppContent() {
  const { colors, isDarkMode } = useTheme();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: colors.text }}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? 'light' : 'auto'} />
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
