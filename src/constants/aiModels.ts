/**
 * AI Models Configuration
 * Defines available AI models for image generation
 */

import { API_ENDPOINTS } from './config';

export interface AIModel {
  id: string;
  displayName: string;
  name: string; // Internal model name (for API calls)
  provider: 'lambda' | 'gemini' | 'z-image' | 'flux';
  apiUrl?: string;
  apiKey?: string;
  timeout: number; // in milliseconds
  speed: 'fast' | 'medium' | 'slow';
  quality: 'low' | 'medium' | 'high';
  censored: boolean;
  free: boolean;
  description: string;
}

// Available AI Models
export const AI_MODELS: Record<string, AIModel> = {
  // Gemini Pro - Higher quality, more credits
  // API Cost: ~$0.01 | 80% margin → 2 credits
  'gemini-pro': {
    id: 'gemini-pro',
    displayName: 'Gemini Pro',
    name: 'gemini-3-pro-image-preview',
    provider: 'lambda',
    apiUrl: API_ENDPOINTS.generateImage,
    timeout: 60000,
    speed: 'medium',
    quality: 'high',
    censored: true,
    free: true,
    description: '🔥 2 credits per image',
  },

  // Gemini Flash - Faster, fewer credits
  // API Cost: ~$0.005 | 80% margin → 1 credit
  'gemini-flash': {
    id: 'gemini-flash',
    displayName: 'Gemini Flash',
    name: 'gemini-3-flash-image-preview',
    provider: 'lambda',
    apiUrl: API_ENDPOINTS.generateImage,
    timeout: 60000,
    speed: 'fast',
    quality: 'medium',
    censored: true,
    free: true,
    description: '⚡ 1 credit per image',
  },
};

// Helper function to get model by ID
export const getModelById = (modelId: string): AIModel | null => {
  return AI_MODELS[modelId] || null;
};

// Get default model
export const getDefaultModel = (): AIModel => {
  return AI_MODELS['gemini-pro']; // Default to Pro (higher quality)
};

// Get list of all available models
export const getAllModels = (): AIModel[] => {
  return Object.values(AI_MODELS);
};

// Type for model IDs
export type AIModelId = keyof typeof AI_MODELS;
