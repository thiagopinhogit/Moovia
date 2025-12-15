/**
 * Video AI Models Configuration
 * Defines available AI models for video generation
 */

export type VideoProvider = 'kling' | 'runway' | 'luma' | 'pika' | 'google-veo' | 'openai-sora' | 'minimax' | 'wan' | 'seedance' | 'higgsfield';
export type VideoModelType = 'text-to-video' | 'image-to-video';

export interface VideoModel {
  id: string;
  displayName: string;
  provider: VideoProvider;
  providerDisplayName: string;
  modelType: VideoModelType[];
  apiEndpoint: string;
  creditsPerSecond: number;
  maxDuration: number; // in seconds
  aspectRatios: string[];
  resolutions: string[];
  quality: 'standard' | 'high' | 'ultra';
  speed: 'fast' | 'normal' | 'slow';
  features: string[];
  description: string;
  isPremium?: boolean;
  isComingSoon?: boolean;
  tags?: string[];
  pricing: {
    textToVideo: number; // credits per generation
    imageToVideo: number; // credits per generation
  };
}

export interface ModelProvider {
  id: VideoProvider;
  displayName: string;
  description: string;
  icon: string;
  models: VideoModel[];
}

// Available Video Models
export const VIDEO_MODELS: Record<string, VideoModel> = {
  // Kling AI 2.5 Turbo - Fast and affordable (IMPLEMENTED)
  // API Cost: $0.21 text (5s), $0.42 image (10s std) | 80% margin → 42-84 credits
  // Durations: 5s or 10s only (no resolution option)
  'kling-2.5-turbo': {
    id: 'kling-2.5-turbo',
    displayName: 'Kling 2.5 Turbo',
    provider: 'kling',
    providerDisplayName: 'Kling',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.klingai.com/v1/videos/generations',
    creditsPerSecond: 8.4, // $0.21/5s = $0.042/s → 8.4 credits/s (80% margin)
    maxDuration: 10, // Supports 5s or 10s
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: [], // No resolution option (API decides automatically)
    quality: 'high',
    speed: 'fast',
    features: [
      'Fast generation',
      'High quality output',
      'Multiple aspect ratios',
      'Text or Image input',
      'Durations: 5s or 10s'
    ],
    description: 'Fast and high-quality video generation',
    pricing: {
      textToVideo: 42,   // $0.21 API cost (5s std) → 42 credits (80% margin)
      imageToVideo: 84,  // $0.42 API cost (10s std) → 84 credits (80% margin)
    }
  },

  // Kling AI 2.0 Standard - Balanced (IMPLEMENTED)
  // API Cost: Assuming $0.35 text (5s), $0.70 image (10s pro) | 80% margin → 70-140 credits
  // Durations: 5s or 10s only | Mode: std or pro
  'kling-2.0-standard': {
    id: 'kling-2.0-standard',
    displayName: 'Kling 2.0 Standard',
    provider: 'kling',
    providerDisplayName: 'Kling',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.klingai.com/v1/videos/generations',
    creditsPerSecond: 14, // $0.35/5s = $0.07/s → 14 credits/s (80% margin)
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: [], // No resolution option
    quality: 'standard',
    speed: 'normal',
    features: [
      'Longer videos',
      'Good quality',
      'Mode: std or pro',
      'Multiple formats',
      'Durations: 5s or 10s'
    ],
    description: 'Balanced quality with mode options (std/pro)',
    pricing: {
      textToVideo: 70,    // $0.35 API cost (5s pro) → 70 credits (80% margin)
      imageToVideo: 140,  // $0.70 API cost (10s pro) → 140 credits (80% margin)
    }
  },

  // Google Veo Models
  // API Cost: $0.15/second (official docs) | 8 seconds = $1.20 | 80% margin → 240 credits
  // Resolutions: 720p and 1080p (1080p only for 16:9) | Durations: 8s only for Fast
  'veo-3.1-fast-generate-preview': {
    id: 'veo-3.1-fast-generate-preview', // Correct Google AI model ID (Fast version)
    displayName: 'Google Veo 3.1 Fast',
    provider: 'google-veo',
    providerDisplayName: 'Google Veo',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning',
    creditsPerSecond: 30, // $0.15/sec → 30 credits/sec (80% margin)
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'], // 1080p only for 16:9
    quality: 'high',
    speed: 'fast',
    features: ['Fast generation', 'Audio generation', '8 seconds', '1080p for 16:9 only'],
    description: 'Fast video generation with native audio (8s only)',
    isPremium: false,
    isComingSoon: false,
    tags: ['Preview', 'Fast', 'Audio', '8s'],
    pricing: {
      textToVideo: 240,   // $1.20 API cost (8s × $0.15) → 240 credits (80% margin)
      imageToVideo: 360,  // $1.80 API cost (50% extra) → 360 credits (80% margin)
    }
  },
  // Google Veo 3.1 (not Fast) - High quality with multiple durations
  // API Cost: $0.40/second (official) | Durations: 4s, 6s, 8s | 1080p only for 8s
  'veo-3.1-generate-preview': {
    id: 'veo-3.1-generate-preview',
    displayName: 'Google Veo 3.1',
    provider: 'google-veo',
    providerDisplayName: 'Google Veo',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning',
    creditsPerSecond: 80, // $0.40/sec → 80 credits/sec (80% margin)
    maxDuration: 8, // Supports 4s, 6s, 8s
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'], // 1080p only for 8s
    quality: 'ultra',
    speed: 'normal',
    features: ['Audio generation', 'Video extension', 'Reference images', 'Multiple durations (4s, 6s, 8s)', '1080p for 8s only', 'Higher fidelity'],
    description: 'Highest quality video with native audio generation',
    isPremium: true,
    isComingSoon: false,
    tags: ['Preview', 'Audio', '4-8s', 'Premium'],
    pricing: {
      textToVideo: 640,   // 8s × 80 credits/s = 640 credits
      imageToVideo: 960,  // 8s × 80 credits/s × 1.5 = 960 credits
    }
  },
  'google-veo-3.1-fast': {
    id: 'google-veo-3.1-fast',
    displayName: 'Google Veo 3.1 Fast',
    provider: 'google-veo',
    providerDisplayName: 'Google Veo',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.google.com/veo/v1/generate',
    creditsPerSecond: 30, // $0.15/sec → 30 credits/sec (80% margin)
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    quality: 'high',
    speed: 'fast',
    features: ['Fast generation', 'Peak time support', 'Audio generation'],
    description: 'Faster generation with slightly lower quality',
    isPremium: true,
    isComingSoon: true,
    tags: ['Peak time'],
    pricing: {
      textToVideo: 240,
      imageToVideo: 360,
    }
  },
  'google-veo-3.1': {
    id: 'google-veo-3.1',
    displayName: 'Google Veo 3.1',
    provider: 'google-veo',
    providerDisplayName: 'Google Veo',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.google.com/veo/v1/generate',
    creditsPerSecond: 35, // Assuming $0.175/sec (higher quality) → 35 credits/sec
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    quality: 'ultra',
    speed: 'normal',
    features: ['High quality', 'Cinematic output', 'Peak time support', 'Audio generation'],
    description: 'High-quality cinematic video generation',
    isPremium: true,
    isComingSoon: true,
    tags: ['Peak time'],
    pricing: {
      textToVideo: 280,   // $1.40 API cost (8s × $0.175) → 280 credits
      imageToVideo: 420,  // $2.10 API cost (50% extra) → 420 credits
    }
  },
  'google-veo-3': {
    id: 'google-veo-3',
    displayName: 'Google Veo 3',
    provider: 'google-veo',
    providerDisplayName: 'Google Veo',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.google.com/veo/v1/generate',
    creditsPerSecond: 32, // Assuming $0.16/sec → 32 credits/sec
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p'],
    quality: 'ultra',
    speed: 'normal',
    features: ['High quality', 'Cinematic output', 'Audio generation'],
    description: 'High-quality cinematic video generation',
    isPremium: false,
    isComingSoon: true, // Still coming soon
    pricing: {
      textToVideo: 256,   // $1.28 API cost (8s × $0.16) → 256 credits
      imageToVideo: 384,  // $1.92 API cost (50% extra) → 384 credits
    }
  },

  // OpenAI Sora (COMING SOON)
  // API Cost: Estimated ~$0.50 text, ~$0.75 image | 80% margin → 100-150 credits
  'openai-sora-2': {
    id: 'openai-sora-2',
    displayName: 'OpenAI Sora 2',
    provider: 'openai-sora',
    providerDisplayName: 'OpenAI Sora 2',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.openai.com/v1/sora',
    creditsPerSecond: 10,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    quality: 'ultra',
    speed: 'normal',
    features: ['Multi-shot video', 'Sound generation', 'High fidelity'],
    description: 'Multi-shot video with sound generation',
    isComingSoon: true,
    pricing: {
      textToVideo: 100,  // Estimated $0.50 API cost → 100 credits
      imageToVideo: 150, // Estimated $0.75 API cost → 150 credits
    }
  },

  // Minimax Hailuo (COMING SOON)
  // API Cost: Estimated ~$0.06 text, ~$0.09 image | 80% margin → 12-18 credits
  'minimax-hailuo': {
    id: 'minimax-hailuo',
    displayName: 'Minimax Hailuo',
    provider: 'minimax',
    providerDisplayName: 'Minimax Hailuo',
    modelType: ['text-to-video', 'image-to-video'],
    apiEndpoint: 'https://api.minimax.chat/v1/video',
    creditsPerSecond: 2,
    maxDuration: 6,
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    quality: 'high',
    speed: 'fast',
    features: ['VFX-ready', 'Fast generation', 'Affordable'],
    description: 'High-dynamic, VFX-ready, fastest and most affordable',
    isComingSoon: true,
    pricing: {
      textToVideo: 12,   // Estimated $0.06 API cost → 12 credits
      imageToVideo: 18,  // Estimated $0.09 API cost → 18 credits
    }
  },
};

// Get models grouped by provider
export const getModelsByProviderGrouped = (): ModelProvider[] => {
  const providerMap = new Map<VideoProvider, ModelProvider>();
  
  Object.values(VIDEO_MODELS).forEach(model => {
    if (!providerMap.has(model.provider)) {
      providerMap.set(model.provider, {
        id: model.provider,
        displayName: model.providerDisplayName,
        description: getProviderDescription(model.provider),
        icon: getProviderIcon(model.provider),
        models: [],
      });
    }
    providerMap.get(model.provider)!.models.push(model);
  });
  
  return Array.from(providerMap.values());
};

const getProviderDescription = (provider: VideoProvider): string => {
  const descriptions: Record<VideoProvider, string> = {
    'google-veo': 'Precision video with sound control',
    'kling': 'Perfect motion with advanced video control',
    'openai-sora': 'Multi-shot video with sound generation',
    'minimax': 'High-dynamic, VFX-ready, fastest and most affordable',
    'wan': 'Camera-controlled video with sound, more freedom',
    'seedance': 'Cinematic, multi-shot video creation',
    'higgsfield': 'Advanced camera controls and effect presets',
    'runway': 'Premium quality video generation',
    'luma': 'Creative video generation',
    'pika': 'Fast and easy video generation',
  };
  return descriptions[provider] || '';
};

const getProviderIcon = (provider: VideoProvider): string => {
  // Map of provider icons (you can use Ionicons names)
  const icons: Record<VideoProvider, string> = {
    'google-veo': 'logo-google',
    'kling': 'flash-outline',
    'openai-sora': 'aperture-outline',
    'minimax': 'speedometer-outline',
    'wan': 'videocam-outline',
    'seedance': 'film-outline',
    'higgsfield': 'sparkles-outline',
    'runway': 'rocket-outline',
    'luma': 'bulb-outline',
    'pika': 'color-wand-outline',
  };
  return icons[provider] || 'cube-outline';
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
    !model.isComingSoon
  );
};

// Get all models including coming soon
export const getAllVideoModels = (): VideoModel[] => {
  return Object.values(VIDEO_MODELS);
};

// Type for model IDs
export type VideoModelId = keyof typeof VIDEO_MODELS;

