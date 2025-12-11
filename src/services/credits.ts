/**
 * Credit Service
 * Handles credit balance and transaction history
 */

import Purchases from 'react-native-purchases';
import { API_ENDPOINTS } from '../constants/config';

export interface CreditBalance {
  userId: string;
  credits: number;
  subscriptionTier: string | null;
  lastUpdated: string;
}

export interface CreditTransaction {
  transactionId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  metadata?: any;
}

export interface CreditStats {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  subscriptionTier: string | null;
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(): Promise<CreditBalance | null> {
  try {
    console.log('💰 [Credits] Getting credit balance...');
    
    // Get the CURRENT user ID (not the original anonymous one)
    const userId = await Purchases.getAppUserID();
    
    console.log('💰 [Credits] User ID:', userId);
    
    const url = API_ENDPOINTS.getCredits(userId);
    console.log('💰 [Credits] Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('💰 [Credits] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('💰 [Credits] Error response:', errorText);
      throw new Error(`Failed to fetch credit balance: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('💰 [Credits] Balance data:', data);
    
    if (data.success) {
      return {
        userId: data.userId,
        credits: data.credits,
        subscriptionTier: data.subscriptionTier,
        lastUpdated: data.lastUpdated,
      };
    } else {
      throw new Error(data.error || 'Failed to get credit balance');
    }
  } catch (error) {
    console.error('💰 [Credits] Error getting balance:', error);
    return null;
  }
}

/**
 * Get user's credit transaction history
 * TODO: Implement this endpoint in the Lambda
 */
export async function getCreditHistory(limit: number = 50, offset: number = 0): Promise<CreditTransaction[]> {
  try {
    console.log('💰 [Credits] Credit history not yet implemented in Lambda');
    return [];
  } catch (error) {
    console.error('💰 [Credits] Error getting history:', error);
    return [];
  }
}

/**
 * Get user's credit statistics
 * TODO: Implement this endpoint in the Lambda
 */
export async function getCreditStats(): Promise<CreditStats | null> {
  try {
    console.log('💰 [Credits] Credit stats not yet implemented in Lambda');
    return null;
  } catch (error) {
    console.error('💰 [Credits] Error getting stats:', error);
    return null;
  }
}

/**
 * Format credits number for display
 */
export function formatCredits(credits: number): string {
  return credits.toLocaleString('en-US');
}

/**
 * Format transaction type for display
 */
export function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'subscription_grant': 'Subscription Credits',
    'one_time_purchase': 'Credits Purchase',
    'image_generation': 'Image Generation',
    'admin_adjustment': 'Admin Adjustment',
    'refund': 'Refund',
  };
  
  return typeMap[type] || type;
}

/**
 * Get transaction type emoji
 */
export function getTransactionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    'subscription_grant': '📅',
    'one_time_purchase': '💳',
    'image_generation': '🎨',
    'admin_adjustment': '⚙️',
    'refund': '💸',
  };
  
  return emojiMap[type] || '📝';
}

