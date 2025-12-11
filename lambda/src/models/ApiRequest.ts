/**
 * MongoDB Model: Individual API Request logs
 * Detailed tracking of each request for monitoring and debugging
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IApiRequest extends Document {
  userId: string;
  timestamp: Date;
  requestType: string;
  success: boolean;
  errorMessage?: string;
  processingTimeMs: number;
  imageSize?: number;
  estimatedCostUSD: number;
  
  metadata: {
    effectId?: string;
    description?: string;
    modelUsed: string;
  };
  
  subscriptionTier: 'free' | 'premium';
  
  // Geo info (opcional)
  region?: string;
  
  createdAt: Date;
}

const ApiRequestSchema = new Schema<IApiRequest>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    requestType: {
      type: String,
      required: true,
      default: 'image_generation',
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    errorMessage: String,
    processingTimeMs: {
      type: Number,
      required: true,
    },
    imageSize: Number,
    estimatedCostUSD: {
      type: Number,
      required: true,
      default: 0,
    },
    metadata: {
      effectId: String,
      description: String,
      modelUsed: {
        type: String,
        required: true,
      },
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'premium'],
      required: true,
    },
    region: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'api_requests',
  }
);

// Índices compostos para queries comuns
ApiRequestSchema.index({ userId: 1, timestamp: -1 });
ApiRequestSchema.index({ timestamp: -1, success: 1 });
ApiRequestSchema.index({ subscriptionTier: 1, timestamp: -1 });

// TTL index - automaticamente deleta logs antigos após 90 dias
ApiRequestSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 dias

export const ApiRequest = mongoose.model<IApiRequest>('ApiRequest', ApiRequestSchema);

