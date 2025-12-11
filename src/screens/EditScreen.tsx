import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  AlertButton,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import { generateImage } from '../services/api';
import { saveToHistory } from '../services/history';
import { useSubscription } from '../context/SubscriptionContext';
import subscriptionService from '../services/subscription';
import { getCreditBalance } from '../services/credits';
import { getModelById, getDefaultModel } from '../constants/aiModels';
import { CREDIT_COSTS } from '../constants/credits';

const { width } = Dimensions.get('window');

type EditScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Edit'>;
  route: RouteProp<RootStackParamList, 'Edit'>;
};

export default function EditScreen({ navigation, route }: EditScreenProps) {
  const { t } = useTranslation();
  const { effect, imageUri: initialImageUri } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(initialImageUri || null);
  const [description, setDescription] = useState('');
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Animation refs
  const loadingFadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const gifOpacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const message99StartTime = useRef<number | null>(null);
  const { isPro, showPaywall, checkSubscriptionStatus } = useSubscription();
  
  // Loading messages
  const loadingMessages = [
    t('edit.loadingMessages.finalizing'),
    t('edit.loadingMessages.applying'),
    t('edit.loadingMessages.processing'),
    t('edit.loadingMessages.almostReady'),
    t('edit.loadingMessages.refining'),
    t('edit.loadingMessages.lastAdjustments'),
    t('edit.loadingMessages.preparing'),
    t('edit.loadingMessages.polishing'),
  ];
  const sparkleAnims = useRef(
    [...Array(8)].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // Preload GIF for instant display
  useEffect(() => {
    const gifSource = Image.resolveAssetSource(require('../../assets/images/splash-animation.gif'));
    Image.prefetch(gifSource.uri).catch(() => {
      console.warn('Failed to preload GIF');
    });
  }, []);

  useEffect(() => {
    if (initialImageUri) {
      setImageUri(initialImageUri);
    }
  }, [initialImageUri]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.libraryTitle'),
        t('permissions.libraryMessage')
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.cameraTitle'),
        t('permissions.cameraMessage')
      );
      return false;
    }
    return true;
  };

  const handleImageAreaPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowImagePickerModal(true);
  };

  const pickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowImagePickerModal(false);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7, // Reduced to prevent API Gateway 413 errors
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const errorMsg = error instanceof Error && error.message 
        ? `${t('errors.pickImageFailed')}: ${error.message}` 
        : t('errors.pickImageMessage');
      Alert.alert(t('errors.pickImageFailed'), errorMsg);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowImagePickerModal(false);
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7, // Reduced to prevent API Gateway 413 errors
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMsg = error instanceof Error && error.message 
        ? `${t('errors.takePhotoFailed')}: ${error.message}` 
        : t('errors.takePhotoMessage');
      Alert.alert(t('errors.takePhotoFailed'), errorMsg);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const downloadImage = async () => {
    if (!imageUri || !imageUri.startsWith('data:')) {
      Alert.alert(t('errors.downloadFailed'), t('errors.downloadMessage'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Request permission to save to media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissions.saveTitle'),
          t('permissions.saveMessage')
        );
        return;
      }

      // Convert data URI to file
      const filename = `lumo_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Extract base64 from data URI
      const base64 = imageUri.split(',')[1];
      
      // Write to file system
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to photo library
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        t('success.imageSaved'),
        t('success.imageSavedMessage'),
        [{ text: t('common.ok') }]
      );
      
      // Clean up temporary file
      await FileSystem.deleteAsync(fileUri);
    } catch (error) {
      console.error('Error downloading image:', error);
      const errorMsg = error instanceof Error && error.message 
        ? `${t('errors.saveFailed')}: ${error.message}` 
        : t('errors.saveImageMessage');
      Alert.alert(t('errors.saveFailed'), errorMsg);
    }
  };

  const handleGenerate = async () => {
    console.log('🚀 [EditScreen] Generate button pressed');
    
    if (!imageUri) {
      console.warn('⚠️ [EditScreen] No image selected');
      Alert.alert(t('errors.noImage'), t('errors.noImageMessage'));
      return;
    }

    if (!description.trim() && !effect) {
      console.warn('⚠️ [EditScreen] No description or effect');
      Alert.alert(t('errors.noDescription'), t('errors.noDescriptionMessage'));
      return;
    }

    // 1. Check subscription first
    if (!isPro) {
      try {
        console.log('👤 [EditScreen] User is not Pro, showing generate_button paywall');
        await showPaywall('generate_button');
        await checkSubscriptionStatus();
        const hasPro = await subscriptionService.isPro();
        if (!hasPro) {
          console.log('[EditScreen] Paywall closed but user still not Pro. Blocking generation silently.');
          return;
        }
      } catch (error) {
        console.error('Error showing generate paywall:', error);
        return;
      }
    }

    // 2. Check credits (user has subscription, but may not have credits)
    try {
      console.log('💰 [EditScreen] Checking credit balance...');
      const creditBalance = await getCreditBalance();
      
      if (!creditBalance) {
        console.error('❌ [EditScreen] Failed to get credit balance');
        Alert.alert('Error', 'Failed to check credit balance. Please try again.');
        return;
      }

      // Get the cost for the selected model (default to Flash if not found)
      const modelId = await AsyncStorage.getItem('@lumo_selected_ai_model');
      const model = modelId ? getModelById(modelId) : null;
      const creditCost = model?.id === 'gemini-pro' ? CREDIT_COSTS['gemini-pro'] : CREDIT_COSTS['gemini-flash'];
      
      console.log(`💰 [EditScreen] User has ${creditBalance.credits} credits, needs ${creditCost}`);
      
      if (creditBalance.credits < creditCost) {
        console.log('❌ [EditScreen] Insufficient credits, showing buy_credits paywall');
        try {
          await showPaywall('buy_credits');
          // Recheck credits after paywall
          const newBalance = await getCreditBalance();
          if (!newBalance || newBalance.credits < creditCost) {
            console.log('[EditScreen] Paywall closed but user still has insufficient credits. Blocking generation.');
            return;
          }
        } catch (error) {
          console.error('Error showing buy_credits paywall:', error);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking credits:', error);
      Alert.alert('Error', 'Failed to check credits. Please try again.');
      return;
    }

    // Haptic forte quando começa a gerar
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Recolher o teclado
    Keyboard.dismiss();
    
    // Aguardar um pouco para o teclado fechar
    await new Promise(resolve => setTimeout(resolve, 300));

    setIsLoading(true);
    
    // Animar o fade in do overlay
    Animated.timing(loadingFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    startLoadingAnimations();

    try {
      const result = await generateImage({
        imageUri,
        description: description.trim() || effect?.description || '',
        effectId: effect?.id,
      });

      if (result.success && result.imageUrl) {
        console.log('✅ [EditScreen] Generation successful!');
        
        // Para os intervals
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        if (hapticIntervalRef.current) {
          clearInterval(hapticIntervalRef.current);
        }
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
        
        // Completa a barra rapidamente quando termina
        const finalProgress = setInterval(() => {
          setProgressValue((prev) => {
            if (prev < 100) {
              const newValue = Math.min(prev + 10, 100);
              return newValue;
            } else {
              clearInterval(finalProgress);
              return 100;
            }
          });
        }, 50);
        
        // Haptic de sucesso quando a imagem é gerada!
        await new Promise(resolve => setTimeout(resolve, 500));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Save to history
        await saveToHistory(result.imageUrl, description.trim() || effect?.description || '');
        
        // Fade out loading
        Animated.timing(loadingFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Update the image after fade out
          setImageUri(result.imageUrl || null);
          setIsLoading(false);
          loadingFadeAnim.setValue(0);
          progressAnim.setValue(0);
          setProgressValue(0);
          setLoadingMessage('');
          // Reset GIF animations
          slideUpAnim.setValue(80);
          gifOpacityAnim.setValue(0);
          scaleAnim.setValue(0.6);
        });
        
        // Clear description after successful generation
        setDescription('');
      } else {
        const errorMsg = result.error && result.error.trim() !== '' 
          ? result.error 
          : 'Failed to generate image. Please try again.';
        
        console.error('❌ [EditScreen] Generation failed with error:', errorMsg);
        
        // Haptic de erro
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Para os intervals
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        if (hapticIntervalRef.current) {
          clearInterval(hapticIntervalRef.current);
        }
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
        
        // Fade out loading on error
        Animated.timing(loadingFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsLoading(false);
          loadingFadeAnim.setValue(0);
          progressAnim.setValue(0);
          setProgressValue(0);
          setLoadingMessage('');
          // Reset GIF animations
          slideUpAnim.setValue(80);
          gifOpacityAnim.setValue(0);
          scaleAnim.setValue(0.6);
        });
        
        showErrorAlert(errorMsg);
      }
    } catch (error) {
      console.error('❌ [EditScreen] Unexpected error:', error);
      
      // Haptic de erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Para os intervals
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      
      let errorMessage = 'An unexpected error occurred while generating your image. Please check your internet connection and try again.';
      
      if (error instanceof Error && error.message && error.message.trim() !== '') {
        errorMessage = error.message;
      }
      
      // Fade out loading on error
      Animated.timing(loadingFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsLoading(false);
        loadingFadeAnim.setValue(0);
        progressAnim.setValue(0);
        setProgressValue(0);
        setLoadingMessage('');
        // Reset GIF animations
        slideUpAnim.setValue(50);
        gifOpacityAnim.setValue(0);
        scaleAnim.setValue(0.9);
      });
      
      showErrorAlert(errorMessage);
    }
  };

  const showErrorAlert = (errorMessage: string) => {
    const safeErrorMessage = errorMessage && errorMessage.trim() !== '' 
      ? errorMessage 
      : t('errors.unexpected');
    const normalizedError = safeErrorMessage.toLowerCase();
    const isRateLimitError = normalizedError.includes('429') || normalizedError.includes('rate limit');
    
    let title = t('errors.generationFailed');
    let userFriendlyMessage = '';
    
    if (safeErrorMessage.includes('timeout') || safeErrorMessage.includes('Timeout')) {
      title = t('errors.timeout');
      userFriendlyMessage = t('errors.timeoutMessage');
    } else if (safeErrorMessage.includes('Network') || safeErrorMessage.includes('network')) {
      title = t('errors.network');
      userFriendlyMessage = t('errors.networkMessage');
    } else {
      userFriendlyMessage = t('errors.generationMessage');
    }

    const fullMessage = __DEV__ && safeErrorMessage !== userFriendlyMessage
      ? `${userFriendlyMessage}\n\nDetails: ${safeErrorMessage}`
      : userFriendlyMessage;

    const buttons: AlertButton[] = [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ];

    if (!isRateLimitError) {
      buttons.push({
        text: t('common.retry'),
        onPress: () => handleGenerate(),
      });
    }

    Alert.alert(
      title,
      fullMessage,
      buttons,
      { cancelable: false }
    );
  };

  const startLoadingAnimations = () => {
    // Reset progress
    progressAnim.setValue(0);
    setProgressValue(0);
    setLoadingMessage('');
    message99StartTime.current = null;
    
    // Reset GIF animations with more dramatic starting values
    slideUpAnim.setValue(80);
    gifOpacityAnim.setValue(0);
    scaleAnim.setValue(0.6);
    
    // Animate GIF entrance with slide up and fade
    Animated.parallel([
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(gifOpacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 35,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start pulse animation after entrance (reset to 1 to avoid jump)
      scaleAnim.setValue(1);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.96,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    
    // Clear any existing intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
    }
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
    }
    
    // Animate progress bar smoothly
    const progressDuration = 25000; // 25 segundos para dar tempo
    const startTime = Date.now();
    
    // Função de easing que acelera muito no início e desacelera no fim
    const easeOutQuad = (t: number): number => {
      // Progresso muito rápido no início, mais lento próximo ao fim
      return 1 - Math.pow(1 - t, 5); // Quint easing out para progressão mais rápida no início
    };
    
    let messageIndex = 0;
    
    // Atualizar progresso gradualmente com easing
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const linearProgress = Math.min(elapsed / progressDuration, 1);
      const easedProgress = easeOutQuad(linearProgress);
      
      // Garantir que chegue em 99%
      const finalProgress = Math.min(easedProgress * 0.995, 0.99); // Máximo 99% até completar
      progressAnim.setValue(finalProgress);
      const newProgressValue = Math.min(Math.ceil(finalProgress * 100), 99);
      setProgressValue(newProgressValue);
      console.log('🔄 Progress:', newProgressValue);
      
      // Detectar quando chegou em 99% e começar a mostrar mensagens
      if (newProgressValue === 99 && message99StartTime.current === null) {
        message99StartTime.current = Date.now();
        messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);
        
        // Alternar mensagens a cada 1 segundo
        messageIntervalRef.current = setInterval(() => {
          messageIndex = (messageIndex + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[messageIndex]);
        }, 1000);
      }
    }, 100); // Atualizar a cada 100ms
    
    // Haptics pattern - pulsos contínuos + marcos especiais
    let hapticCounter = 0;
    const milestonesHit = new Set<number>();
    
    hapticIntervalRef.current = setInterval(() => {
      hapticCounter++;
      
      // Pulso leve a cada 2 segundos (simulando progresso)
      if (hapticCounter % 20 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Pulso duplo a cada 5 segundos (como quando aproxima celulares)
      if (hapticCounter % 50 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
      }
      
      // Marcos importantes com haptic médio
      const milestones = [25, 50, 75];
      milestones.forEach(milestone => {
        if (progressValue >= milestone && !milestonesHit.has(milestone)) {
          milestonesHit.add(milestone);
          // Triplo tap nos marcos
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }, 80);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }, 160);
        }
      });
    }, 100);
    
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hidden preloaded GIF for instant display */}
      <Image
        source={require('../../assets/images/splash-animation.gif')}
        style={{ width: 0, height: 0, opacity: 0 }}
      />
      
      <KeyboardAvoidingView
        // Stable keyboard handling: zero offset to evitar flutuação do topo
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="never" // evita variação automática de inset no topo
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Clickable Image Area */}
          <View style={styles.imageContainer}>
            {imageUri ? (
              <TouchableOpacity 
                style={styles.imageWrapper}
                onPress={handleImageAreaPress}
                activeOpacity={0.8}
              >
                <Image
                  key={imageUri}
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <View style={styles.changeImageButton}>
                    <Text style={styles.changeImageText}>{t('edit.tapToChangePhoto')}</Text>
                  </View>
                </View>
                {/* Download Button - Only for generated images */}
                {imageUri.startsWith('data:') && (
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={downloadImage}
                  >
                    <View style={styles.downloadIconContainer}>
                      {/* Arrow shaft */}
                      <View style={styles.downloadArrowShaft} />
                      {/* Arrow head */}
                      <View style={styles.downloadArrowHead} />
                      {/* Base line */}
                      <View style={styles.downloadBaseLine} />
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Loading Overlay - Only over image */}
                <Animated.View 
                  style={[
                    styles.loadingOverlay,
                    { 
                      opacity: loadingFadeAnim,
                      pointerEvents: isLoading ? 'auto' : 'none'
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(26, 11, 46, 0.95)', 'rgba(61, 43, 122, 0.95)', 'rgba(90, 63, 154, 0.95)']}
                    style={styles.loadingGradient}
                  >
                    <View style={styles.loadingContent}>
                      {/* Magic Circle with Sparkles */}
                      <View style={styles.magicContainer}>
                        {/* Center GIF logo - Always rendered for instant display */}
                        <Animated.View
                          style={[
                            styles.logoContainer,
                            { 
                              opacity: gifOpacityAnim,
                              transform: [
                                { translateY: slideUpAnim },
                                { scale: scaleAnim }
                              ]
                            },
                          ]}
                        >
                          <Image
                            source={require('../../assets/images/splash-animation.gif')}
                            style={styles.logoGif}
                            resizeMode="contain"
                          />
                        </Animated.View>
                          
                          {/* Sparkles - Above GIF */}
                          {sparkleAnims.map((anim, index) => {
                            const angle = (index * 360) / sparkleAnims.length;
                            const radius = 70;
                            const x = Math.cos((angle * Math.PI) / 180) * radius;
                            const y = Math.sin((angle * Math.PI) / 180) * radius;
                            
                            return (
                              <Animated.View
                                key={index}
                                style={[
                                  styles.sparkle,
                                  {
                                    left: '50%',
                                    marginLeft: x - 3,
                                    top: '40%',
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
                        </View>

                        {/* Text */}
                        <Text style={styles.brandText}>{t('edit.brandName')}</Text>
                        <Text style={styles.loadingText}>
                          {loadingMessage || t('edit.creatingMagic')}
                        </Text>
                        
                        {/* Progress Bar - Refactor Completo */}
                        <View style={{
                          width: 250,
                          marginTop: 20,
                          alignItems: 'center',
                        }}>
                          {/* Background da barra */}
                          <View style={{
                            width: '100%',
                            height: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: 10,
                            marginBottom: 12,
                          }}>
                            {/* Preenchimento */}
                            <View style={{
                              width: `${Math.max(progressValue, 5)}%`,
                              height: '100%',
                              backgroundColor: '#FFFFFF',
                              borderRadius: 10,
                            }} />
                          </View>
                          
                          {/* Texto de porcentagem */}
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#FFFFFF',
                            opacity: 0.8,
                          }}>
                            {progressValue}%
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.imagePlaceholder}
                onPress={handleImageAreaPress}
                activeOpacity={0.8}
              >
                <View style={styles.placeholderIcon}>
                  {/* Image icon - mountain and sun */}
                  <View style={styles.iconSun} />
                  <View style={styles.iconMountain1} />
                  <View style={styles.iconMountain2} />
                </View>
                <Text style={styles.placeholderTitle}>{t('edit.tapToSelect')}</Text>
                <Text style={styles.placeholderSubtitle}>
                  {t('edit.chooseOrTake')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Input and Button Container */}
          <View style={styles.inputButtonContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('edit.descriptionPlaceholder')}
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.generateButtonWrapper,
                ((!imageUri || (!description.trim() && !effect)) || isLoading) && styles.generateButtonDisabled
              ]} 
              onPress={handleGenerate}
              disabled={!imageUri || (!description.trim() && !effect) || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5B3F9E', '#3D2B7A', '#2A1A5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateButton}
              >
                {isLoading ? (
                  <View style={styles.buttonLoadingContainer}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.generateButtonText}>{t('edit.generating')}</Text>
                  </View>
                ) : (
                  <Text style={styles.generateButtonText}>{t('edit.generate')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>

        {/* Image Picker Modal - Bottom Sheet Style */}
        <Modal
          visible={showImagePickerModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowImagePickerModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowImagePickerModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('edit.choosePhoto')}</Text>
            <Text style={styles.modalSubtitle}>{t('edit.choosePhotoSubtitle')}</Text>
              
              <TouchableOpacity 
                style={styles.modalOptionWrapper}
                onPress={pickFromGallery}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5B3F9E', '#3D2B7A', '#2A1A5E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalOption}
                >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="images" size={32} color="#FFF" />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionText}>{t('edit.gallery')}</Text>
                  <Text style={styles.modalOptionDescription}>{t('edit.galleryDescription')}</Text>
                </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalOptionWrapper}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5B3F9E', '#3D2B7A', '#2A1A5E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalOption}
                >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="camera" size={32} color="#FFF" />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionText}>{t('edit.camera')}</Text>
                  <Text style={styles.modalOptionDescription}>{t('edit.cameraDescription')}</Text>
                </View>
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 20, // Reduced padding at bottom
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 300,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  changeImageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButton: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadArrowShaft: {
    width: 3,
    height: 12,
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
  },
  downloadArrowHead: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000',
    position: 'absolute',
    top: 11,
  },
  downloadBaseLine: {
    width: 18,
    height: 3,
    backgroundColor: '#000',
    position: 'absolute',
    bottom: 0,
    borderRadius: 1.5,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E8E8',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconSun: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#B0B0B0',
    position: 'absolute',
    top: 18,
    right: 22,
  },
  iconMountain1: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#A0A0A0',
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  iconMountain2: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#B8B8B8',
    position: 'absolute',
    bottom: 12,
    right: 18,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputButtonContainer: {
    width: '100%',
    marginBottom: 20, // Space at bottom
  },
  inputContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    color: '#000',
    minHeight: 100, // Reduced from 120
    maxHeight: 150, // Reduced from 200
  },
  generateButtonWrapper: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#3D2B7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D0D0D0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  modalOptionWrapper: {
    marginBottom: 16,
    shadowColor: '#3D2B7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  modalOptionIcon: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Loading Overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  magicContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    zIndex: 10,
  },
  sparkleShape: {
    width: 6,
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGif: {
    width: 150,
    height: 150,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  brandText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 2,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
});

