import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation';
import * as Haptics from 'expo-haptics';

type PurchaseSuccessRouteProp = RouteProp<RootStackParamList, 'PurchaseSuccess'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function PurchaseSuccessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PurchaseSuccessRouteProp>();
  
  const { 
    purchaseType = 'credits', // 'credits' | 'subscription'
    credits = 0,
    subscriptionName = '',
  } = route.params || {};

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const overlayFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animations
    Animated.parallel([
      Animated.timing(overlayFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlayFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleClose();
  };

  return (
    <Modal transparent visible animationType="none">
      <TouchableWithoutFeedback onPress={handleContinue}>
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayFadeAnim }
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                }
              ]}
            >
              {/* Success Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="checkmark" size={60} color="#FFF" />
                </View>
              </View>

              {/* Success Message */}
              <Animated.View
                style={[
                  styles.contentContainer,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={styles.title}>Payment Successful! 🎉</Text>
                
                {purchaseType === 'credits' ? (
                  <>
                    <View style={styles.creditsBox}>
                      <Ionicons name="flash" size={24} color="#FFD700" />
                      <Text style={styles.creditsAmount}>+{credits.toLocaleString('en-US')}</Text>
                      <Text style={styles.creditsLabel}>Credits Added</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.subscriptionBox}>
                      <Ionicons name="star" size={24} color="#FFD700" />
                      <Text style={styles.subscriptionName}>{subscriptionName}</Text>
                      <Text style={styles.subscriptionLabel}>Active</Text>
                    </View>
                  </>
                )}

                <Text style={styles.description}>
                  Tap anywhere to continue
                </Text>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: width - 48,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  creditsBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  creditsAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000',
    marginTop: 8,
  },
  creditsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  subscriptionBox: {
    backgroundColor: '#F0E6FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#5B3F9E',
  },
  subscriptionName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
  },
  subscriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

