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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import { generateImage } from '../services/api';
import { generateVideo, checkVideoStatus, pollVideoCompletion } from '../services/videoGeneration';
import { saveToHistory } from '../services/history';
import { useSubscription } from '../context/SubscriptionContext';
import subscriptionService from '../services/subscription';
import { getCreditBalance } from '../services/credits';
import { getModelById, getDefaultModel } from '../constants/aiModels';
import { CREDIT_COSTS } from '../constants/credits';
import COLORS from '../constants/colors';
import * as Application from 'expo-application';

const { width } = Dimensions.get('window');

type EditScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Edit'>;
  route: RouteProp<RootStackParamList, 'Edit'>;
};

export default function EditScreen({ navigation, route }: EditScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { effect, imageUri: initialImageUri, aiModel } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(initialImageUri || null);
  const [description, setDescription] = useState('');
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showModelSelectorModal, setShowModelSelectorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedAIModel, setSelectedAIModel] = useState<string>(aiModel || 'image-to-video');
  
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
      const filename = `moovia_${Date.now()}.jpg`;
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

    // ⚠️ TEMPORARILY DISABLED FOR TESTING - Re-enable before production!
    // TODO: Remove these comments and uncomment the code below when ready to enable paywall
    
    /*
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
      const modelId = await AsyncStorage.getItem('@moovia_selected_ai_model');
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
    */
    
    console.log('⚠️ [EditScreen] Paywall checks DISABLED for testing - proceeding with generation');

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
      // Get user ID for video generation
      const installationId = await Application.getIosIdForVendorAsync();
      const userId = installationId ? `device_${installationId}` : 'anonymous';
      
      console.log('🎬 [EditScreen] Starting video generation...');
      console.log('  - Model:', selectedAIModel);
      console.log('  - Has Image:', !!imageUri);
      console.log('  - Prompt:', description.trim());

      // Convert local image to base64 if needed
      let imageBase64: string | undefined;
      if (selectedAIModel === 'image-to-video' && imageUri) {
        try {
          console.log('📸 [EditScreen] Converting image to base64...');
          // Check if it's already a data URI
          if (imageUri.startsWith('data:')) {
            // Extract base64 from data URI (remove "data:image/...;base64," prefix)
            imageBase64 = imageUri.split(',')[1];
          } else {
            // It's a local file URI, read it as base64
            imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          console.log('✅ [EditScreen] Image converted, size:', imageBase64.length, 'bytes');
        } catch (error) {
          console.error('❌ [EditScreen] Failed to convert image:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Step 1: Initiate video generation
      const result = await generateVideo({
        modelId: 'kling-2.5-turbo', // Use Kling 2.5 Turbo as default
        prompt: description.trim() || effect?.description || '',
        imageBase64: imageBase64,
        duration: 5,
        aspectRatio: '16:9',
      });

      if (result.success && result.taskId) {
        console.log('✅ [EditScreen] Video generation initiated!');
        console.log('  - Task ID:', result.taskId);
        console.log('  - Estimated time:', result.estimatedTime, 'seconds');
        
        // Haptic de sucesso
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Para os intervals de loading
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        if (hapticIntervalRef.current) {
          clearInterval(hapticIntervalRef.current);
        }
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
        
        // Save video task to history for tracking
        await saveToHistory(result.taskId, description.trim() || effect?.description || '', 'processing');
        
        // Fade out loading
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
          
          // Navigate back to Home - video will appear in "My Moovias" section
          Alert.alert(
            'Video Creation Started',
            'Your video is being created! You can track the progress in the "My Moovias" section.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        });
      } else {
        // Failed to start video generation
        const errorMsg = result.error && result.error.trim() !== '' 
          ? result.error 
          : 'Failed to start video generation. Please try again.';
        
        console.error('❌ [EditScreen] Video generation failed with error:', errorMsg);
        
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
    <View style={styles.container}>
      {/* Hidden preloaded GIF for instant display */}
      <Image
        source={require('../../assets/images/splash-animation.gif')}
        style={{ width: 0, height: 0, opacity: 0 }}
      />
      
      {/* Fixed Header with SafeArea */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Video</Text>
          <View style={styles.headerRight} />
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Prompt Input - Always visible */}
          <View style={styles.promptSection}>
            <Text style={styles.sectionLabel}>Prompt</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Type here a detailed description of what you want to see in your video"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Image Upload - Only for Image to Video mode */}
          {selectedAIModel === 'image-to-video' && (
            <View style={styles.imageUploadSection}>
              <Text style={styles.sectionLabel}>Image</Text>
            {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                {/* Check if it's a video URL (contains .mp4) or an image */}
                {imageUri.includes('.mp4') ? (
                  <Video
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay
                  />
                ) : (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                )}
                  <TouchableOpacity
                    style={styles.changeImageIconButton}
                    onPress={handleImageAreaPress}
                  >
                    <Ionicons name="camera" size={20} color="#FFF" />
                  </TouchableOpacity>
                        </View>
            ) : (
              <TouchableOpacity 
                  style={styles.imageUploadButton}
                onPress={handleImageAreaPress}
                  activeOpacity={0.7}
              >
                  <View style={styles.imageUploadIcon}>
                    <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary.violet} />
                </View>
                  <Text style={styles.imageUploadText}>Upload Image</Text>
                  <Text style={styles.imageUploadSubtext}>Tap to select from gallery or camera</Text>
              </TouchableOpacity>
            )}
          </View>
          )}

          {/* AI Model Selector - Dropdown style */}
          <View style={styles.modelSection}>
            <Text style={styles.sectionLabel}>AI Model</Text>
            <TouchableOpacity 
              style={styles.modelDropdown}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModelSelectorModal(true);
              }}
            >
              <View style={styles.modelDropdownContent}>
                <Ionicons 
                  name={selectedAIModel === 'text-to-video' ? 'text' : 'image'} 
                  size={20} 
                  color={COLORS.text.primary} 
                />
                <Text style={styles.modelDropdownText}>
                  {selectedAIModel === 'text-to-video' ? 'Text to Video' : 'Image to Video'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
            </View>

          {/* Create Button */}
            <TouchableOpacity 
              style={[
              styles.createButtonWrapper,
              ((selectedAIModel === 'image-to-video' && !imageUri) || !description.trim() || isLoading) && styles.createButtonDisabled
              ]} 
              onPress={handleGenerate}
            disabled={(selectedAIModel === 'image-to-video' && !imageUri) || !description.trim() || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5B3F9E', '#3D2B7A', '#2A1A5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              style={styles.createButton}
              >
                {isLoading ? (
                  <View style={styles.buttonLoadingContainer}>
                    <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.createButtonText}>Creating...</Text>
                  </View>
                ) : (
                <Text style={styles.createButtonText}>Create</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
        </ScrollView>

        {/* Image Picker Modal */}
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

        {/* Model Selector Modal */}
        <Modal
          visible={showModelSelectorModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModelSelectorModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModelSelectorModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select AI Model</Text>
              <Text style={styles.modalSubtitle}>Choose the model type for your video</Text>
              
              <TouchableOpacity 
                style={[
                  styles.modelModalOption,
                  selectedAIModel === 'text-to-video' && styles.modelModalOptionSelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedAIModel('text-to-video');
                  if (imageUri) {
                    setImageUri(null);
                  }
                  setShowModelSelectorModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.modelModalIconContainer}>
                  <Ionicons name="text" size={24} color={selectedAIModel === 'text-to-video' ? COLORS.primary.violet : COLORS.text.secondary} />
                </View>
                <View style={styles.modelModalContent}>
                  <Text style={[
                    styles.modelModalText,
                    selectedAIModel === 'text-to-video' && styles.modelModalTextSelected
                  ]}>
                    Text to Video
                  </Text>
                  <Text style={styles.modelModalDescription}>
                    Generate videos from text descriptions
                  </Text>
                </View>
                {selectedAIModel === 'text-to-video' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.cyan} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.modelModalOption,
                  selectedAIModel === 'image-to-video' && styles.modelModalOptionSelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedAIModel('image-to-video');
                  setShowModelSelectorModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.modelModalIconContainer}>
                  <Ionicons name="image" size={24} color={selectedAIModel === 'image-to-video' ? COLORS.primary.violet : COLORS.text.secondary} />
                </View>
                <View style={styles.modelModalContent}>
                  <Text style={[
                    styles.modelModalText,
                    selectedAIModel === 'image-to-video' && styles.modelModalTextSelected
                  ]}>
                    Image to Video
                  </Text>
                  <Text style={styles.modelModalDescription}>
                    Transform images into animated videos
                  </Text>
                </View>
                {selectedAIModel === 'image-to-video' && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.cyan} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  // Fixed Header with SafeArea
  headerContainer: {
    backgroundColor: COLORS.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ui.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Prompt Section
  promptSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  promptInput: {
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text.primary,
    minHeight: 150,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: COLORS.ui.border,
    textAlignVertical: 'top',
  },
  // Image Upload Section
  imageUploadSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  imageUploadButton: {
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.ui.border,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.opacity.violet20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  imageUploadSubtext: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface.secondary,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  changeImageIconButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Model Section
  modelSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modelDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.ui.border,
  },
  modelDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modelDropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  // Style Section - REMOVED
  // Create Button
  createButtonWrapper: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3D2B7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.ui.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.ui.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: COLORS.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    color: COLORS.text.secondary,
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
  // Model Selector Modal styles
  modelModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelModalOptionSelected: {
    borderColor: COLORS.primary.violet,
    backgroundColor: COLORS.opacity.violet20,
  },
  modelModalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.opacity.violet20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelModalContent: {
    flex: 1,
  },
  modelModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  modelModalTextSelected: {
    color: COLORS.primary.violet,
  },
  modelModalDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
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
  // AI Model Selector Styles
  aiModelSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  aiModelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  aiModelButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aiModelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  aiModelButtonSelected: {
    backgroundColor: COLORS.primary.violet,
    borderColor: COLORS.primary.cyan,
  },
  aiModelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  aiModelButtonTextSelected: {
    color: '#FFF',
  },
  // Text to Video Placeholder Styles
  textToVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 20,
    padding: 40,
  },
  textToVideoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.opacity.violet20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  textToVideoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  textToVideoSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Text to Video Header (above input)
  textToVideoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary.violet,
  },
  textToVideoIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.opacity.violet20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textToVideoHeaderText: {
    flex: 1,
  },
  textToVideoHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  textToVideoHeaderSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});

