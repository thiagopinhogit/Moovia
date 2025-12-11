/**
 * Credit Manager Service
 * Handles all credit operations securely
 * All operations are atomic and logged for audit trail
 */

import crypto from 'crypto';
import { UserCredits, IUserCredits } from '../models/UserCredits';
import { CreditTransaction, ICreditTransaction, TransactionType } from '../models/CreditTransaction';

/**
 * Credit costs by model
 */
export const CREDIT_COSTS = {
  'gemini-pro': 50,
  'gemini-flash': 20,
} as const;

/**
 * Credit grants by subscription
 */
export const SUBSCRIPTION_CREDITS = {
  'lumoproweekly': 400,
  'lumopromonthly': 800,
  'lumoproannual': 1600,
} as const;

/**
 * One-time purchase credits
 */
export const PURCHASE_CREDITS = {
  'credits_1000': 1000,
  'credits_5000': 5000,
  'credits_10000': 10000,
} as const;

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Create transaction signature for anti-tampering
 */
function createTransactionSignature(transaction: {
  userId: string;
  transactionId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
}): string {
  const data = `${transaction.userId}|${transaction.transactionId}|${transaction.type}|${transaction.amount}|${transaction.balanceBefore}|${transaction.balanceAfter}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Get or create user credits record
 */
export async function getUserCredits(userId: string): Promise<IUserCredits> {
  let userCredits = await UserCredits.findOne({ userId });
  
  if (!userCredits) {
    // Create new user with 0 credits
    userCredits = await UserCredits.create({
      userId,
      credits: 0,
      lifetimeCreditsEarned: 0,
      lifetimeCreditsSpent: 0,
      lastUpdated: new Date(),
      createdAt: new Date(),
    });
    
    console.log(`✅ Created new credit account for user ${userId}`);
  }
  
  return userCredits;
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
  const userCredits = await getUserCredits(userId);
  return userCredits.credits >= requiredCredits;
}

/**
 * Add credits to user account
 * Returns the transaction record
 * With duplicate transaction protection
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: TransactionType,
  metadata?: ICreditTransaction['metadata']
): Promise<{ success: boolean; transaction?: ICreditTransaction; error?: string; duplicate?: boolean }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }
    
    // 🔒 PROTECTION: Check for duplicate transaction using purchaseToken or revenueCatTransactionId
    if (metadata?.purchaseToken || metadata?.revenueCatTransactionId) {
      // Build conditions array, only including non-undefined values
      const conditions: any[] = [];
      if (metadata.purchaseToken) {
        conditions.push({ 'metadata.purchaseToken': metadata.purchaseToken });
      }
      if (metadata.revenueCatTransactionId) {
        conditions.push({ 'metadata.revenueCatTransactionId': metadata.revenueCatTransactionId });
      }
      
      const existingTransaction = await CreditTransaction.findOne({
        userId,
        $or: conditions,
      });
      
      if (existingTransaction) {
        console.log(`⚠️  [Credits] Duplicate transaction detected for user ${userId}:`, {
          purchaseToken: metadata.purchaseToken,
          revenueCatTransactionId: metadata.revenueCatTransactionId,
          existingTransactionId: existingTransaction.transactionId,
        });
        
        return { 
          success: true, 
          transaction: existingTransaction, 
          duplicate: true 
        };
      }
    }
    
    // Get current balance
    const userCredits = await getUserCredits(userId);
    const balanceBefore = userCredits.credits;
    const balanceAfter = balanceBefore + amount;
    
    // Create transaction
    const transactionId = generateTransactionId();
    const transactionData = {
      userId,
      transactionId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      timestamp: new Date(),
      metadata: metadata || {},
    };
    
    // Add signature
    const signature = createTransactionSignature(transactionData);
    
    // Save transaction (immutable log)
    const transaction = await CreditTransaction.create({
      ...transactionData,
      signature,
    });
    
    // Update user credits
    userCredits.credits = balanceAfter;
    userCredits.lifetimeCreditsEarned += amount;
    userCredits.lastUpdated = new Date();
    
    // Update subscription info if applicable
    if (type === 'subscription_grant' && metadata?.subscriptionTier) {
      userCredits.subscriptionTier = metadata.subscriptionTier;
    }
    
    await userCredits.save();
    
    console.log(`✅ Added ${amount} credits to user ${userId}. New balance: ${balanceAfter}`);
    
    return { success: true, transaction, duplicate: false };
  } catch (error: any) {
    console.error('❌ Error adding credits:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deduct credits from user account
 * Returns the transaction record
 * ATOMIC: Either succeeds completely or fails completely
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: TransactionType,
  metadata?: ICreditTransaction['metadata']
): Promise<{ success: boolean; transaction?: ICreditTransaction; error?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }
    
    // Get current balance
    const userCredits = await getUserCredits(userId);
    const balanceBefore = userCredits.credits;
    
    // Check if enough credits
    if (balanceBefore < amount) {
      console.log(`❌ Insufficient credits for user ${userId}. Has ${balanceBefore}, needs ${amount}`);
      return { 
        success: false, 
        error: `Insufficient credits. You have ${balanceBefore} credits, but need ${amount}.`
      };
    }
    
    const balanceAfter = balanceBefore - amount;
    
    // Create transaction (negative amount for deduction)
    const transactionId = generateTransactionId();
    const transactionData = {
      userId,
      transactionId,
      type,
      amount: -amount, // Negative for deduction
      balanceBefore,
      balanceAfter,
      timestamp: new Date(),
      metadata: metadata || {},
    };
    
    // Add signature
    const signature = createTransactionSignature(transactionData);
    
    // Save transaction (immutable log)
    const transaction = await CreditTransaction.create({
      ...transactionData,
      signature,
    });
    
    // Update user credits
    userCredits.credits = balanceAfter;
    userCredits.lifetimeCreditsSpent += amount;
    userCredits.lastUpdated = new Date();
    await userCredits.save();
    
    console.log(`✅ Deducted ${amount} credits from user ${userId}. New balance: ${balanceAfter}`);
    
    return { success: true, transaction };
  } catch (error: any) {
    console.error('❌ Error deducting credits:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Grant credits from subscription renewal
 */
export async function grantSubscriptionCredits(
  userId: string,
  subscriptionTier: keyof typeof SUBSCRIPTION_CREDITS,
  revenueCatTransactionId?: string
): Promise<{ success: boolean; transaction?: ICreditTransaction; error?: string; duplicate?: boolean }> {
  const credits = SUBSCRIPTION_CREDITS[subscriptionTier];
  
  if (!credits) {
    return { success: false, error: 'Invalid subscription tier' };
  }
  
  return addCredits(userId, credits, 'subscription_grant', {
    subscriptionTier,
    revenueCatTransactionId,
  });
}

/**
 * Grant credits from one-time purchase
 */
export async function grantPurchaseCredits(
  userId: string,
  productId: keyof typeof PURCHASE_CREDITS,
  purchaseToken?: string
): Promise<{ success: boolean; transaction?: ICreditTransaction; error?: string; duplicate?: boolean }> {
  const credits = PURCHASE_CREDITS[productId];
  
  if (!credits) {
    return { success: false, error: 'Invalid product ID' };
  }
  
  return addCredits(userId, credits, 'one_time_purchase', {
    productId,
    purchaseToken,
  });
}

/**
 * Deduct credits for image generation
 */
export async function deductImageGenerationCredits(
  userId: string,
  model: keyof typeof CREDIT_COSTS,
  requestId?: string,
  success?: boolean
): Promise<{ success: boolean; transaction?: ICreditTransaction; error?: string }> {
  const credits = CREDIT_COSTS[model];
  
  if (!credits) {
    return { success: false, error: 'Invalid model' };
  }
  
  return deductCredits(userId, credits, 'image_generation', {
    modelUsed: model,
    requestId,
    imageGenerationSuccess: success,
  });
}

/**
 * Get credit transaction history for a user
 */
export async function getCreditHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  return CreditTransaction
    .find({ userId })
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec();
}

/**
 * Get credit statistics for a user
 */
export async function getCreditStats(userId: string) {
  const userCredits = await getUserCredits(userId);
  const recentTransactions = await getCreditHistory(userId, 10);
  
  return {
    currentBalance: userCredits.credits,
    lifetimeEarned: userCredits.lifetimeCreditsEarned,
    lifetimeSpent: userCredits.lifetimeCreditsSpent,
    subscriptionTier: userCredits.subscriptionTier || null,
    recentTransactions,
  };
}

/**
 * Verify transaction signature (anti-tampering check)
 */
export function verifyTransactionSignature(transaction: ICreditTransaction): boolean {
  const expectedSignature = createTransactionSignature({
    userId: transaction.userId,
    transactionId: transaction.transactionId,
    type: transaction.type,
    amount: transaction.amount,
    balanceBefore: transaction.balanceBefore,
    balanceAfter: transaction.balanceAfter,
  });
  
  return transaction.signature === expectedSignature;
}

