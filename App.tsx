import React, { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import './src/i18n';
import Navigation from './src/navigation';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      console.log('📝 [App] Fonts loaded:', fontsLoaded, 'Font error:', fontError);
      
      if (fontsLoaded) {
        Text.defaultProps = Text.defaultProps || {};
        Text.defaultProps.style = [
          { fontFamily: 'Inter_400Regular', color: '#F5F7FA' },
          Text.defaultProps.style,
        ];

        TextInput.defaultProps = TextInput.defaultProps || {};
        TextInput.defaultProps.style = [
          { fontFamily: 'Inter_400Regular', color: '#F5F7FA' },
          TextInput.defaultProps.style,
        ];
      } else {
        console.warn('⚠️  [App] Font loading failed, using system fonts');
      }

      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show app even if fonts fail to load (use system fonts as fallback)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SubscriptionProvider>
      <Navigation />
    </SubscriptionProvider>
  );
}
