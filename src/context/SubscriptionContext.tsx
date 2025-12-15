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

  // Initialize subscription services
  useEffect(() => {
    initializeSubscriptions();
  }, []);

  // Set up listener for purchase updates
  useEffect(() => {
    const customerInfoUpdateListener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('Customer info updated:', info);
      updateSubscriptionStatus(info);
    });

    return () => {
      // Cleanup listener
      if (customerInfoUpdateListener && typeof customerInfoUpdateListener.remove === 'function') {
        customerInfoUpdateListener.remove();
      }
    };
  }, []);

  const initializeSubscriptions = async () => {
    try {
      setIsLoading(true);
      
      // Initialize the subscription service
      await subscriptionService.initialize();
      
      // Check initial subscription status
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Error initializing subscriptions:', error);
    } finally {
      setIsLoading(false);
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
    try {
      await subscriptionService.presentPaywall(event);
      // After paywall is dismissed, check subscription status
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Error showing paywall:', error);
      throw error;
    }
  };

  const restorePurchases = async () => {
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

