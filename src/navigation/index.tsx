import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import EditScreen from '../screens/EditScreen';
import LoadingScreen from '../screens/LoadingScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PurchaseSuccessScreen from '../screens/PurchaseSuccessScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = '@moovia_onboarding_completed';

export default function Navigation() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingCompleted(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setIsOnboardingCompleted(false);
    }
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Wait for onboarding check
  if (isOnboardingCompleted === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isOnboardingCompleted ? 'Home' : 'Onboarding'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F5F5' }
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen 
          name="CategoryDetail" 
          component={CategoryDetailScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen 
          name="Edit" 
          component={EditScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen 
          name="Loading" 
          component={LoadingScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade'
          }}
        />
        <Stack.Screen 
          name="PurchaseSuccess" 
          component={PurchaseSuccessScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            gestureEnabled: false,
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
