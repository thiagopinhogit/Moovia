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
  | 'video_generation' // Credits spent on video generation
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
    subscriptionTier?: string; // mooviaproweekly, mooviaproannual
    revenueCatTransactionId?: string;
    
    // For one_time_purchase
    productId?: string; // moovia_credits_1000, moovia_credits_5000, moovia_credits_10000
    purchaseToken?: string;
    
    // For image_generation and video_generation
    modelUsed?: string; // gemini-pro, gemini-flash, kling-2.5-turbo, etc.
    requestId?: string; // Link to ApiRequest or VideoTask
    imageGenerationSuccess?: boolean;
    videoGenerationSuccess?: boolean;
    isImageToVideo?: boolean; // For video generation: whether it's image-to-video
    duration?: number; // For video generation: duration in seconds
    aspectRatio?: string; // For video generation: aspect ratio (e.g., '16:9', '9:16')
    prompt?: string; // Store a snippet of the prompt for reference
    
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
    enum: ['subscription_grant', 'one_time_purchase', 'image_generation', 'video_generation', 'admin_adjustment', 'refund'],
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
// Note: transactionId already has unique index (no need to add again)
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

