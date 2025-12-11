import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import { getTranslatedCategories } from '../constants/categories';
import { getCreditBalance, formatCredits } from '../services/credits';
import { useSubscription } from '../context/SubscriptionContext';
import { getHistory, HistoryItem } from '../services/history';
import VideoCard from '../components/VideoCard';
import { getAllModels, getModelById, getDefaultModel } from '../constants/aiModels';
import COLORS from '../constants/colors';
import TYPO from '../constants/typography';
import { STORAGE_KEYS } from '../constants/storage';
import { saveSelectedModel } from '../services/api';
import { CREDIT_COSTS } from '../constants/credits';
import { usePurchaseListener } from '../hooks/usePurchaseListener';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');
// Ajuste para ficar próximo do mock: 3 cards grandes e pouco espaço entre eles
const CARD_WIDTH = (width - 6) / 3;

// Storage key for onboarding - using centralized storage keys
const OLD_STORAGE_KEY = '@lumo_onboarding_completed'; // Keep for backwards compatibility

// Lista de idiomas disponíveis
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const buildBeforeAfterPreview = (imageUri: string) => {
  if (!imageUri) {
    return { beforeUri: imageUri, afterUri: imageUri };
  }
  const separator = imageUri.includes('?') ? '&' : '?';
  return {
    beforeUri: `${imageUri}${separator}sat=-100`,
    afterUri: imageUri,
  };
};

const SAMPLE_VIDEO = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';

// Trending items as videos
const SECTION_ITEMS = [
  {
    id: 'sec-made-it',
    title: 'We Made It!',
    items: [
  {
    id: 'trending-1',
        name: 'AI Video Remix',
        description: 'Transforme qualquer clipe em um remix cinematográfico',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/ai-boyfriend/after.jpg'),
  },
  {
    id: 'trending-2',
        name: 'Diamond Duo',
        description: 'Duo brilhante em estética cinematográfica',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/tattoo-try-on/after.jpg'),
  },
  {
    id: 'trending-3',
        name: 'Diamond Drip',
        description: 'Estilo urbano premium em vídeo',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/fat-pet/after.jpg'),
      },
    ],
  },
  {
    id: 'sec-popular',
    title: 'Popular',
    items: [
      {
        id: 'popular-1',
        name: 'Arrest Prank',
        description: 'Cena viral em segundos',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/plumber/after.jpg'),
  },
  {
        id: 'popular-2',
        name: 'Gas Station',
        description: 'Ação noturna cinematográfica',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/homeless/after.jpg'),
      },
      {
        id: 'popular-3',
        name: 'Twilight',
        description: 'Mood gelado, vibe dramática',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/crashed-car/after.jpg'),
      },
    ],
  },
  {
    id: 'sec-xmas',
    title: 'Christmas is Coming',
    items: [
      {
        id: 'xmas-1',
        name: 'Christmas Portraits',
        description: 'Retratos natalinos com bokeh',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/ai-boyfriend/after.jpg'),
  },
  {
        id: 'xmas-2',
        name: 'Santa Season',
        description: 'Clima de família e magia',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/hairstyle-change/after.jpg'),
      },
      {
        id: 'xmas-3',
        name: 'Polaroid Christmas',
        description: 'Look retrô e cozy',
        video: SAMPLE_VIDEO,
        poster: require('../../assets/images/categories/plumber/after.jpg'),
      },
    ],
  },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const { isPro, isLoading: subscriptionLoading, showPaywall, restorePurchases } = useSubscription();
  
  // Listen for purchases and show success screen
  usePurchaseListener();
  
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showModelSelectorModal, setShowModelSelectorModal] = useState(false);
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(getDefaultModel().id);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const CATEGORIES = getTranslatedCategories(t);

  // Helper: Get credit cost for a model name
  const getModelCreditCost = (modelName: string): number | null => {
    // Extract the model type from the model name
    if (modelName.includes('gemini-3-pro') || modelName.includes('Pro')) {
      return CREDIT_COSTS['gemini-pro'];
    } else if (modelName.includes('flash') || modelName.includes('Flash')) {
      return CREDIT_COSTS['gemini-flash'];
    }
    return null;
  };

  // DEV: Open language selector
  const openLanguageSelector = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLanguageModal(true);
  };

  // DEV: Change language
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLanguageModal(false);
  };

  const handleMainButton = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowImagePickerModal(true);
  };

  const handleTrendsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Home');
  };

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
        navigation.navigate('Edit', { imageUri: result.assets[0].uri });
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
        navigation.navigate('Edit', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMsg = error instanceof Error && error.message 
        ? `${t('errors.takePhotoFailed')}: ${error.message}` 
        : t('errors.takePhotoMessage');
      Alert.alert(t('errors.takePhotoFailed'), errorMsg);
    }
  };

  const handleEffectPress = (effect: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowImagePickerModal(true);
  };

  const handleHistoryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('History');
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettingsModal(true);
    // Reload credits when opening settings (in case there was a purchase)
    loadCredits();
  };

  const handleRecentItemPress = (item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowImagePickerModal(true);
  };

  const loadRecentHistory = useCallback(async () => {
    try {
      const items = await getHistory();
      setRecentHistory(items.slice(0, 6));
    } catch (error) {
      console.error('Error loading recent history', error);
    }
  }, []);

  // Load selected AI model
  const loadSelectedModel = useCallback(async () => {
    try {
      const savedModelId = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_AI_MODEL);
      if (savedModelId) {
        setSelectedModelId(savedModelId);
      } else {
        setSelectedModelId(getDefaultModel().id);
      }
    } catch (error) {
      console.error('Error loading selected model', error);
      setSelectedModelId(getDefaultModel().id);
    }
  }, []);

  // Load credit balance
  const loadCredits = useCallback(async () => {
    try {
      console.log('🏠 [HomeScreen] Loading credits...');
      setLoadingCredits(true);
      const balance = await getCreditBalance();
      console.log('🏠 [HomeScreen] Credits loaded:', balance);
      if (balance) {
        setCredits(balance.credits);
      } else {
        console.log('🏠 [HomeScreen] No balance returned');
      }
    } catch (error) {
      console.error('🏠 [HomeScreen] Error loading credits:', error);
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentHistory();
      loadSelectedModel();
      loadCredits();
    }, [loadRecentHistory, loadSelectedModel, loadCredits])
  );

  // Handle upgrade to Pro
  const handleUpgradePress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await showPaywall();
    } catch (error) {
      console.error('Error showing paywall:', error);
      Alert.alert(
        t('subscription.error'),
        t('subscription.errorMessage')
      );
    }"/ "
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    try {
      setIsRestoringPurchases(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await restorePurchases();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('subscription.restoreSuccess'),
        t('subscription.restoreSuccessMessage')
      );
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('subscription.restoreError'),
        t('subscription.restoreErrorMessage')
      );
    } finally {
      setIsRestoringPurchases(false);
    }
  };

  // DEV: Reset onboarding and navigate back to it
  const resetAndShowOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // @ts-ignore - Navigate to Onboarding (not in Home navigation type)
      navigation.navigate('Onboarding');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      Alert.alert('Error', 'Failed to reset onboarding');
    }
  };

  // Handle AI model selection
  const handleModelSelect = async (modelId: string) => {
    try {
      await saveSelectedModel(modelId);
      setSelectedModelId(modelId);
      setShowModelSelectorModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const model = getModelById(modelId);
      Alert.alert(
        t('settings.modelChanged'),
        t('settings.modelChangedMessage', { model: model?.displayName || modelId })
      );
    } catch (error) {
      console.error('Error saving model selection:', error);
      Alert.alert(
        t('settings.error'),
        t('settings.modelSaveError')
      );
    }
  };

  const selectedModel = getModelById(selectedModelId) || getDefaultModel();

  return (
    <View style={styles.container}>
      <View style={styles.headerGradientWrapper}>
        <SafeAreaView edges={['top']}>
          <StatusBar barStyle="light-content" />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.wandIcon}
                  resizeMode="contain"
                />
                <Text style={styles.title}>{t('home.title')}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Sections */}
        {SECTION_ITEMS.map((section) => (
          <View key={section.id} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{section.title}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          >
              {section.items.map((item) => (
                <VideoCard
                key={item.id}
                  videoUri={item.video}
                  poster={item.poster}
                  title={item.name}
                  description={item.description}
                width={CARD_WIDTH}
                  height={CARD_WIDTH * 1.35}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowImagePickerModal(true);
                }}
              />
            ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Blur Gradient Overlay */}
      <LinearGradient
        colors={COLORS.gradients.overlay}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Floating Action Bar */}
      <View style={styles.actionBarContainer}>
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleTrendsPress}>
            <Ionicons name="trending-up-outline" size={26} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleMainButton}>
            <Ionicons name="add" size={32} color={COLORS.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={26} color={COLORS.text.secondary} />
        </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity 
          style={styles.settingsOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.settingsContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.settingsHandle} />
            <Text style={styles.settingsTitle}>{t('home.settingsTitle')}</Text>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>{t('home.currentPlan')}</Text>
              <View style={styles.planRow}>
                <View style={[styles.planBadge, isPro ? styles.planBadgePro : styles.planBadgeFree]}>
                  <Text style={isPro ? styles.planBadgeTextPro : styles.planBadgeTextFree}>
                    {isPro ? 'PRO' : t('home.free')}
                  </Text>
                </View>
                {!isPro && (
                  <TouchableOpacity 
                    style={styles.settingsActionButton}
                    onPress={handleUpgradePress}
                  >
                    <Text style={styles.settingsActionText}>{t('subscription.upgradeToPro')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={styles.settingsRow}
                onPress={handleRestorePurchases}
                disabled={isRestoringPurchases}
              >
                {isRestoringPurchases ? (
                  <ActivityIndicator size="small" color={COLORS.primary.violet} />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={20} color={COLORS.primary.violet} />
                    <Text style={styles.settingsRowText}>{t('subscription.restorePurchases')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Credits Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>Credits</Text>
              {loadingCredits ? (
                <View style={styles.creditsBox}>
                  <ActivityIndicator size="small" color={COLORS.primary.violet} />
                </View>
              ) : (
                <View style={styles.creditsBox}>
                  <Text style={styles.creditsAmount}>
                    {credits !== null ? formatCredits(credits) : '0'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.buyMoreButton}
                    onPress={async () => {
                      try {
                        setShowSettingsModal(false);
                        await showPaywall('buy_credits');
                        // Reload credits after purchase
                        await loadCredits();
                      } catch (error) {
                        console.error('Error showing credits paywall:', error);
                      }
                    }}
                  >
                    <Text style={styles.buyMoreText}>Buy More</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>{t('settings.aiModel')}</Text>
              <TouchableOpacity 
                style={styles.settingsRow}
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowModelSelectorModal(true);
                }}
              >
                <Ionicons name="hardware-chip-outline" size={20} color={COLORS.ui.white} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsRowText}>{selectedModel.displayName}</Text>
                  {(() => {
                    const cost = getModelCreditCost(selectedModel.name);
                    if (cost) {
                      return (
                        <Text style={styles.settingsRowSubtext}>
                          {cost} credits per image
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsLabel}>{t('home.language')}</Text>
                <TouchableOpacity 
                style={styles.settingsRow}
                onPress={() => {
                  setShowSettingsModal(false);
                  // Delay para garantir que o modal de settings feche antes de abrir o de idioma
                  setTimeout(() => {
                    openLanguageSelector();
                  }, 300);
                }}
              >
                <Ionicons name="language-outline" size={20} color={COLORS.ui.white} />
                <Text style={styles.settingsRowText}>
                  {LANGUAGES.find(l => l.code === i18n.language)?.name || i18n.language.toUpperCase()}
                </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.settingsCloseButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={styles.settingsCloseButtonText}>{t('home.close')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
            <Text style={styles.modalTitle}>{t('home.choosePhoto')}</Text>
            <Text style={styles.modalSubtitle}>{t('home.choosePhotoSubtitle')}</Text>
            
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
                  <Text style={styles.modalOptionText}>{t('home.gallery')}</Text>
                  <Text style={styles.modalOptionDescription}>{t('home.galleryDescription')}</Text>
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
                  <Text style={styles.modalOptionText}>{t('home.camera')}</Text>
                  <Text style={styles.modalOptionDescription}>{t('home.cameraDescription')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Language Selector Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.languageModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.languageModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.languageModalHeader}>
              <Text style={styles.languageModalTitle}>🌍 {t('home.language')}</Text>
              <Text style={styles.languageModalSubtitle}>{t('home.selectLanguage') || 'Choose your preferred language'}</Text>
            </View>
            
            <ScrollView 
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    i18n.language === lang.code && styles.languageItemSelected
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {i18n.language === lang.code && (
                    <View style={styles.languageCheckmark}>
                      <Text style={styles.languageCheckmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {__DEV__ && (
              <TouchableOpacity 
                style={styles.languageResetButton}
                onPress={resetAndShowOnboarding}
              >
                <Ionicons name="refresh-outline" size={16} color={COLORS.ui.white} />
                <Text style={styles.languageResetButtonText}>Reset Onboarding</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.languageCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.languageCloseButtonText}>{t('home.close')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* AI Model Selector Modal */}
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
            style={styles.modelSelectorContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modelSelectorTitle}>{t('settings.selectAIModel')}</Text>
            <Text style={styles.modelSelectorSubtitle}>{t('settings.selectAIModelSubtitle')}</Text>
            
            <ScrollView 
              style={styles.modelList}
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                const models = getAllModels();
                return models.map((model) => {
                  const cost = getModelCreditCost(model.name);
                  return (
                    <TouchableOpacity
                      key={model.id}
                      style={[
                        styles.modelItem,
                        selectedModelId === model.id && styles.modelItemSelected
                      ]}
                      onPress={() => handleModelSelect(model.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modelItemName}>{model.displayName}</Text>
                        {cost && (
                          <Text style={styles.modelItemCost}>
                            {cost} credits per image
                          </Text>
                        )}
                      </View>
                      {selectedModelId === model.id && (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.cyan} />
                      )}
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>

            <TouchableOpacity 
              style={styles.modelSelectorCloseButton}
              onPress={() => setShowModelSelectorModal(false)}
            >
              <Text style={styles.modelSelectorCloseButtonText}>{t('home.close')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  headerGradientWrapper: {
    width: '100%',
    backgroundColor: COLORS.surface.primary, // Night Graphite
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  wandIcon: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: TYPO.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  // Pro Badge and Upgrade Button
  proLoadingContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Language Selector Modal
  languageModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.ui.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  languageModalContent: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  languageModalHeader: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ui.border,
  },
  languageModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  languageModalSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ui.border,
  },
  languageItemSelected: {
    backgroundColor: COLORS.opacity.violet20,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  languageCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cta.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageCheckmarkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  languageResetButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    padding: 14,
    backgroundColor: COLORS.opacity.violet20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.opacity.violet30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  languageResetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cta.secondary,
  },
  languageCloseButton: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 16,
    alignItems: 'center',
  },
  languageCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  historyButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: COLORS.ui.overlay,
    justifyContent: 'flex-end',
  },
  settingsContent: {
    backgroundColor: COLORS.surface.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  settingsHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.ui.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  settingsSection: {
    marginBottom: 20,
    gap: 10,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  planBadgePro: {
    backgroundColor: COLORS.opacity.white20,
    borderColor: COLORS.special.gold,
  },
  planBadgeFree: {
    backgroundColor: COLORS.opacity.violet20,
    borderColor: COLORS.cta.secondary,
  },
  planBadgeTextPro: {
    color: COLORS.special.gold,
    fontWeight: '700',
    fontSize: 12,
  },
  planBadgeTextFree: {
    color: COLORS.cta.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  settingsActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.opacity.violet20,
    borderRadius: 10,
  },
  settingsActionText: {
    color: COLORS.cta.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  creditsBox: {
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  buyMoreButton: {
    backgroundColor: COLORS.cta.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyMoreText: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  settingsRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  settingsRowSubtext: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  settingsCloseButton: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface.secondary,
    alignItems: 'center',
  },
  settingsCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  // Model Selector Modal
  modelSelectorContent: {
    backgroundColor: COLORS.surface.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modelSelectorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  modelSelectorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  modelList: {
    maxHeight: 500,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelItemSelected: {
    backgroundColor: '#F8F4FF',
    borderColor: '#5B3F9E',
  },
  modelItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modelItemCost: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modelSelectorCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface.primary,
    alignItems: 'center',
  },
  modelSelectorCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 100, // Space for floating button
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    zIndex: 1,
  },
  actionBarContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface.secondary,
    borderRadius: 36,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.ui.border,
  },
  actionButtonPrimary: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.text.black,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: COLORS.ui.border,
  },
  actionButtonSecondary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.ui.border,
  },
  categorySection: {
    marginBottom: 32,
  },
  recentSection: {
    marginBottom: 32,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  recentTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.brand.cyan,
  },
  recentCardsContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  recentCard: {
    width: CARD_WIDTH,
    marginRight: 15,
  },
  recentCardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginBottom: 16,
    gap: 10,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: TYPO.semibold,
    color: COLORS.text.secondary, // cinza para títulos de categoria (como no mock)
  },
  cardsContainer: {
    paddingHorizontal: 2,
    gap: 2,
    marginLeft: 15,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: 2,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLabel: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: TYPO.semibold,
    color: COLORS.text.primary,
    textAlign: 'center',
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
    fontFamily: TYPO.bold,
    textAlign: 'center',
    marginBottom: 8,
    color: COLORS.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    color: COLORS.text.secondary,
    fontFamily: TYPO.medium,
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
    fontFamily: TYPO.medium,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: TYPO.regular,
  },
  // Restore Purchases
  restorePurchasesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  restorePurchasesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.opacity.violet20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.opacity.violet30,
  },
  restorePurchasesText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cta.secondary,
  },
});

