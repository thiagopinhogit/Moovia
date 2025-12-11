import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');

type SplashScreenProps = {
  onFinish?: () => void;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Fade in the entire screen first
    Animated.timing(screenFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Slide up, fade in and scale animation for content (GIF + Text together)
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start fade out and finish after 2.5 seconds
    if (onFinish) {
      const timer = setTimeout(() => {
        // Fade out with scale down effect
        Animated.parallel([
          Animated.timing(screenFadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onFinish();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{ flex: 1, opacity: screenFadeAnim }}>
        <LinearGradient
          colors={COLORS.gradients.darkBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: contentFadeAnim,
                transform: [
                  { translateY: slideUpAnim },
                  { scale: scaleAnim }
                ],
              },
            ]}
          >
            {/* GIF animado */}
            <Image
              source={require('../../assets/images/splash-animation.gif')}
              style={styles.logo}
              resizeMode="contain"
            />
            
            {/* Nome do App */}
            <Text style={styles.appName}>
              Moovia
            </Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    maxWidth: 220,
    maxHeight: 220,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 4,
  },
});
