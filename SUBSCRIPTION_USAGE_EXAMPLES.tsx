// Example: How to use subscription in your screens

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSubscription } from '../context/SubscriptionContext';

export default function ExampleScreen() {
  const { isPro, isLoading, showPaywall } = useSubscription();

  // Example 1: Check if user is Pro before allowing access to a feature
  const handlePremiumFeature = async () => {
    if (!isPro) {
      // User is not Pro, show paywall
      try {
        await showPaywall();
        // After paywall is dismissed, check again if user became Pro
        // The subscription state will be automatically updated
      } catch (error) {
        Alert.alert('Error', 'Failed to show subscription options');
      }
      return;
    }
    
    // User is Pro, allow access to premium feature
    console.log('User has Pro access!');
    // ... your premium feature logic here
  };

  // Example 2: Show different UI based on Pro status
  const renderContent = () => {
    if (isLoading) {
      return <Text>Loading subscription status...</Text>;
    }

    if (isPro) {
      return (
        <View>
          <Text>✨ You have Pro access!</Text>
          <Text>Enjoy all premium features</Text>
        </View>
      );
    }

    return (
      <View>
        <Text>Unlock premium features</Text>
        <TouchableOpacity onPress={handlePremiumFeature}>
          <Text>Upgrade to Pro</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Example 3: Show Pro badge
  const renderProBadge = () => {
    if (isPro) {
      return (
        <View style={{ backgroundColor: '#FFD700', padding: 4, borderRadius: 4 }}>
          <Text style={{ fontWeight: 'bold' }}>PRO</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View>
      {renderProBadge()}
      {renderContent()}
    </View>
  );
}

// Example 4: Trigger specific paywalls for different features
export function ExampleWithCustomPaywall() {
  const { showPaywall } = useSubscription();

  const handleSpecificFeature = async () => {
    try {
      // You can pass a custom event name to trigger specific paywalls
      // configured in Superwall dashboard
      await showPaywall('premium_filters'); // Custom event name
    } catch (error) {
      console.error('Error showing paywall:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleSpecificFeature}>
      <Text>Access Premium Filters</Text>
    </TouchableOpacity>
  );
}

// Example 5: Programmatically check subscription without showing paywall
export function ExampleCheckOnly() {
  const { isPro, checkSubscriptionStatus } = useSubscription();

  const refreshSubscription = async () => {
    try {
      await checkSubscriptionStatus();
      console.log('Subscription status refreshed');
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  return (
    <View>
      <Text>Pro Status: {isPro ? 'Active' : 'Inactive'}</Text>
      <TouchableOpacity onPress={refreshSubscription}>
        <Text>Refresh Status</Text>
      </TouchableOpacity>
    </View>
  );
}

// Example 6: Restore purchases
export function ExampleRestorePurchases() {
  const { restorePurchases } = useSubscription();

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  return (
    <TouchableOpacity onPress={handleRestore}>
      <Text>Restore Purchases</Text>
    </TouchableOpacity>
  );
}

