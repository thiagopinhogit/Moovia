/**
 * Subscription Validation Service
 * Validates user subscription status
 */

import { ApiUsage } from '../models/ApiUsage';

export interface SubscriptionInfo {
  userId: string;
  isActive: boolean;
  tier: 'free' | 'premium';
  canMakeRequest: boolean;
  message?: string;
}

/**
 * Validate user subscription and check if they can make request
 */
export async function validateSubscription(userId: string): Promise<SubscriptionInfo> {
  try {
    console.log(`🔍 Validating subscription for user: ${userId}`);
    
    // Busca ou cria registro do usuário
    let userUsage = await ApiUsage.findOne({ userId });
    
    if (!userUsage) {
      console.log('📝 Creating new user record');
      userUsage = new ApiUsage({
        userId,
        subscriptionTier: 'free',
        subscriptionActive: false,
      });
      await userUsage.save();
    }
    
    // Reset contadores se necessário
    await resetCountersIfNeeded(userUsage);
    
    // Valida se pode fazer request
    const canMakeRequest = userUsage.subscriptionActive;
    
    let message: string | undefined;
    if (!canMakeRequest) {
      message = 'Subscription required. Please subscribe to use this feature.';
    }
    
    console.log(`✅ Subscription validated:`, {
      isActive: userUsage.subscriptionActive,
      tier: userUsage.subscriptionTier,
      canMakeRequest,
    });
    
    return {
      userId,
      isActive: userUsage.subscriptionActive,
      tier: userUsage.subscriptionTier,
      canMakeRequest,
      message,
    };
  } catch (error) {
    console.error('❌ Error validating subscription:', error);
    throw error;
  }
}

/**
 * Update user subscription status (called from your app when subscription changes)
 */
export async function updateSubscriptionStatus(
  userId: string,
  isActive: boolean,
  tier: 'free' | 'premium' = 'premium'
): Promise<void> {
  try {
    console.log(`📝 Updating subscription: ${userId} -> ${tier} (${isActive ? 'active' : 'inactive'})`);
    
    await ApiUsage.findOneAndUpdate(
      { userId },
      {
        subscriptionActive: isActive,
        subscriptionTier: tier,
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Subscription updated');
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
}

/**
 * Reset daily/monthly counters if needed
 */
async function resetCountersIfNeeded(userUsage: any): Promise<void> {
  const now = new Date();
  let needsSave = false;
  
  // Reset daily counter (a cada dia)
  const lastResetDaily = new Date(userUsage.lastResetDaily);
  if (now.getDate() !== lastResetDaily.getDate() || 
      now.getMonth() !== lastResetDaily.getMonth() ||
      now.getFullYear() !== lastResetDaily.getFullYear()) {
    console.log('🔄 Resetting daily counter');
    userUsage.requestCount.daily = 0;
    userUsage.lastResetDaily = now;
    needsSave = true;
  }
  
  // Reset monthly counter (a cada mês)
  const lastResetMonthly = new Date(userUsage.lastResetMonthly);
  if (now.getMonth() !== lastResetMonthly.getMonth() ||
      now.getFullYear() !== lastResetMonthly.getFullYear()) {
    console.log('🔄 Resetting monthly counter');
    userUsage.requestCount.monthly = 0;
    userUsage.lastResetMonthly = now;
    needsSave = true;
  }
  
  if (needsSave) {
    await userUsage.save();
  }
}

/**
 * Increment request counter for user
 */
export async function incrementRequestCount(userId: string): Promise<void> {
  try {
    await ApiUsage.findOneAndUpdate(
      { userId },
      {
        $inc: {
          'requestCount.daily': 1,
          'requestCount.monthly': 1,
          'requestCount.total': 1,
        },
        $set: {
          lastRequest: new Date(),
        },
      }
    );
    
    console.log(`📊 Request count incremented for user: ${userId}`);
  } catch (error) {
    console.error('❌ Error incrementing request count:', error);
    // Não bloqueia a request se falhar o tracking
  }
}

