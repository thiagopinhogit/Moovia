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
import { getAvailableVideoModels, getVideoModelById, getModelsByProviderGrouped, VideoModel, ModelProvider } from '../constants/videoModels';
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
  const { effect, imageUri: initialImageUri, aiModel, prompt } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(initialImageUri || null);
  const [description, setDescription] = useState(prompt || '');
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedAIModel, setSelectedAIModel] = useState<string>(aiModel || 'image-to-video');
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  
  // Video configuration options with modals
  const [showModelModal, setShowModelModal] = useState(false);
  const [showAspectRatioModal, setShowAspectRatioModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  
  // Provider expansion state
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  
  // Video generation cancellation
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelGenerationRef = useRef(false);
  
  // Get default model
  const defaultModel = getAvailableVideoModels()[0];
  const [selectedModel, setSelectedModel] = useState<VideoModel>(defaultModel);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(defaultModel.aspectRatios[0]);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [selectedQuality, setSelectedQuality] = useState<'720p' | '1080p'>('720p');
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Calculate credit cost based on selected model and mode
  const getVideoCreditCost = (): number => {
    const isImageToVideo = selectedAIModel === 'image-to-video' && !!imageUri;
    // Base cost per second
    const costPerSecond = selectedModel.creditsPerSecond;
    // Multiply by duration
    let totalCost = Math.ceil(costPerSecond * selectedDuration);
    
    // Image-to-video typically costs 50% more
    if (isImageToVideo) {
      totalCost = Math.ceil(totalCost * 1.5);
    }
    
    return totalCost;
  };
  
  // Get icon for aspect ratio
  const getAspectRatioIcon = (ratio: string): keyof typeof Ionicons.glyphMap => {
    if (ratio === '16:9') {
      return 'tablet-landscape-outline'; // Landscape/horizontal
    } else if (ratio === '1:1') {
      return 'square-outline'; // Square
    } else if (ratio === '9:16') {
      return 'phone-portrait-outline'; // Portrait/vertical
    }
    return 'crop-outline'; // Default
  };
  
  // Toggle provider expansion
  const toggleProvider = (providerId: string) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(providerId)) {
      newExpanded.delete(providerId);
    } else {
      newExpanded.add(providerId);
    }
    setExpandedProviders(newExpanded);
  };
  
  // Update available options when model changes
  useEffect(() => {
    if (selectedModel) {
      // Reset to first available aspect ratio if current one is not supported
      if (!selectedModel.aspectRatios.includes(selectedAspectRatio)) {
        setSelectedAspectRatio(selectedModel.aspectRatios[0]);
      }
      // Reset duration if it exceeds max or is invalid
      const validDurations = getValidDurations();
      if (!validDurations.includes(selectedDuration)) {
        setSelectedDuration(validDurations[0]);
      }
    }
  }, [selectedModel]);
  
  // Get valid durations for the selected model
  const getValidDurations = (): number[] => {
    // Kling models: only 5s or 10s
    if (selectedModel.provider === 'kling') {
      return selectedModel.maxDuration >= 10 ? [5, 10] : [5];
    }
    // Veo 3.1 (not Fast): 4s, 6s, 8s
    if (selectedModel.id === 'veo-3.1-generate-preview') {
      return [4, 6, 8];
    }
    // Veo Fast: only 8s
    if (selectedModel.provider === 'google-veo') {
      return [8];
    }
    // Default: all durations up to max
    return Array.from({ length: selectedModel.maxDuration }, (_, i) => i + 1);
  };
  
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

  const handleCancelGeneration = () => {
    console.log('🛑 [EditScreen] User requested to cancel generation');
    
    Alert.alert(
      'Cancel Generation',
      'Are you sure you want to cancel the video generation?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelGenerationRef.current = true;
            setIsCancelled(true);
            
            // Stop all intervals
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            if (hapticIntervalRef.current) {
              clearInterval(hapticIntervalRef.current);
            }
            if (messageIntervalRef.current) {
              clearInterval(messageIntervalRef.current);
            }
            
            // Fade out loading
            Animated.timing(loadingFadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setIsLoading(false);
            });
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            console.log('✅ [EditScreen] Generation cancelled by user');
          },
        },
      ]
    );
  };

  const handleGenerate = async () => {
    console.log('🚀 [EditScreen] Generate button pressed');
    
    // Prevent multiple clicks - set loading state IMMEDIATELY
    if (isLoading) {
      console.log('⚠️ [EditScreen] Already generating, ignoring click');
      return;
    }
    
    // Reset cancellation flag
    cancelGenerationRef.current = false;
    setIsCancelled(false);
    
    // Validate based on selected mode
    if (selectedAIModel === 'image-to-video' && !imageUri) {
      console.warn('⚠️ [EditScreen] No image selected for image-to-video');
      Alert.alert(t('errors.noImage'), t('errors.noImageMessage'));
      return;
    }

    if (selectedAIModel === 'text-to-video' && !description.trim()) {
      console.warn('⚠️ [EditScreen] No description for text-to-video');
      Alert.alert(t('errors.noDescription'), t('errors.noDescriptionMessage'));
      return;
    }

    // Set loading state early to prevent multiple generations
    setIsLoading(true);
    
    // Haptic forte quando começa a gerar
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Recolher o teclado (non-blocking)
    Keyboard.dismiss();
    
    // Animar o fade in do overlay
    Animated.timing(loadingFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    startLoadingAnimations();

    // 1. Check subscription first
    if (!isPro) {
      try {
        console.log('👤 [EditScreen] User is not Pro, showing generate_button paywall');
        await showPaywall('generate_button');
        console.log('👤 [EditScreen] Paywall flow completed, checking status');
        await checkSubscriptionStatus();
        const hasPro = await subscriptionService.isPro();
        console.log('👤 [EditScreen] Pro status after paywall:', hasPro);
        if (!hasPro) {
          console.log('[EditScreen] Paywall closed but user still not Pro. Blocking generation silently.');
          setIsLoading(false);
          loadingFadeAnim.setValue(0);
          stopLoadingAnimations();
          return;
        }
      } catch (error) {
        console.error('[EditScreen] Error showing generate paywall:', error);
        setIsLoading(false);
        loadingFadeAnim.setValue(0);
        stopLoadingAnimations();
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
        setIsLoading(false);
        loadingFadeAnim.setValue(0);
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
          console.log('💰 [EditScreen] Paywall completed, rechecking credits');
          // Recheck credits after paywall
          const newBalance = await getCreditBalance();
          console.log('💰 [EditScreen] New balance:', newBalance?.credits);
          if (!newBalance || newBalance.credits < creditCost) {
            console.log('[EditScreen] Paywall closed but user still has insufficient credits. Blocking generation.');
            setIsLoading(false);
            loadingFadeAnim.setValue(0);
            stopLoadingAnimations();
            return;
          }
        } catch (error) {
          console.error('[EditScreen] Error showing buy_credits paywall:', error);
          setIsLoading(false);
          loadingFadeAnim.setValue(0);
          stopLoadingAnimations();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking credits:', error);
      Alert.alert('Error', 'Failed to check credits. Please try again.');
      setIsLoading(false);
      loadingFadeAnim.setValue(0);
      return;
    }
    
    console.log('✅ [EditScreen] Paywall checks passed - proceeding with generation');

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
      console.log('📋 [EditScreen] Generation settings:', {
        model: selectedModel.displayName,
        aspectRatio: selectedAspectRatio,
        duration: selectedDuration,
        quality: selectedQuality,
        hasImage: !!imageBase64,
      });
      
      const result = await generateVideo({
        modelId: selectedModel.id as any,
        prompt: description.trim() || effect?.description || '',
        imageBase64: imageBase64,
        duration: selectedDuration,
        aspectRatio: selectedAspectRatio as '16:9' | '9:16' | '1:1',
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
        
        // Reset loading state
        setIsLoading(false);
        loadingFadeAnim.setValue(0);
        progressAnim.setValue(0);
        setProgressValue(0);
        setLoadingMessage('');
        
        // Navigate back to Home immediately - video will appear in "My Moovias" section
        navigation.goBack();
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

  const stopLoadingAnimations = () => {
    // Stop all animations
    progressAnim.stopAnimation();
    slideUpAnim.stopAnimation();
    gifOpacityAnim.stopAnimation();
    scaleAnim.stopAnimation();
    
    // Reset to default values
    progressAnim.setValue(0);
    slideUpAnim.setValue(80);
    gifOpacityAnim.setValue(0);
    scaleAnim.setValue(0.6);
    
    // Reset state
    setProgressValue(0);
    setLoadingMessage('');
    message99StartTime.current = null;
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
          {/* Tab Selector - Image to Video / Text to Video */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab,
                selectedAIModel === 'image-to-video' && styles.tabActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedAIModel('image-to-video');
              }}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                selectedAIModel === 'image-to-video' && styles.tabTextActive
              ]}>
                Image to Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.tab,
                selectedAIModel === 'text-to-video' && styles.tabActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedAIModel('text-to-video');
                if (imageUri) setImageUri(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                selectedAIModel === 'text-to-video' && styles.tabTextActive
              ]}>
                Text to Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Image Upload - Only for Image to Video mode */}
          {selectedAIModel === 'image-to-video' && (
            <View style={styles.imageUploadSection}>
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
                    <Ionicons name="image-outline" size={48} color="#666" />
                </View>
              </TouchableOpacity>
            )}
          </View>
          )}

          {/* Prompt Input - Always visible */}
          <View style={styles.promptSection}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptLabel}>Video Description</Text>
              {prompt && (
                <TouchableOpacity 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsPromptExpanded(!isPromptExpanded);
                  }}
                  style={styles.expandButton}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isPromptExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.primary.cyan} 
                  />
                  <Text style={styles.expandButtonText}>
                    {isPromptExpanded ? 'Show Less' : 'Advanced'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[
                styles.promptInput,
                isPromptExpanded ? styles.promptInputExpanded : styles.promptInputCollapsed
              ]}
              placeholder="Type here a detailed description of what you want to see in your video"
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              numberOfLines={isPromptExpanded ? undefined : 3}
              editable={isPromptExpanded || !prompt}
            />
            {!isPromptExpanded && prompt && (
              <View style={styles.promptOverlay}>
                <LinearGradient
                  colors={['transparent', COLORS.surface.secondary]}
                  style={styles.promptGradient}
                />
              </View>
            )}
          </View>

          {/* Configuration Options */}
          <View style={styles.configSection}>
            {/* Model Selector - Full width row */}
            <TouchableOpacity 
              style={styles.configOptionFull} 
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModelModal(true);
              }}
            >
              <Ionicons name="cube-outline" size={20} color="#FFF" />
              <Text style={styles.configOptionText}>{selectedModel.displayName}</Text>
              <Ionicons name="chevron-down" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* Other options - Up to 4 per row */}
            <View style={styles.configOptionsRow}>
              {/* Aspect Ratio Selector */}
              <TouchableOpacity 
                style={styles.configOptionSmall} 
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAspectRatioModal(true);
                }}
              >
                <Ionicons name={getAspectRatioIcon(selectedAspectRatio)} size={20} color="#FFF" />
                <Text style={styles.configOptionTextSmall}>{selectedAspectRatio}</Text>
              </TouchableOpacity>

              {/* Duration Selector */}
              <TouchableOpacity 
                style={styles.configOptionSmall} 
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowDurationModal(true);
                }}
              >
                <Ionicons name="time-outline" size={20} color="#FFF" />
                <Text style={styles.configOptionTextSmall}>{selectedDuration}s</Text>
              </TouchableOpacity>

              {/* Quality Selector - Only show for models with resolution options */}
              {selectedModel.resolutions.length > 0 && (
                <TouchableOpacity 
                  style={styles.configOptionSmall} 
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowQualityModal(true);
                  }}
                >
                  <Ionicons name="settings-outline" size={20} color="#FFF" />
                  <Text style={styles.configOptionTextSmall}>{selectedQuality}</Text>
                </TouchableOpacity>
              )}

              {/* Audio Selector */}
              <TouchableOpacity 
                style={styles.configOptionSmall} 
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAudioEnabled(!audioEnabled);
                }}
              >
                <Ionicons name={audioEnabled ? "volume-high" : "volume-mute"} size={20} color="#FFF" />
                <Text style={styles.configOptionTextSmall}>Audio</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Button */}
            <TouchableOpacity 
              style={[
              styles.createButtonWrapper,
              ((selectedAIModel === 'image-to-video' && !imageUri) || (selectedAIModel === 'text-to-video' && !description.trim()) || isLoading) && styles.createButtonDisabled
              ]} 
              onPress={handleGenerate}
            disabled={(selectedAIModel === 'image-to-video' && !imageUri) || (selectedAIModel === 'text-to-video' && !description.trim()) || isLoading}
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
                  <View style={styles.buttonContentContainer}>
                    <Text style={styles.createButtonText}>Create Video</Text>
                    <View style={styles.buttonCostBadge}>
                      <Text style={styles.buttonCostText}>{getVideoCreditCost()}</Text>
                      <Ionicons name="flash" size={12} color="#FFF" />
                    </View>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button - Only visible during loading */}
            {isLoading && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelGeneration}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.cancelButtonText}>Cancel Generation</Text>
              </TouchableOpacity>
            )}
        </ScrollView>

        {/* Model Selector Modal */}
        <Modal
          visible={showModelModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModelModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModelModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Model</Text>
              <Text style={styles.modalSubtitle}>Choose the AI model for your video</Text>
              
              <ScrollView 
                style={styles.modelsList}
                showsVerticalScrollIndicator={false}
              >
                {getModelsByProviderGrouped().map((provider) => {
                  const isExpanded = expandedProviders.has(provider.id);
                  
                  return (
                    <View key={provider.id} style={styles.providerGroup}>
                      {/* Provider Header - Clickable to expand/collapse */}
                      <TouchableOpacity
                        style={styles.providerHeader}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleProvider(provider.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={provider.icon as any} size={20} color={COLORS.text.primary} />
                        <View style={styles.providerHeaderText}>
                          <Text style={styles.providerName}>{provider.displayName}</Text>
                          <Text style={styles.providerDescription}>{provider.description}</Text>
                        </View>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={COLORS.text.secondary} 
                        />
                      </TouchableOpacity>
                      
                      {/* Provider Models - Only show when expanded */}
                      {isExpanded && (
                        <View style={styles.providerModels}>
                          {provider.models.map((model) => {
                            const isDisabled = model.isComingSoon;
                            
                            return (
                              <TouchableOpacity
                                key={model.id}
                                style={[
                                  styles.modelOption,
                                  selectedModel.id === model.id && styles.modelOptionActive,
                                  isDisabled && styles.modelOptionDisabled
                                ]}
                                onPress={() => {
                                  if (isDisabled) return;
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setSelectedModel(model);
                                  setShowModelModal(false);
                                }}
                                activeOpacity={isDisabled ? 1 : 0.7}
                                disabled={isDisabled}
                              >
                                <View style={styles.modelOptionContent}>
                                  <View style={styles.modelOptionHeader}>
                                    <Text style={[
                                      styles.modelOptionText,
                                      selectedModel.id === model.id && styles.modelOptionTextActive,
                                      isDisabled && styles.modelOptionTextDisabled
                                    ]}>
                                      {model.displayName}
                                    </Text>
                                    {model.isPremium && !isDisabled && (
                                      <View style={styles.premiumBadge}>
                                        <Text style={styles.premiumBadgeText}>Premium</Text>
                                      </View>
                                    )}
                                    {isDisabled && (
                                      <View style={styles.comingSoonBadge}>
                                        <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={[
                                    styles.modelOptionDescription,
                                    isDisabled && styles.modelOptionDescriptionDisabled
                                  ]}>
                                    {model.description}
                                  </Text>
                                  {!isDisabled && (
                                    <View style={styles.modelTags}>
                                      {model.tags?.map((tag) => (
                                        <View key={tag} style={styles.modelTag}>
                                          <Ionicons name="flash" size={12} color={COLORS.text.secondary} />
                                          <Text style={styles.modelTagText}>{tag}</Text>
                                        </View>
                                      ))}
                                      {model.resolutions.length > 0 && (
                                        <View style={styles.modelTag}>
                                          <Ionicons name="videocam" size={12} color={COLORS.text.secondary} />
                                          <Text style={styles.modelTagText}>{model.resolutions.join('-')}</Text>
                                        </View>
                                      )}
                                      {model.maxDuration && (
                                        <View style={styles.modelTag}>
                                          <Ionicons name="time" size={12} color={COLORS.text.secondary} />
                                          <Text style={styles.modelTagText}>{model.maxDuration}s</Text>
                                        </View>
                                      )}
                                    </View>
                                  )}
                                </View>
                                {selectedModel.id === model.id && !isDisabled && (
                                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.cyan} />
                                )}
                                {isDisabled && (
                                  <Ionicons name="lock-closed" size={20} color={COLORS.text.secondary} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Aspect Ratio Modal */}
        <Modal
          visible={showAspectRatioModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAspectRatioModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAspectRatioModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Aspect Ratio</Text>
              <Text style={styles.modalSubtitle}>Choose your video format</Text>
              
              {selectedModel.aspectRatios.map((ratio) => {
                return (
                  <TouchableOpacity
                    key={ratio}
                    style={[
                      styles.modalSelectOption,
                      selectedAspectRatio === ratio && styles.modalSelectOptionActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      console.log('📐 [EditScreen] Aspect ratio selected:', ratio);
                      setSelectedAspectRatio(ratio);
                      setShowAspectRatioModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalSelectWithIcon}>
                      <Ionicons name={getAspectRatioIcon(ratio)} size={24} color={COLORS.text.primary} />
                      <Text style={[
                        styles.modalSelectText,
                        selectedAspectRatio === ratio && styles.modalSelectTextActive
                      ]}>
                        {ratio}
                      </Text>
                    </View>
                    {selectedAspectRatio === ratio && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.cyan} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Duration Modal */}
        <Modal
          visible={showDurationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDurationModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDurationModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Duration</Text>
              <Text style={styles.modalSubtitle}>
                {selectedModel.provider === 'kling' 
                  ? 'Select video length (5s or 10s)' 
                  : selectedModel.id === 'veo-3.1-generate-preview'
                    ? 'Select video length (4s, 6s, or 8s)'
                    : `Select video length (max ${selectedModel.maxDuration}s)`}
              </Text>
              
              {getValidDurations().map((duration) => {
                return (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.modalSelectOption,
                      selectedDuration === duration && styles.modalSelectOptionActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedDuration(duration);
                      setShowDurationModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalSelectText,
                      selectedDuration === duration && styles.modalSelectTextActive
                    ]}>
                      {duration} second{duration > 1 ? 's' : ''}
                    </Text>
                    {selectedDuration === duration && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.cyan} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Quality Modal */}
        <Modal
          visible={showQualityModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowQualityModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowQualityModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Quality</Text>
              <Text style={styles.modalSubtitle}>
                {selectedModel.id === 'veo-3.1-fast-generate-preview' && selectedAspectRatio !== '16:9'
                  ? '1080p only available for 16:9'
                  : selectedModel.id === 'veo-3.1-generate-preview' && selectedDuration !== 8
                    ? '1080p only available for 8s'
                    : 'Choose video resolution'}
              </Text>
              
              {selectedModel.resolutions.map((quality) => {
                // Check if 1080p is disabled
                const is1080pDisabled = quality === '1080p' && (
                  (selectedModel.id === 'veo-3.1-fast-generate-preview' && selectedAspectRatio !== '16:9') ||
                  (selectedModel.id === 'veo-3.1-generate-preview' && selectedDuration !== 8)
                );
                
                return (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.modalSelectOption,
                      selectedQuality === quality && styles.modalSelectOptionActive,
                      is1080pDisabled && styles.modalSelectOptionDisabled
                    ]}
                    onPress={() => {
                      if (is1080pDisabled) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedQuality(quality as '720p' | '1080p');
                      setShowQualityModal(false);
                    }}
                    activeOpacity={is1080pDisabled ? 1 : 0.7}
                    disabled={is1080pDisabled}
                  >
                    <View style={styles.modalSelectContent}>
                      <Text style={[
                        styles.modalSelectText,
                        selectedQuality === quality && styles.modalSelectTextActive,
                        is1080pDisabled && styles.modalSelectTextDisabled
                      ]}>
                        {quality}
                      </Text>
                      {is1080pDisabled && (
                        <Text style={styles.modalSelectSubtext}>
                          {selectedModel.id === 'veo-3.1-fast-generate-preview' 
                            ? 'Only for 16:9' 
                            : 'Only for 8s'}
                        </Text>
                      )}
                    </View>
                    {selectedQuality === quality && !is1080pDisabled && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.cyan} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

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
  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.text.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  tabTextActive: {
    color: COLORS.text.primary,
  },
  // Image Upload Section
  imageUploadSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  imageUploadButton: {
    width: 104,
    height: 104,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 104,
    height: 104,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface.secondary,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  changeImageIconButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Prompt Section
  promptSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    position: 'relative',
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary.cyan,
  },
  promptInput: {
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.ui.border,
    textAlignVertical: 'top',
  },
  promptInputCollapsed: {
    maxHeight: 90,
    overflow: 'hidden',
  },
  promptInputExpanded: {
    maxHeight: 300,
  },
  promptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 40,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    pointerEvents: 'none',
  },
  promptGradient: {
    flex: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  // Configuration Section
  configSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  configOptionFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.secondary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  configOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  configOptionSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface.secondary,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 4,
  },
  configOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  configOptionTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
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
  buttonContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  buttonCostText: {
    color: '#FFF',
    fontSize: 14,
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
  // Model Selector Hierarchical Styles
  modelsList: {
    maxHeight: 500,
  },
  providerGroup: {
    marginBottom: 24,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  providerHeaderText: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  providerDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  providerModels: {
    paddingLeft: 8,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingLeft: 28,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelOptionActive: {
    borderColor: COLORS.primary.violet,
    backgroundColor: COLORS.opacity.violet20,
  },
  modelOptionDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.surface.elevated,
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modelOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modelOptionTextActive: {
    color: COLORS.primary.violet,
  },
  modelOptionTextDisabled: {
    color: COLORS.text.secondary,
  },
  modelOptionDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  modelOptionDescriptionDisabled: {
    color: COLORS.text.secondary,
  },
  premiumBadge: {
    backgroundColor: COLORS.special.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.black,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.opacity.white20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  modelTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.opacity.white10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modelTagText: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  // Selection Modal Styles
  modalSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalSelectOptionActive: {
    borderColor: COLORS.primary.violet,
    backgroundColor: COLORS.opacity.violet20,
  },
  modalSelectOptionDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.surface.elevated,
  },
  modalSelectContent: {
    flex: 1,
  },
  modalSelectText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modalSelectTextActive: {
    color: COLORS.primary.violet,
  },
  modalSelectTextDisabled: {
    color: COLORS.text.secondary,
  },
  modalSelectSubtext: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  modalSelectWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Aspect Ratio Icons
  aspectRatioIconLandscape: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.opacity.white10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aspectRatioIconSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: COLORS.opacity.white10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aspectRatioIconPortrait: {
    width: 20,
    height: 28,
    borderRadius: 4,
    backgroundColor: COLORS.opacity.white10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aspectRatioIconInner: {
    width: '70%',
    height: '70%',
    borderRadius: 2,
    backgroundColor: COLORS.text.primary,
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
  // Unused styles kept for compatibility
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.ui.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
});

