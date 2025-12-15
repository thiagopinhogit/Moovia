import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import VideoCard from '../components/VideoCard';
import { useSubscription } from '../context/SubscriptionContext';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');
const CAROUSEL_CARD_WIDTH = width * 0.36;
const CAROUSEL_GAP = 14;
const SAMPLE_VIDEO = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const STORAGE_KEY = '@moovia_onboarding_completed';

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const marqueeTranslate = useRef(new Animated.Value(0)).current;
  const tutorialTitleAnim = useRef(new Animated.Value(1)).current;
  const tutorialImageAnim = useRef(new Animated.Value(1)).current;
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { isPro, showPaywall } = useSubscription();

  // Define onboarding pages
  const pages = [
    {
      id: '1',
      type: 'welcome',
      title: 'Edit anything with Moovia',
      image1: require('../../assets/images/categories/ai-boyfriend/before.jpg'),
      image2: require('../../assets/images/categories/ai-boyfriend/after.jpg'),
    },
    {
      id: '2',
      type: 'tutorial',
      slides: [
        {
          title: t('onboarding.tutorial.step1.title'),
          image: require('../../assets/images/categories/ai-boyfriend/before.jpg'),
        },
        {
          title: t('onboarding.tutorial.step2.title'),
          description: t('onboarding.tutorial.step2.description'),
          image: require('../../assets/images/categories/ai-boyfriend/before.jpg'),
        },
        {
          title: t('onboarding.tutorial.step3.title'),
          image: require('../../assets/images/categories/ai-boyfriend/after.jpg'),
        },
      ],
    },
  ];

  const [tutorialIndex, setTutorialIndex] = useState(0);

  const carouselItems = useMemo(
    () => [
      {
        id: 'c1',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/ai-boyfriend/after.jpg'),
        label: 'AI Boyfriend',
      },
      {
        id: 'c2',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/tattoo-try-on/after.jpg'),
        label: 'Tattoo Try-On',
      },
      {
        id: 'c3',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/fat-pet/after.jpg'),
        label: 'Fat Pet',
      },
      {
        id: 'c4',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/hairstyle-change/after.jpg'),
        label: 'Hairstyle Change',
      },
      {
        id: 'c5',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/plumber/after.jpg'),
        label: 'Plumber',
      },
      {
        id: 'c6',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/homeless/after.jpg'),
        label: 'Homeless',
      },
      {
        id: 'c7',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/crashed-car/after.jpg'),
        label: 'Crashed Car',
      },
    ],
    []
  );

  useEffect(() => {
    const totalWidth = (CAROUSEL_CARD_WIDTH + CAROUSEL_GAP) * carouselItems.length;
    marqueeTranslate.setValue(0);
    const animation = Animated.loop(
      Animated.timing(marqueeTranslate, {
        toValue: -totalWidth,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [carouselItems.length, marqueeTranslate]);

  // Animate tutorial title and image on slide change
  useEffect(() => {
    tutorialTitleAnim.setValue(0);
    tutorialImageAnim.setValue(0);
    Animated.parallel([
      Animated.timing(tutorialTitleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(tutorialImageAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Typing animation for step 2
    if (tutorialIndex === 1) {
      const fullText = t('onboarding.tutorial.step2.description');
      setTypedText('');
      setIsTyping(true);
      
      let currentChar = 0;
      const typingInterval = setInterval(() => {
        if (currentChar < fullText.length) {
          setTypedText(fullText.substring(0, currentChar + 1));
          // Haptic feedback for each character
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          currentChar++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, 100); // 100ms per character

      return () => {
        clearInterval(typingInterval);
        setIsTyping(false);
      };
    } else {
      setTypedText('');
      setIsTyping(false);
    }
  }, [tutorialIndex, tutorialTitleAnim, tutorialImageAnim, t]);

  const handleNext = async () => {
    if (currentIndex === 0) {
      // Move to tutorial page
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentIndex(1);
      flatListRef.current?.scrollToIndex({ index: 1, animated: true });
    } else {
      // Tutorial page - check if we need to go to next tutorial slide
      const tutorialSlides = pages[1].slides || [];
      if (tutorialIndex < tutorialSlides.length - 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTutorialIndex(tutorialIndex + 1);
      } else {
        // Trigger onboarding-specific paywall before finishing onboarding
        if (!isPro) {
          try {
            await showPaywall('onboarding');
          } catch (error) {
            console.error('Error showing onboarding paywall:', error);
          }
        }

        // Finish onboarding
        await completeOnboarding();
      }
    }
  };

  const handleBack = () => {
    if (currentIndex === 1 && tutorialIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTutorialIndex(tutorialIndex - 1);
    } else if (currentIndex === 1 && tutorialIndex === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    }
  };

  const completeOnboarding = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      navigation.replace('Home');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigation.replace('Home');
    }
  };

  const renderWelcomePage = () => (
    <View style={styles.pageContainer}>
      <LinearGradient
        colors={COLORS.gradients.darkBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeContainer}
      >
        <StatusBar barStyle="light-content" />
        
        <SafeAreaView edges={['top']} style={styles.welcomeSafeArea}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeTop}>
              {/* Infinite Before/After carousel */}
              <View style={styles.carouselContainer}>
                <Animated.View
                  style={[
                    styles.carouselRow,
                    { transform: [{ translateX: marqueeTranslate }] },
                  ]}
                >
                  {[...carouselItems, ...carouselItems].map((item, idx) => {
                    return (
                      <View key={`${item.id}-${idx}`} style={{ marginRight: CAROUSEL_GAP }}>
                        <VideoCard
                          videoUri={item.video}
                          poster={item.poster}
                          title={item.label}
                          width={CAROUSEL_CARD_WIDTH}
                          height={CAROUSEL_CARD_WIDTH * 1.78}
                        />
                      </View>
                    );
                  })}
                </Animated.View>
              </View>

              {/* Title */}
              <Text style={styles.welcomeTitle}>{pages[0].title}</Text>
              
              {/* Wand GIF */}
              <Image
                source={require('../../assets/images/splash-animation.gif')}
                style={styles.wandGif}
                resizeMode="contain"
              />
            </View>

            <View style={styles.welcomeBottom}>
              {/* Get Started Button */}
              <TouchableOpacity
                style={styles.getStartedButtonWrapper}
                onPress={handleNext}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#5B3F9E', '#3D2B7A', '#2A1A5E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.getStartedButton}
                >
                  <Text style={styles.getStartedButtonText}>{t('onboarding.welcome.button')}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Footer Text */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  {t('onboarding.welcome.footer')}{' '}
                </Text>
                <View style={styles.footerLinks}>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>{t('onboarding.welcome.terms')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerText}> {t('onboarding.welcome.and')} </Text>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>{t('onboarding.welcome.privacy')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderTutorialPage = () => {
    const tutorialSlides = pages[1].slides || [];
    const currentSlide = tutorialSlides[tutorialIndex];
    const isLastSlide = tutorialIndex === tutorialSlides.length - 1;

    return (
      <View style={styles.pageContainer}>
        <LinearGradient
          colors={COLORS.gradients.darkBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tutorialContainer}
        >
          <StatusBar barStyle="light-content" />
          
          {/* Back/Next indicators */}
          <SafeAreaView edges={['top']} style={styles.tutorialHeader}>
            {tutorialIndex > 0 || currentIndex > 0 ? (
              <TouchableOpacity onPress={handleBack} style={styles.navButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.navButton} />
            )}

            {/* Dots indicator */}
            <View style={styles.dotsContainer}>
              {tutorialSlides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === tutorialIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            {!isLastSlide && (
              <TouchableOpacity onPress={handleNext} style={styles.navButton}>
                <Ionicons name="arrow-forward" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
            {isLastSlide && <View style={styles.navButton} />}
          </SafeAreaView>

          {/* Main Image */}
          <Animated.View 
            style={[
              styles.tutorialImageContainer,
              {
                opacity: tutorialImageAnim,
                transform: [
                  {
                    scale: tutorialImageAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                  {
                    translateX: tutorialImageAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={currentSlide.image}
              style={styles.tutorialImage}
              resizeMode="cover"
            />
            {tutorialIndex === 1 && (
              <View style={styles.textBubble}>
                <Text style={styles.textBubbleText}>
                  {typedText}
                  {isTyping && <Text style={styles.cursor}>|</Text>}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Title */}
          <Animated.Text 
            style={[
              styles.tutorialTitle,
              {
                opacity: tutorialTitleAnim,
                transform: [
                  {
                    translateY: tutorialTitleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: tutorialTitleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {currentSlide.title}
          </Animated.Text>

          {/* Next Button */}
          <SafeAreaView edges={['bottom']} style={styles.tutorialFooter}>
            <TouchableOpacity
              style={styles.nextButtonWrapper}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#5B3F9E', '#3D2B7A', '#2A1A5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>
                  {isLastSlide ? t('onboarding.tutorial.finish') : t('onboarding.tutorial.next')}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  };

  const renderPage = ({ item, index }: { item: any; index: number }) => {
    if (item.type === 'welcome') {
      return renderWelcomePage();
    }
    return renderTutorialPage();
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  pageContainer: {
    width,
    height,
  },
  // Welcome Page Styles
  welcomeContainer: {
    flex: 1,
  },
  welcomeSafeArea: {
    flex: 1,
    paddingTop: 32,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  welcomeTop: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  welcomeBottom: {
    paddingHorizontal: 40,
    paddingBottom: 30,
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text.primary,
    paddingHorizontal: 28,
    marginTop: 44,
    marginBottom: 16,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  wandGif: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 24,
  },
  getStartedButtonWrapper: {
    paddingHorizontal: 0,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#663CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  footerLink: {
    fontSize: 13,
    color: COLORS.brand.cyan,
    textDecorationLine: 'underline',
  },
  carouselContainer: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Tutorial Page Styles
  tutorialContainer: {
    flex: 1,
  },
  tutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.surface.secondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.brand.cyan,
    width: 24,
  },
  dotInactive: {
    backgroundColor: COLORS.opacity.white30,
  },
  tutorialImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
    maxHeight: height * 0.5,
    borderRadius: 20,
    backgroundColor: COLORS.surface.secondary,
    shadowColor: COLORS.brand.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: COLORS.opacity.violet20,
  },
  textBubble: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: COLORS.surface.elevated,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.brand.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width * 0.7,
    borderWidth: 1,
    borderColor: COLORS.opacity.cyan20,
  },
  textBubbleText: {
    fontSize: 15,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  cursor: {
    color: COLORS.brand.cyan,
    fontWeight: '600',
  },
  tutorialTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text.primary,
    paddingHorizontal: 40,
    paddingVertical: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  tutorialFooter: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  nextButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#663CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButton: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
