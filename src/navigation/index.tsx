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
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import DebugSubscriptionScreen from '../screens/DebugSubscriptionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const ONBOARDING_KEY = '@moovia_onboarding_completed';

export default function Navigation() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [forceShowApp, setForceShowApp] = useState(false);

  useEffect(() => {
    checkOnboarding();
    
    // Failsafe: Force show app after 5 seconds if still loading
    // This prevents the app from being stuck on a blank screen
    const failsafeTimer = setTimeout(() => {
      if (isOnboardingCompleted === null) {
        console.warn('⚠️  [Navigation] Failsafe triggered: forcing app to show after timeout');
        setIsOnboardingCompleted(false); // Show onboarding by default
        setForceShowApp(true);
      }
    }, 5000);
    
    return () => clearTimeout(failsafeTimer);
  }, []);

  const checkOnboarding = async () => {
    try {
      console.log('🔍 [Navigation] Checking onboarding status...');
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      console.log('📱 [Navigation] Onboarding status:', value);
      setIsOnboardingCompleted(value === 'true');
    } catch (error) {
      console.error('❌ [Navigation] Error checking onboarding:', error);
      setIsOnboardingCompleted(false);
    }
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Wait for onboarding check (but not forever due to failsafe)
  if (isOnboardingCompleted === null && !forceShowApp) {
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
        <Stack.Screen 
          name="VideoPlayer" 
          component={VideoPlayerScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DebugSubscription"
          component={DebugSubscriptionScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
