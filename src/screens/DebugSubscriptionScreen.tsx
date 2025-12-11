import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import subscriptionService from '../services/subscription';

/**
 * DEBUG SCREEN - Subscription Testing
 * 
 * Use this screen to test and debug your Superwall + RevenueCat integration
 * 
 * HOW TO USE:
 * 1. Navigate to this screen in your app
 * 2. Click "🔍 Full Debug Report" first
 * 3. Copy the Product IDs shown in the console
 * 4. Go to Superwall Dashboard and update your paywall with those IDs
 * 5. Test the purchase again
 */
export default function DebugSubscriptionScreen() {
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [productIds, setProductIds] = useState<string[]>([]);

  const handleDebugReport = async () => {
    setLoading(true);
    try {
      await subscriptionService.debugSuperwallConfig();
      Alert.alert(
        '✅ Debug Complete',
        'Check your console/logs for the full debug report with Product IDs'
      );
    } catch (error) {
      console.error('Debug error:', error);
      Alert.alert('❌ Error', 'Failed to generate debug report');
    } finally {
      setLoading(false);
    }
  };

  const handleListProductIds = async () => {
    setLoading(true);
    try {
      const ids = await subscriptionService.getAvailableProductIds();
      setProductIds(ids);
      console.log('📦 Product IDs:', ids);
      Alert.alert(
        '📦 Product IDs',
        ids.length > 0
          ? `Found ${ids.length} products:\n\n${ids.join('\n')}\n\nCheck console for details.`
          : 'No products found. Check RevenueCat configuration.'
      );
    } catch (error) {
      console.error('Error listing products:', error);
      Alert.alert('❌ Error', 'Failed to list products');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckProStatus = async () => {
    setLoading(true);
    try {
      const pro = await subscriptionService.isPro();
      setIsPro(pro);
      Alert.alert(
        pro ? '👑 Pro User' : '👤 Free User',
        pro ? 'You have an active subscription!' : 'No active subscription found.'
      );
    } catch (error) {
      console.error('Error checking Pro status:', error);
      Alert.alert('❌ Error', 'Failed to check Pro status');
    } finally {
      setLoading(false);
    }
  };

  const handleShowPaywall = async () => {
    setLoading(true);
    try {
      console.log('🎯 Showing paywall...');
      await subscriptionService.presentPaywall('onboarding');
    } catch (error) {
      console.error('Error showing paywall:', error);
      Alert.alert('❌ Error', 'Failed to show paywall');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      await subscriptionService.restorePurchases();
      Alert.alert('✅ Success', 'Purchases restored successfully!');
      // Check Pro status again
      const pro = await subscriptionService.isPro();
      setIsPro(pro);
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert('❌ Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStatus = async () => {
    setLoading(true);
    try {
      await subscriptionService.syncSubscriptionStatus();
      Alert.alert('✅ Success', 'Subscription status synced with Superwall');
    } catch (error) {
      console.error('Error syncing status:', error);
      Alert.alert('❌ Error', 'Failed to sync status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Subscription Debug</Text>
        <Text style={styles.subtitle}>Superwall + RevenueCat Testing</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {isPro !== null && (
        <View style={[styles.statusCard, isPro ? styles.proCard : styles.freeCard]}>
          <Text style={styles.statusEmoji}>{isPro ? '👑' : '👤'}</Text>
          <Text style={styles.statusText}>
            {isPro ? 'Pro User - Active Subscription' : 'Free User - No Subscription'}
          </Text>
        </View>
      )}

      {productIds.length > 0 && (
        <View style={styles.productIdsCard}>
          <Text style={styles.cardTitle}>📦 Available Products:</Text>
          {productIds.map((id, index) => (
            <Text key={id} style={styles.productId}>
              {index + 1}. {id}
            </Text>
          ))}
          <Text style={styles.warningText}>
            ⚠️ Use these EXACT IDs in Superwall Dashboard
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Diagnostic Tools</Text>
        
        <DebugButton
          title="🔍 Full Debug Report"
          subtitle="See complete configuration & Product IDs"
          onPress={handleDebugReport}
          disabled={loading}
          isPrimary
        />

        <DebugButton
          title="📦 List Product IDs"
          subtitle="Show available Product IDs only"
          onPress={handleListProductIds}
          disabled={loading}
        />

        <DebugButton
          title="👑 Check Pro Status"
          subtitle="Verify if user has active subscription"
          onPress={handleCheckProStatus}
          disabled={loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Purchase Actions</Text>
        
        <DebugButton
          title="💰 Show Paywall"
          subtitle="Test paywall presentation"
          onPress={handleShowPaywall}
          disabled={loading}
          isPrimary
        />

        <DebugButton
          title="🔄 Restore Purchases"
          subtitle="Restore previous purchases"
          onPress={handleRestorePurchases}
          disabled={loading}
        />

        <DebugButton
          title="🔁 Sync Status"
          subtitle="Sync subscription status with Superwall"
          onPress={handleSyncStatus}
          disabled={loading}
        />
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📝 Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Click "Full Debug Report"{'\n'}
          2. Check console/logs for Product IDs{'\n'}
          3. Copy those IDs to Superwall Dashboard{'\n'}
          4. Publish your paywall{'\n'}
          5. Test "Show Paywall" again
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Check Metro/Xcode logs for detailed output
        </Text>
      </View>
    </ScrollView>
  );
}

interface DebugButtonProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  isPrimary?: boolean;
}

function DebugButton({ title, subtitle, onPress, disabled, isPrimary }: DebugButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonTitle, isPrimary && styles.primaryButtonText]}>
        {title}
      </Text>
      <Text style={[styles.buttonSubtitle, isPrimary && styles.primaryButtonSubtext]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  statusCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proCard: {
    backgroundColor: '#FFD700',
  },
  freeCard: {
    backgroundColor: '#fff',
  },
  statusEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productIdsCard: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  productId: {
    fontSize: 14,
    fontFamily: 'Courier',
    color: '#333',
    marginVertical: 3,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 10,
    fontWeight: '600',
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  primaryButtonText: {
    color: '#fff',
  },
  buttonSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  primaryButtonSubtext: {
    color: '#fff',
    opacity: 0.9,
  },
  instructionsCard: {
    margin: 15,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  instructionsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

