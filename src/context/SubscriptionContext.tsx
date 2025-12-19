import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Platform } from 'react-native';
import subscriptionService, { MOOVIA_PRO_ENTITLEMENT } from '../services/subscription';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getCreditBalance } from '../services/credits';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  showPaywall: (event?: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationFailed, setInitializationFailed] = useState(false);

  // Initialize subscription services
  useEffect(() => {
    initializeSubscriptions();
  }, []);

  // Set up listener for purchase updates
  useEffect(() => {
    let customerInfoUpdateListener: any = null;
    
    // Only set up listener if initialization succeeded
    if (!initializationFailed) {
      try {
        customerInfoUpdateListener = Purchases.addCustomerInfoUpdateListener((info) => {
          console.log('Customer info updated:', info);
          updateSubscriptionStatus(info);
        });
      } catch (error) {
        console.warn('Failed to set up customer info listener:', error);
      }
    }

    return () => {
      // Cleanup listener
      if (customerInfoUpdateListener && typeof customerInfoUpdateListener.remove === 'function') {
        customerInfoUpdateListener.remove();
      }
    };
  }, [initializationFailed]);

  const initializeSubscriptions = async () => {
    // Longer timeout for iPad (StoreKit can take 10+ seconds on iPad)
    const INIT_TIMEOUT = Platform.OS === 'ios' ? 25000 : 10000; // 25 seconds for iOS (includes iPad)
    
    try {
      setIsLoading(true);
      console.log('🚀 [SubscriptionContext] Starting subscription initialization...');
      console.log('📱 [SubscriptionContext] Platform:', Platform.OS, 'Version:', Platform.Version);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Subscription initialization timeout')), INIT_TIMEOUT);
      });
      
      // Race between initialization and timeout
      await Promise.race([
        (async () => {
          // Initialize the subscription service
          await subscriptionService.initialize();
          console.log('✅ [SubscriptionContext] Subscription service initialized');
          
          // Check initial subscription status
          await checkSubscriptionStatus();
          console.log('✅ [SubscriptionContext] Initial subscription status checked');
        })(),
        timeoutPromise
      ]);
      
    } catch (error) {
      console.error('❌ [SubscriptionContext] Error initializing subscriptions:', error);
      console.warn('⚠️  [SubscriptionContext] App will continue with limited subscription features');
      console.warn('⚠️  [SubscriptionContext] This is expected on iPad if RevenueCat/Superwall have issues');
      setInitializationFailed(true);
      setIsPro(false); // Default to non-pro if initialization fails
    } finally {
      // CRITICAL: Always set loading to false to unblock the app
      setIsLoading(false);
      console.log('✅ [SubscriptionContext] Initialization complete (loading: false)');
    }
  };

  const updateSubscriptionStatus = async (customerInfo: any) => {
    const hasProAccess = typeof customerInfo.entitlements.active[MOOVIA_PRO_ENTITLEMENT] !== 'undefined';
    setIsPro(hasProAccess);
    console.log('Pro status:', hasProAccess);
    
    // Sync status with Superwall
    await subscriptionService.syncSubscriptionStatus();
    
    // Refresh credit balance after subscription update
    // This ensures credits are synced even if webhook is delayed
    console.log('💰 [SubscriptionContext] Refreshing credit balance after subscription update...');
    try {
      await getCreditBalance();
      console.log('💰 [SubscriptionContext] Credit balance refreshed successfully');
    } catch (error) {
      console.error('💰 [SubscriptionContext] Error refreshing credits:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const customerInfo = await subscriptionService.getCustomerInfo();
      if (customerInfo) {
        updateSubscriptionStatus(customerInfo);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsPro(false);
    }
  };

  const showPaywall = async (event?: string) => {
    console.log(`[SubscriptionContext] showPaywall called with event: ${event || 'default'}`);
    console.log(`[SubscriptionContext] Initialization failed: ${initializationFailed}`);
    
    if (initializationFailed) {
      console.warn('⚠️  [SubscriptionContext] Cannot show paywall: subscription service not initialized');
      console.warn('⚠️  [SubscriptionContext] This may happen on iPad if RevenueCat/Superwall have issues');
      // Don't throw - instead, fail silently and let the app continue
      // This prevents buttons from appearing "unresponsive" on iPad
      return;
    }
    
    try {
      console.log(`[SubscriptionContext] Presenting paywall for event: ${event || 'default'}`);
      await subscriptionService.presentPaywall(event);
      // After paywall is dismissed, check subscription status
      console.log('[SubscriptionContext] Paywall dismissed, checking subscription status');
      await checkSubscriptionStatus();
      console.log('[SubscriptionContext] Subscription status checked successfully');
    } catch (error) {
      console.error('[SubscriptionContext] Error showing paywall:', error);
      console.error('[SubscriptionContext] Error type:', typeof error);
      console.error('[SubscriptionContext] Error details:', error);
      // Don't throw - fail gracefully and let the app continue
      // This prevents buttons from getting stuck
    }
  };

  const restorePurchases = async () => {
    if (initializationFailed) {
      console.warn('⚠️  [SubscriptionContext] Cannot restore purchases: subscription service not initialized');
      throw new Error('Subscription service unavailable');
    }
    
    try {
      const customerInfo = await subscriptionService.restorePurchases();
      await updateSubscriptionStatus(customerInfo);
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  };

  const value: SubscriptionContextType = {
    isPro,
    isLoading,
    showPaywall,
    restorePurchases,
    checkSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

