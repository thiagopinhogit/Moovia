import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Alert,
  AlertButton,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { generateImage } from '../services/api';
import { saveToHistory } from '../services/history';
import COLORS from '../constants/colors';

const { width } = Dimensions.get('window');

type LoadingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Loading'>;
  route: RouteProp<RootStackParamList, 'Loading'>;
};

export default function LoadingScreen({ navigation, route }: LoadingScreenProps) {
  const { imageUri, description, effect } = route.params;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Create sparkle animations
  const sparkleAnims = useRef(
    [...Array(8)].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const handleGenerateImage = async () => {
    console.log('🚀 [LoadingScreen] Starting image generation...');
    console.log('📋 [LoadingScreen] Params:', {
      imageUri: imageUri?.substring(0, 50) + '...',
      description,
      effectId: effect?.id,
    });
    
    try {
      const result = await generateImage({
        imageUri,
        description,
        effectId: effect?.id,
      });
      
      console.log('📦 [LoadingScreen] Generation result:', {
        success: result.success,
        hasImageUrl: !!result.imageUrl,
        hasError: !!result.error,
        errorLength: result.error?.length || 0,
      });

      if (result.success && result.imageUrl) {
        console.log('✅ [LoadingScreen] Generation successful!');
        // Save to history
        await saveToHistory(result.imageUrl, description);
        
        // Success - navigate to Edit screen with the generated image
        navigation.replace('Edit', { 
          imageUri: result.imageUrl,
          effect: effect 
        });
      } else {
        // Make sure we always have a meaningful error message
        const errorMsg = result.error && result.error.trim() !== '' 
          ? result.error 
          : 'Failed to generate image. Please try again.';
        
        console.error('❌ [LoadingScreen] Generation failed with error:', errorMsg);
        showErrorAlert(errorMsg);
      }
    } catch (error) {
      console.error('❌ [LoadingScreen] Unexpected error:', error);
      console.error('❌ [LoadingScreen] Error type:', error?.constructor?.name);
      console.error('❌ [LoadingScreen] Error stack:', error instanceof Error ? error.stack : 'N/A');
      
      let errorMessage = 'An unexpected error occurred while generating your image. Please check your internet connection and try again.';
      
      if (error instanceof Error) {
        if (error.message && error.message.trim() !== '') {
          errorMessage = error.message;
          console.error('❌ [LoadingScreen] Using error message:', errorMessage);
        }
      }
      
      showErrorAlert(errorMessage);
    }
  };

  const showErrorAlert = (errorMessage: string) => {
    // Ensure we have a valid error message
    const safeErrorMessage = errorMessage && errorMessage.trim() !== '' 
      ? errorMessage 
      : 'An unexpected error occurred. Please try again.';
    const normalizedError = safeErrorMessage.toLowerCase();
    const isRateLimitError = normalizedError.includes('429') || normalizedError.includes('rate limit');
    
    console.log('⚠️ [LoadingScreen] Showing error alert:', safeErrorMessage);
    
    // Determine error type for better messaging
    let title = 'Generation Failed';
    let userFriendlyMessage = '';
    
    if (safeErrorMessage.includes('timeout') || safeErrorMessage.includes('Timeout') || safeErrorMessage.includes('timed out')) {
      title = 'Request Timeout';
      userFriendlyMessage = 'The image generation took too long. This might be due to a slow connection or a complex request.';
    } else if (safeErrorMessage.includes('Network') || safeErrorMessage.includes('network') || safeErrorMessage.includes('Failed to fetch')) {
      title = 'Network Error';
      userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    } else if (safeErrorMessage.includes('API') || safeErrorMessage.includes('401') || safeErrorMessage.includes('403') || safeErrorMessage.includes('authentication')) {
      title = 'Service Error';
      userFriendlyMessage = 'There was an issue connecting to the AI service. This could be due to high server load or network issues.';
    } else if (safeErrorMessage.includes('404') || safeErrorMessage.includes('not found')) {
      title = 'Service Error';
      userFriendlyMessage = 'The AI service is temporarily unavailable. Please try again in a few moments.';
    } else if (safeErrorMessage.includes('400') || safeErrorMessage.includes('Bad Request')) {
      title = 'Invalid Request';
      userFriendlyMessage = 'Your request could not be processed. Please try with a different image or description.';
    } else if (safeErrorMessage.includes('500') || safeErrorMessage.includes('502') || safeErrorMessage.includes('503')) {
      title = 'Server Error';
      userFriendlyMessage = 'The server is temporarily unavailable. Please try again in a few moments.';
    } else if (safeErrorMessage.includes('Unable to generate') || safeErrorMessage.includes('could not generate')) {
      title = 'Generation Failed';
      userFriendlyMessage = safeErrorMessage; // Use the specific message from API
    } else {
      userFriendlyMessage = 'Something went wrong during image generation. Please check your internet connection and try again.';
    }

    // For development/debugging: show technical details
    // For production: just show user-friendly message
    const fullMessage = __DEV__ && safeErrorMessage !== userFriendlyMessage
      ? `${userFriendlyMessage}\n\nDetails: ${safeErrorMessage}`
      : userFriendlyMessage;

    const buttons: AlertButton[] = [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          console.log('🔙 [LoadingScreen] User cancelled, navigating back');
          navigation.goBack();
        },
      },
    ];

    if (!isRateLimitError) {
      buttons.push({
        text: 'Retry',
        onPress: () => {
          console.log('🔄 [LoadingScreen] User requested retry');
          handleGenerateImage();
        },
      });
    }

    Alert.alert(
      title,
      fullMessage,
      buttons,
      { cancelable: false }
    );
  };

  useEffect(() => {
    // Logo pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Sparkle animations
    sparkleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: -50,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Fade in
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start image generation ONLY ONCE
    handleGenerateImage();
  }, []); // Empty dependency array - run only once on mount

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={COLORS.gradients.main}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: opacityAnim }]}>
          {/* Magic Circle with Sparkles */}
          <View style={styles.magicContainer}>
            {/* Rotating outer ring */}
            <Animated.View
              style={[
                styles.outerRing,
                { transform: [{ rotate: rotation }, { scale: scaleAnim }] },
              ]}
            />
            
            {/* Sparkles */}
            {sparkleAnims.map((anim, index) => {
              const angle = (index * 360) / sparkleAnims.length;
              const radius = 80;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.sparkle,
                    {
                      left: width / 2 + x - 6,
                      top: '50%',
                      opacity: anim.opacity,
                      transform: [
                        { translateY: anim.translateY },
                        { scale: anim.scale },
                      ],
                    },
                  ]}
                >
                  <View style={styles.sparkleShape} />
                </Animated.View>
              );
            })}
            
            {/* Center logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View style={styles.logo}>
                <Text style={styles.logoText}>L</Text>
              </View>
            </Animated.View>
          </View>

          {/* Text */}
          <Text style={styles.brandText}>Moovia</Text>
          <Text style={styles.loadingText}>Creating magic</Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  magicContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  sparkleShape: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.brand.cyan,
    borderRadius: 6,
    shadowColor: COLORS.brand.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  brandText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
    letterSpacing: 2,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

