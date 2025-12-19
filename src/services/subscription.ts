import Purchases, { PurchasesOffering, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Superwall, {
  SubscriptionStatus,
  LogLevel,
  PaywallPresentationHandler,
  PaywallSkippedReasonPlacementNotFound,
} from '@superwall/react-native-superwall';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

// Configuration constants - Replace with your actual keys
const REVENUECAT_API_KEYS = {
  ios: 'appl_QwTvRjqxxLtaAYzqPVWYofCVzPI',
  android: 'YOUR_REVENUECAT_ANDROID_API_KEY',
};

const SUPERWALL_API_KEY = 'pk_NGQ0ze9b1MwetXf7K5sDZ';

// IMPORTANT: Use the entitlement IDENTIFIER (not the ID) from RevenueCat dashboard
// The identifier is usually something like 'pro', 'premium', etc.
// Your RevenueCat Entitlement ID: entl914f737c5d
// Make sure the identifier below matches what you set in RevenueCat dashboard
export const MOOVIA_PRO_ENTITLEMENT = 'pro';

class SubscriptionService {
  private initialized = false;
  private superwallInstance: Superwall | null = null;

  /**
   * Initialize RevenueCat and Superwall
   * Call this once when the app starts
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) {
      console.log('SubscriptionService already initialized');
      return;
    }

    try {
      console.log('🚀 [SubscriptionService] Starting initialization...');
      console.log('🚀 [SubscriptionService] Platform:', Platform.OS, Platform.Version);
      
      // Initialize RevenueCat
      const apiKey = Platform.select({
        ios: REVENUECAT_API_KEYS.ios,
        android: REVENUECAT_API_KEYS.android,
      });

      if (!apiKey || apiKey.includes('YOUR_')) {
        console.warn('⚠️ RevenueCat API key not configured. Please add your keys to src/services/subscription.ts');
        throw new Error('RevenueCat API key not configured');
      }

      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      console.log('📱 [SubscriptionService] Configuring RevenueCat...');
      
      // Configure RevenueCat first (without user ID to avoid conflicts)
      await Purchases.configure({
        apiKey: apiKey || '',
      });
      
      console.log('✅ [SubscriptionService] RevenueCat configured');

      // Then login with device-based ID
      try {
        const installationId = await Application.getIosIdForVendorAsync();
        if (installationId && !userId) {
          const deviceUserId = `device_${installationId}`;
          console.log('📱 Logging in with device-based user ID:', deviceUserId.substring(0, 30) + '...');
          
          await Purchases.logIn(deviceUserId);
          console.log('✅ Successfully logged in with device ID');
        } else if (userId) {
          // If custom userId provided, use it
          await Purchases.logIn(userId);
          console.log('✅ Logged in with custom user ID');
        } else {
          console.log('⚠️  No device ID available, using anonymous RevenueCat ID');
        }
      } catch (loginError) {
        console.warn('⚠️  Failed to login with device ID, continuing with anonymous ID:', loginError);
        // Continue with initialization even if login fails
      }

      console.log('🎨 [SubscriptionService] Configuring Superwall...');
      
      // Initialize Superwall WITHOUT RevenueCat as PurchaseController
      // This is more reliable for React Native according to Superwall docs
      // RevenueCat will sync purchases automatically through StoreKit observation
      this.superwallInstance = await Superwall.configure({
        apiKey: SUPERWALL_API_KEY,
        // NOT using purchaseController - let Superwall handle purchases directly
      });

      console.log('✅ [SubscriptionService] Superwall configured');

      // Enable verbose Superwall logs to debug paywall presentation
      await this.superwallInstance.setLogLevel(LogLevel.Debug);
      
      // Log when Superwall/RevenueCat integration events happen
      console.log('🔧 Configuring Superwall without PurchaseController...');
      console.log('   RevenueCat will sync purchases via StoreKit observation');
      console.log('✅ Superwall configured successfully');

      // Set up customer info update listener to sync subscription status
      try {
        Purchases.addCustomerInfoUpdateListener((info) => {
          console.log('[RevenueCat] Customer info updated');
          // Just sync subscription status, webhook handles credits
          this.forceRefreshSubscriptionStatus();
        });
      } catch (listenerError) {
        console.warn('⚠️  Failed to set up customer info listener:', listenerError);
      }

      // Sync initial subscription status with Superwall
      console.log('🔄 [SubscriptionService] Syncing initial subscription status...');
      await this.syncSubscriptionStatus();
      console.log('✅ [SubscriptionService] Initial subscription status synced');

      this.initialized = true;
      console.log('✅ Subscription services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing subscription services:', error);
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Sync subscription status from RevenueCat to Superwall
   * This is required when using RevenueCat as PurchaseController
   */
  async syncSubscriptionStatus(): Promise<void> {
    try {
      if (!this.superwallInstance) {
        return;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      const hasActiveSubscription = typeof customerInfo.entitlements.active[MOOVIA_PRO_ENTITLEMENT] !== 'undefined';
      
      // Set subscription status in Superwall
      const status: SubscriptionStatus = hasActiveSubscription 
        ? SubscriptionStatus.Active([MOOVIA_PRO_ENTITLEMENT])
        : SubscriptionStatus.Inactive();
        
      await this.superwallInstance.setSubscriptionStatus(status);
      
      console.log('Subscription status synced to Superwall:', status.status);
    } catch (error) {
      console.error('Error syncing subscription status:', error);
    }
  }

  /**
   * Force refresh subscription status after a purchase
   * This invalidates the cache and fetches fresh data from the server
   */
  async forceRefreshSubscriptionStatus(retries = 3, delayMs = 1000): Promise<void> {
    console.log('🔄 [SubscriptionService] Force refreshing subscription status after purchase...');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${retries} to refresh customer info...`);
        
        // CRITICAL: First, sync purchases with Apple/Google to ensure receipt is processed
        console.log('📤 Syncing purchases with store...');
        try {
          await Purchases.syncPurchases();
          console.log('✅ Purchases synced successfully');
        } catch (syncError) {
          console.warn('⚠️  Sync purchases failed (this may be okay):', syncError);
        }
        
        // Invalidate the cache to force fresh fetch from server
        console.log('🗑️  Invalidating customer info cache...');
        await Purchases.invalidateCustomerInfoCache();
        
        // Wait a bit for the backend to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now get fresh customer info from server (not cache)
        console.log('📡 Fetching fresh customer info from server...');
        const customerInfo = await Purchases.getCustomerInfo();
        
        const hasActiveSubscription = typeof customerInfo.entitlements.active[MOOVIA_PRO_ENTITLEMENT] !== 'undefined';
        
        console.log(`📊 Customer Info Retrieved:`, {
          hasActiveSubscription,
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allEntitlements: customerInfo.entitlements.all,
          userId: customerInfo.originalAppUserId,
          latestExpirationDate: customerInfo.latestExpirationDate,
        });
        
        // Update Superwall with new status
        if (this.superwallInstance) {
          const status: SubscriptionStatus = hasActiveSubscription 
            ? SubscriptionStatus.Active([MOOVIA_PRO_ENTITLEMENT])
            : SubscriptionStatus.Inactive();
            
          await this.superwallInstance.setSubscriptionStatus(status);
          console.log('✅ Subscription status updated in Superwall:', status.status);
        }
        
        // If we have an active subscription, we're done
        if (hasActiveSubscription) {
          console.log('✅ [SubscriptionService] Subscription status successfully refreshed!');
          return;
        }
        
        // If no active subscription yet and we have retries left, wait and try again
        if (attempt < retries) {
          console.log(`⏳ No active subscription yet, waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        // If this was the last attempt, throw
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retrying
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.warn('⚠️  [SubscriptionService] Failed to confirm active subscription after all retries');
  }

  /**
   * Check if user has an active subscription (Moovia Pro)
   */
  async isPro(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasProAccess = typeof customerInfo.entitlements.active[MOOVIA_PRO_ENTITLEMENT] !== 'undefined';
      return hasProAccess;
    } catch (error) {
      console.error('Error checking Pro status:', error);
      return false;
    }
  }

  /**
   * Get current customer info from RevenueCat
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  /**
   * Get available offerings from RevenueCat
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  }

  /**
   * Present the Superwall paywall
   * @param placement - Optional placement name to trigger specific paywalls
   * 
   * NOTE: Using default Superwall placement 'campaign_trigger'
   * You can create custom placements in Superwall Dashboard if needed
   */
  async presentPaywall(placement?: string): Promise<void> {
    try {
      if (!this.superwallInstance) {
        console.error('❌ [Paywall] Superwall not initialized. Cannot show paywall.');
        throw new Error('Superwall not initialized. Call initialize() first.');
      }
      
      // Use placement parameter (default to 'campaign_trigger' - Superwall's default)
      const placementName = placement || 'campaign_trigger';
      
      console.log(`🎯 [Paywall] Attempting to show paywall for placement: "${placementName}"`);
      console.log(`🎯 [Paywall] Platform: ${Platform.OS}, Version: ${Platform.Version}`);
      
      // Log current subscription status before showing paywall
      const isPro = await this.isPro();
      console.log(`👤 [Paywall] Current Pro status: ${isPro}`);
      console.log(`📍 [Paywall] Placement: "${placementName}"`);
      
      const handler = new PaywallPresentationHandler();
      let fallbackAttempted = false;

      // Log lifecycle for debugging
      handler.onPresent((info) => {
        console.log('[Superwall] ✅ Paywall present:', info.identifier, 'placement:', placementName);
      });
      handler.onDismiss((info, result) => {
        console.log('[Superwall] ❌ Paywall dismissed:', info.identifier, 'result:', result);
        
        // If the paywall was dismissed with a purchase, force refresh the subscription status
        if (result && typeof result === 'object') {
          const resultObj = result as any;
          const state = resultObj.state;
          const type = resultObj.type;
          
          // Check both 'state' and 'type' fields for purchase confirmation
          if (state === 'purchased' || state === 'completed' || type === 'purchased' || type === 'completed') {
            console.log('✅ Purchase detected on dismiss, forcing refresh with longer delay...');
            // Use longer delays for post-purchase refresh
            this.forceRefreshSubscriptionStatus(5, 2000); // 5 retries, 2 seconds between
          }
        }
      });
      handler.onError((error) => {
        console.log('[Superwall] ⚠️ Paywall error:', error, 'placement:', placementName);
      });
      handler.onSkip((reason) => {
        console.log(
          '[Superwall] ⏭️ Paywall skipped. Reason:',
          reason?.constructor?.name || reason,
          'Reason details:', reason,
          'placement:',
          placementName
        );

        // Fallback: if placement not found, try default campaign_trigger once
        if (!fallbackAttempted && reason instanceof PaywallSkippedReasonPlacementNotFound) {
          fallbackAttempted = true;
          console.log('[Superwall] 🔄 Retrying paywall with placement "campaign_trigger"');

          const fallbackHandler = new PaywallPresentationHandler();
          fallbackHandler.onPresent((info) => {
            console.log('[Superwall] (fallback) ✅ Paywall present:', info.identifier, 'placement: campaign_trigger');
          });
          fallbackHandler.onDismiss((info, result) => {
            console.log('[Superwall] (fallback) ❌ Paywall dismissed:', info.identifier, 'result:', result);
          });
          fallbackHandler.onError((error) => {
            console.log('[Superwall] (fallback) ⚠️ Paywall error:', error, 'placement: campaign_trigger');
          });
          fallbackHandler.onSkip((fallbackReason) => {
            console.log(
              '[Superwall] (fallback) ⏭️ Paywall skipped. Reason:',
              fallbackReason?.constructor?.name || fallbackReason,
              'Reason details:', fallbackReason,
              'placement: campaign_trigger'
            );
          });

          if (!this.superwallInstance) {
            console.warn('[Superwall] (fallback) superwallInstance is null');
            return;
          }

          this.superwallInstance
            .register({
              placement: 'campaign_trigger',
              handler: fallbackHandler,
            })
            .catch((err) => {
              console.log('[Superwall] (fallback) register error:', err);
            });
        }
      });

      await this.superwallInstance.register({
        placement: placementName,
        handler,
      });
      
      console.log(`✅ [Paywall] Register completed for placement: "${placementName}"`);
    } catch (error) {
      console.error('❌ [Paywall] Error presenting paywall:', error);
      console.error('❌ [Paywall] Error details:', JSON.stringify(error, null, 2));
      
      // On iPad, sometimes Superwall can fail - log more context
      if (Platform.OS === 'ios') {
        console.error('❌ [Paywall] iOS/iPad specific error - may need Superwall configuration check');
      }
      
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('Purchases restored successfully');
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  /**
   * Identify user with RevenueCat and Superwall
   */
  async identifyUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      
      if (this.superwallInstance) {
        await this.superwallInstance.setUserAttributes({ userId });
      }
      
      console.log('User identified:', userId);
    } catch (error) {
      console.error('Error identifying user:', error);
      throw error;
    }
  }

  /**
   * Log out user
   */
  async logoutUser(): Promise<void> {
    try {
      await Purchases.logOut();
      
      if (this.superwallInstance) {
        await this.superwallInstance.reset();
      }
      
      console.log('User logged out');
    } catch (error) {
      console.error('Error logging out user:', error);
      throw error;
    }
  }

  /**
   * Get Superwall instance for direct access
   * Useful for debugging or advanced features
   */
  getSuperwallInstance(): Superwall | null {
    return this.superwallInstance;
  }

  /**
   * Debug method to check Superwall configuration
   */
  async debugSuperwallConfig(): Promise<void> {
    try {
      console.log('\n');
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║     SUPERWALL + REVENUECAT DEBUG REPORT       ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log('\n');
      
      console.log('🔧 INITIALIZATION STATUS:');
      console.log('  • Service Initialized:', this.initialized);
      console.log('  • Superwall Instance:', !!this.superwallInstance ? '✅ Active' : '❌ Not Active');
      console.log('  • RevenueCat API Key:', REVENUECAT_API_KEYS.ios ? '✅ Configured' : '❌ Missing');
      console.log('  • Superwall API Key:', SUPERWALL_API_KEY ? '✅ Configured' : '❌ Missing');
      console.log('\n');
      
      if (this.superwallInstance) {
        console.log('👤 USER SUBSCRIPTION STATUS:');
        const customerInfo = await Purchases.getCustomerInfo();
        const hasProAccess = typeof customerInfo.entitlements.active[MOOVIA_PRO_ENTITLEMENT] !== 'undefined';
        console.log('  • Has Pro Access:', hasProAccess ? '✅ YES' : '❌ NO');
        console.log('  • Entitlement ID:', MOOVIA_PRO_ENTITLEMENT);
        console.log('  • Active Entitlements:', Object.keys(customerInfo.entitlements.active).length > 0 
          ? Object.keys(customerInfo.entitlements.active).join(', ')
          : 'None');
        console.log('  • User ID:', customerInfo.originalAppUserId);
        console.log('\n');
        
        console.log('📦 AVAILABLE PRODUCTS (from RevenueCat):');
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          console.log('  Offering ID:', offerings.current.identifier);
          console.log('  Total Packages:', offerings.current.availablePackages.length);
          console.log('\n');
          
          offerings.current.availablePackages.forEach((pkg, index) => {
            console.log(`  ${index + 1}. Package: ${pkg.identifier}`);
            console.log(`     Product ID: ${pkg.product.identifier}`);
            console.log(`     Title: ${pkg.product.title}`);
            console.log(`     Price: ${pkg.product.priceString}`);
            console.log(`     Description: ${pkg.product.description}`);
            console.log('');
          });
          
          console.log('⚠️  IMPORTANT: Copy these Product IDs to Superwall Dashboard!');
          console.log('     Use EXACTLY these IDs in your paywall configuration:');
          offerings.current.availablePackages.forEach(pkg => {
            console.log(`     → ${pkg.product.identifier}`);
          });
        } else {
          console.log('  ❌ No offerings found! Check RevenueCat configuration.');
        }
        console.log('\n');
        
        console.log('🎯 NEXT STEPS:');
        console.log('  1. Go to https://superwall.com/dashboard');
        console.log('  2. Open your Paywall editor');
        console.log('  3. Update Products section with the IDs above');
        console.log('  4. Click "Publish" to save changes');
        console.log('  5. Test the purchase again');
      }
      
      console.log('\n');
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║              END OF DEBUG REPORT               ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log('\n');
    } catch (error) {
      console.error('❌ Error debugging Superwall config:', error);
    }
  }

  /**
   * Get list of available product IDs
   * Useful for verifying Product IDs match between Superwall and RevenueCat
   */
  async getAvailableProductIds(): Promise<string[]> {
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        return [];
      }
      
      return offerings.current.availablePackages.map(pkg => pkg.product.identifier);
    } catch (error) {
      console.error('Error getting product IDs:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new SubscriptionService();

