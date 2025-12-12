/**
 * Video AI Models Configuration
 * Defines available AI models for video generation
 */

export type VideoProvider = 'kling' | 'runway' | 'luma' | 'pika';
export type VideoModelType = 'text-to-video' | 'image-to-video';

export interface VideoModel {
  id: string;
  displayName: string;
  provider: VideoProvider;
  modelType: VideoModelType[];
  apiEndpoint: string;
  creditsPerSecond: number;
  maxDuration: number; // in seconds
  aspectRatios: string[];
  quality: 'standard' | 'high' | 'ultra';
  speed: 'fast' | 'normal' | 'slow';
  features: string[];
  description: string;
  pricing: {
    textToVideo: number; // credits per generation
    imageToVideo: number; // credits per generation
  };
}

// Available Video Models
export const VIDEO_MODELS: Record<string, VideoModel> = {
  // Kling AI 2.5 Turbo - Fast and affordable
  'kling-2.5-turbo': {
    id: 'kling-2.5-turbo',
    displayName: 'Kling 2.5 Turbo',
    provider: 'kling',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.klingai.com/v1/videos/generations',
    creditsPerSecond: 10,
    maxDuration: 5,
    aspectRatios: ['16:9', '9:16', '1:1'],
    quality: 'high',
    speed: 'fast',
    features: [
      'Fast generation',
      'High quality output',
      'Multiple aspect ratios',
      'Text or Image input'
    ],
    description: '⚡ Fast & high-quality video generation',
    pricing: {
      textToVideo: 50, // 5 seconds * 10 credits
      imageToVideo: 75, // 5 seconds * 15 credits (slightly more expensive)
    }
  },

  // Kling AI 2.0 Standard - Balanced
  'kling-2.0-standard': {
    id: 'kling-2.0-standard',
    displayName: 'Kling 2.0 Standard',
    provider: 'kling',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.klingai.com/v1/videos/generations',
    creditsPerSecond: 8,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    quality: 'standard',
    speed: 'normal',
    features: [
      'Longer videos',
      'Good quality',
      'Cost effective',
      'Multiple formats'
    ],
    description: '🎬 Balanced quality and price',
    pricing: {
      textToVideo: 80, // 10 seconds * 8 credits
      imageToVideo: 120,
    }
  },

  // Placeholder for future models
  'runway-gen3': {
    id: 'runway-gen3',
    displayName: 'Runway Gen-3 (Coming Soon)',
    provider: 'runway',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.runwayml.com/v1/generations',
    creditsPerSecond: 20,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16'],
    quality: 'ultra',
    speed: 'slow',
    features: [
      'Premium quality',
      'Cinematic output',
      'Advanced controls',
      'Professional grade'
    ],
    description: '👑 Premium quality (Coming Soon)',
    pricing: {
      textToVideo: 200,
      imageToVideo: 300,
    }
  },
};

// Helper function to get model by ID
export const getVideoModelById = (modelId: string): VideoModel | null => {
  return VIDEO_MODELS[modelId] || null;
};

// Get default video model
export const getDefaultVideoModel = (): VideoModel => {
  return VIDEO_MODELS['kling-2.5-turbo'];
};

// Get models by type
export const getModelsByType = (type: VideoModelType): VideoModel[] => {
  return Object.values(VIDEO_MODELS).filter(model => 
    model.modelType.includes(type)
  );
};

// Get models by provider
export const getModelsByProvider = (provider: VideoProvider): VideoModel[] => {
  return Object.values(VIDEO_MODELS).filter(model => 
    model.provider === provider
  );
};

// Get available models (exclude coming soon)
export const getAvailableVideoModels = (): VideoModel[] => {
  return Object.values(VIDEO_MODELS).filter(model => 
    !model.displayName.includes('Coming Soon')
  );
};

// Type for model IDs
export type VideoModelId = keyof typeof VIDEO_MODELS;

