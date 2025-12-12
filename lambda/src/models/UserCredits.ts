/**
 * User Credits Model
 * Stores credit balance for each user
 * All credit operations MUST go through this model for security
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCredits extends Document {
  userId: string; // RevenueCat App User ID
  credits: number; // Current credit balance
  lifetimeCreditsEarned: number; // Total credits ever earned (for analytics)
  lifetimeCreditsSpent: number; // Total credits ever spent (for analytics)
  lastUpdated: Date;
  subscriptionTier?: string; // Current subscription (lumoproweekly, lumopromonthly, lumoproannual)
  subscriptionExpiry?: Date; // When subscription expires
  createdAt: Date;
}

const UserCreditsSchema = new Schema<IUserCredits>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  credits: {
    type: Number,
    required: true,
    default: 0,
    min: 0, // Credits cannot go negative
  },
  lifetimeCreditsEarned: {
    type: Number,
    required: true,
    default: 0,
  },
  lifetimeCreditsSpent: {
    type: Number,
    required: true,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  subscriptionTier: {
    type: String,
    enum: ['lumoproweekly', 'lumopromonthly', 'lumoproannual', null],
    default: null,
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true,
  },
});

// Indexes for performance
// Note: userId already has unique index (no need to add again)
UserCreditsSchema.index({ lastUpdated: -1 });

export const UserCredits = mongoose.model<IUserCredits>('UserCredits', UserCreditsSchema);

