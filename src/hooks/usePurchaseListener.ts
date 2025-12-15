/**
 * Hook to listen for purchase completions and navigate to success screen
 */

import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Purchases, { CustomerInfo, PurchasesStoreTransaction } from 'react-native-purchases';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Subscription product IDs and their display names
const SUBSCRIPTION_PRODUCTS: Record<string, string> = {
  'mooviaproweekly': 'Moovia Pro Weekly',
  'mooviaproannual': 'Moovia Pro Annual',
};

// One-time purchase product IDs and their credit amounts
const CREDIT_PRODUCTS: Record<string, number> = {
  'moovia_credits_1000': 1000,
  'moovia_credits_5000': 5000,
  'moovia_credits_10000': 10000,
};

export function usePurchaseListener() {
  const navigation = useNavigation<NavigationProp>();
  const lastCreditTransactionIdRef = useRef<string | null>(null);
  const lastSubscriptionTransactionIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    console.log('📱 [PurchaseListener] Setting up purchase listener...');

    const customerInfoUpdateListener = Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
      console.log('📱 [PurchaseListener] Customer info updated');
      
      // Skip the first update (initialization) - just store initial state
      if (!isInitializedRef.current) {
        console.log('📱 [PurchaseListener] Initializing...');
        isInitializedRef.current = true;
        
        // Store initial state (get LAST transaction = most recent)
        const nonSubscriptionTransactions = customerInfo.nonSubscriptionTransactions;
        if (nonSubscriptionTransactions.length > 0) {
          const latestTransaction = nonSubscriptionTransactions[nonSubscriptionTransactions.length - 1];
          lastCreditTransactionIdRef.current = latestTransaction.transactionIdentifier;
          console.log('📱 [PurchaseListener] Initial credit transaction:', lastCreditTransactionIdRef.current);
        }
        
        const activeSubscriptions = customerInfo.activeSubscriptions;
        if (activeSubscriptions.length > 0) {
          const productId = activeSubscriptions[0];
          const subscription = customerInfo.subscriptionsByProductIdentifier?.[productId];
          if (subscription) {
            lastSubscriptionTransactionIdRef.current = subscription.storeTransactionId;
            console.log('📱 [PurchaseListener] Initial subscription transaction:', lastSubscriptionTransactionIdRef.current);
          }
        }
        
        return;
      }
      
      // Check for NEW credit purchases (one-time) - get LAST transaction = most recent
      const nonSubscriptionTransactions = customerInfo.nonSubscriptionTransactions;
      if (nonSubscriptionTransactions.length > 0) {
        const latestTransaction = nonSubscriptionTransactions[nonSubscriptionTransactions.length - 1];
        const transactionId = latestTransaction.transactionIdentifier;
        
        if (transactionId && transactionId !== lastCreditTransactionIdRef.current) {
          console.log(`📱 [PurchaseListener] 🎉 NEW credit purchase detected!`);
          console.log(`📱 [PurchaseListener] Transaction ID: ${transactionId}`);
          
          lastCreditTransactionIdRef.current = transactionId;
          
          const productId = latestTransaction.productIdentifier;
          const credits = CREDIT_PRODUCTS[productId];
          
          if (credits) {
            console.log(`📱 [PurchaseListener] Navigating to success screen: ${credits} credits`);
            
            setTimeout(() => {
              navigation.navigate('PurchaseSuccess', {
                purchaseType: 'credits',
                credits: credits,
              });
            }, 800);
            
            return; // Don't check subscription on same update
          }
        }
      }
      
      // Check for NEW subscription purchases
      const activeSubscriptions = customerInfo.activeSubscriptions;
      if (activeSubscriptions.length > 0) {
        const productId = activeSubscriptions[0];
        const subscription = customerInfo.subscriptionsByProductIdentifier?.[productId];
        
        if (subscription) {
          const currentTransactionId = subscription.storeTransactionId;
          
          if (currentTransactionId && currentTransactionId !== lastSubscriptionTransactionIdRef.current) {
            console.log(`📱 [PurchaseListener] 🎉 NEW subscription purchase detected!`);
            console.log(`📱 [PurchaseListener] Transaction ID: ${currentTransactionId}`);
            console.log(`📱 [PurchaseListener] Product: ${productId}`);
            
            lastSubscriptionTransactionIdRef.current = currentTransactionId;
            
            const subscriptionName = SUBSCRIPTION_PRODUCTS[productId];
            if (subscriptionName) {
              console.log(`📱 [PurchaseListener] Navigating to success screen: ${subscriptionName}`);
              
              setTimeout(() => {
                navigation.navigate('PurchaseSuccess', {
                  purchaseType: 'subscription',
                  subscriptionName: subscriptionName,
                });
              }, 800);
            }
          }
        }
      }
    });

    return () => {
      console.log('📱 [PurchaseListener] Removing purchase listener');
      if (customerInfoUpdateListener && typeof customerInfoUpdateListener.remove === 'function') {
        customerInfoUpdateListener.remove();
      }
    };
  }, [navigation]);
}

