/**
 * MongoDB Model: Daily cost tracking
 * Aggregated data for monitoring and alerts
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICostTracking extends Document {
  date: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCostUSD: number;
  uniqueUsers: string[]; // Array de userIds únicos
  averageProcessingTimeMs: number;
  
  breakdown: {
    freeUsers: number;
    premiumUsers: number;
  };
  
  // Alertas
  costAlertSent: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const CostTrackingSchema = new Schema<ICostTracking>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    successfulRequests: {
      type: Number,
      default: 0,
    },
    failedRequests: {
      type: Number,
      default: 0,
    },
    totalCostUSD: {
      type: Number,
      default: 0,
    },
    uniqueUsers: {
      type: [String], // Array de userIds
      default: [],
    },
    averageProcessingTimeMs: {
      type: Number,
      default: 0,
    },
    breakdown: {
      freeUsers: { type: Number, default: 0 },
      premiumUsers: { type: Number, default: 0 },
    },
    costAlertSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'cost_tracking',
  }
);

// Índices
CostTrackingSchema.index({ date: -1 });

export const CostTracking = mongoose.model<ICostTracking>('CostTracking', CostTrackingSchema);

