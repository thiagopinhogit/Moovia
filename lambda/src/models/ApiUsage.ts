/**
 * MongoDB Model: API Usage tracking per user
 * Tracks request counts and subscription info
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IApiUsage extends Document {
  userId: string;
  subscriptionTier: 'free' | 'premium';
  subscriptionActive: boolean;
  requestCount: {
    daily: number;
    monthly: number;
    total: number;
  };
  lastRequest: Date;
  lastResetDaily: Date;
  lastResetMonthly: Date;
  
  // Preparado para sistema de créditos futuro
  credits?: {
    available: number;
    used: number;
    lastPurchase: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const ApiUsageSchema = new Schema<IApiUsage>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    requestCount: {
      daily: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    lastRequest: {
      type: Date,
      default: Date.now,
    },
    lastResetDaily: {
      type: Date,
      default: Date.now,
    },
    lastResetMonthly: {
      type: Date,
      default: Date.now,
    },
    
    // Sistema de créditos (futuro)
    credits: {
      available: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      lastPurchase: Date,
    },
  },
  {
    timestamps: true,
    collection: 'api_usage',
  }
);

// Índices para performance
ApiUsageSchema.index({ userId: 1, subscriptionActive: 1 });
ApiUsageSchema.index({ lastRequest: -1 });

export const ApiUsage = mongoose.model<IApiUsage>('ApiUsage', ApiUsageSchema);

