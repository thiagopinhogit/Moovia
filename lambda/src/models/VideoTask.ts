/**
 * VideoTask Model
 * Stores video generation tasks for tracking and history
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoTask extends Document {
  userId: string;
  taskId: string;
  provider: 'kling' | 'runway' | 'luma' | 'pika';
  videoModel: string; // Renamed from 'model' to avoid conflict with Document.model
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  duration: number;
  aspectRatio: string;
  creditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: {
    mode?: 'text-to-video' | 'image-to-video';
    negativePrompt?: string;
    processingTimeMs?: number;
  };
}

const VideoTaskSchema = new Schema<IVideoTask>({
  userId: { type: String, required: true },
  taskId: { type: String, required: true, unique: true },
  provider: { type: String, required: true, enum: ['kling', 'runway', 'luma', 'pika'] },
  videoModel: { type: String, required: true }, // Renamed from 'model'
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  prompt: { type: String, required: true },
  imageUrl: { type: String },
  videoUrl: { type: String },
  duration: { type: Number, required: true },
  aspectRatio: { type: String, required: true },
  creditsUsed: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  errorMessage: { type: String },
  metadata: { type: Schema.Types.Mixed },
});

// Update timestamps on save
VideoTaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'completed' || this.status === 'failed') {
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

// Indexes for efficient querying
VideoTaskSchema.index({ userId: 1, createdAt: -1 });
// Note: taskId already has unique index (no need to add again)
VideoTaskSchema.index({ status: 1, createdAt: -1 });

export const VideoTask = mongoose.model<IVideoTask>('VideoTask', VideoTaskSchema);

