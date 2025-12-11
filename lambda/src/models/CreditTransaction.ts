/**
 * Credit Transaction Model
 * Immutable log of all credit operations
 * Used for audit trail and preventing fraud
 */

import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 
  | 'subscription_grant' // Credits from subscription renewal
  | 'one_time_purchase' // Credits from one-time purchase
  | 'image_generation' // Credits spent on image generation
  | 'admin_adjustment' // Manual adjustment by admin
  | 'refund'; // Credits refunded

export interface ICreditTransaction extends Document {
  userId: string;
  transactionId: string; // Unique transaction ID (generated)
  type: TransactionType;
  amount: number; // Positive for credits added, negative for credits spent
  balanceBefore: number; // Balance before transaction
  balanceAfter: number; // Balance after transaction
  timestamp: Date;
  
  // Metadata based on transaction type
  metadata: {
    // For subscription_grant
    subscriptionTier?: string; // lumoproweekly, lumopromonthly, lumoproannual
    revenueCatTransactionId?: string;
    
    // For one_time_purchase
    productId?: string; // credits_1000, credits_5000, credits_10000
    purchaseToken?: string;
    
    // For image_generation
    modelUsed?: string; // gemini-pro, gemini-flash
    requestId?: string; // Link to ApiRequest
    imageGenerationSuccess?: boolean;
    
    // For admin_adjustment or refund
    reason?: string;
    adminUserId?: string;
    originalTransactionId?: string; // For refunds: link to original transaction
    errorMessage?: string; // For refunds: reason for failure
  };
  
  // Security: Prevent tampering
  signature?: string; // Hash of transaction data for verification
}

const CreditTransactionSchema = new Schema<ICreditTransaction>({
  userId: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['subscription_grant', 'one_time_purchase', 'image_generation', 'admin_adjustment', 'refund'],
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false,
  },
  signature: {
    type: String,
    required: false,
  },
});

// Indexes for performance and queries
CreditTransactionSchema.index({ userId: 1, timestamp: -1 });
CreditTransactionSchema.index({ transactionId: 1 });
CreditTransactionSchema.index({ type: 1 });
CreditTransactionSchema.index({ timestamp: -1 });

// Make immutable - transactions cannot be modified after creation
CreditTransactionSchema.pre('save', function(next) {
  if (!this.isNew) {
    throw new Error('Credit transactions are immutable and cannot be modified');
  }
  next();
});

export const CreditTransaction = mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);

