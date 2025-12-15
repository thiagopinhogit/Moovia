/**
 * Video Generation Service
 * Handles video generation API calls for multiple providers
 */

import { VideoModel, VideoModelId, getVideoModelById } from '../constants/videoModels';
import * as Application from 'expo-application';
import { BACKEND_URL } from '../constants/config';

const KLING_API_KEY = process.env.KLING_API_KEY || 'your-kling-api-key';
const BACKEND_API_URL = BACKEND_URL;

export interface VideoGenerationRequest {
  modelId: VideoModelId;
  prompt: string;
  imageUrl?: string; // For image-to-video
  imageBase64?: string; // Alternative: base64 encoded image
  duration?: number; // in seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  negativePrompt?: string;
}

export interface VideoGenerationResponse {
  success: boolean;
  taskId?: string;
  videoUrl?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  estimatedTime?: number; // in seconds
}

/**
 * Generate video using Kling AI API
 * Reference: https://app.klingai.com/global/dev/document-api
 */
export const generateVideoKling = async (
  request: VideoGenerationRequest
): Promise<VideoGenerationResponse> => {
  try {
    const model = getVideoModelById(request.modelId);
    
    if (!model) {
      return {
        success: false,
        error: 'Invalid model ID',
      };
    }

    if (model.provider !== 'kling') {
      return {
        success: false,
        error: 'This function only supports Kling AI models',
      };
    }

    // Prepare request body according to Kling AI API spec
    const requestBody: any = {
      model_name: request.modelId === 'kling-2.5-turbo' ? 'kling-v2-5-turbo' : 'kling-v1',
      prompt: request.prompt,
      duration: Math.min(request.duration || 5, model.maxDuration),
      aspect_ratio: request.aspectRatio || '16:9',
    };

    // Add image for image-to-video mode
    if (request.imageUrl) {
      requestBody.image_url = request.imageUrl;
      requestBody.mode = 'image-to-video';
    } else {
      requestBody.mode = 'text-to-video';
    }

    // Add negative prompt if provided
    if (request.negativePrompt) {
      requestBody.negative_prompt = request.negativePrompt;
    }

    console.log('🎬 [VideoGen] Generating video with Kling AI:', {
      modelId: request.modelId,
      mode: requestBody.mode,
      duration: requestBody.duration,
    });

    // Get user ID
    const installationId = await Application.getIosIdForVendorAsync();
    const userId = installationId ? `device_${installationId}` : 'anonymous';

    // Call Kling AI API through your backend
    const response = await fetch(`${BACKEND_API_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        prompt: request.prompt,
        imageUrl: request.imageUrl,
        imageBase64: request.imageBase64,
        model: request.modelId === 'kling-2.5-turbo' ? 'kling-v2-5-turbo' : 'kling-v1',
        duration: requestBody.duration.toString(),
        aspectRatio: requestBody.aspect_ratio,
        negativePrompt: request.negativePrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [VideoGen] API Error:', errorData);
      
      return {
        success: false,
        error: errorData.error || 'Failed to generate video',
      };
    }

    const data = await response.json();
    
    console.log('✅ [VideoGen] Video generation initiated:', {
      taskId: data.task_id || data.taskId,
      status: data.status,
    });

    return {
      success: true,
      taskId: data.task_id || data.taskId,
      status: data.status || 'pending',
      estimatedTime: data.estimated_time || data.estimatedWaitTime || 120,
    };
  } catch (error) {
    console.error('❌ [VideoGen] Error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Generate video using Google Veo API
 * Reference: https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos
 */
export const generateVideoGoogleVeo = async (
  request: VideoGenerationRequest
): Promise<VideoGenerationResponse> => {
  try {
    const model = getVideoModelById(request.modelId);
    
    if (!model) {
      return {
        success: false,
        error: 'Invalid model ID',
      };
    }

    if (model.provider !== 'google-veo') {
      return {
        success: false,
        error: 'This function only supports Google Veo models',
      };
    }

    console.log('🎬 [VideoGen] Generating video with Google Veo:', {
      modelId: request.modelId,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
    });

    // Get user ID
    const installationId = await Application.getIosIdForVendorAsync();
    const userId = installationId ? `device_${installationId}` : 'anonymous';

    // Prepare request body
    const requestBody = {
      userId,
      provider: 'google-veo',
      modelId: request.modelId,
      prompt: request.prompt,
      imageUrl: request.imageUrl,
      imageBase64: request.imageBase64,
      duration: Math.min(request.duration || 5, model.maxDuration),
      aspectRatio: request.aspectRatio || '16:9',
      negativePrompt: request.negativePrompt,
    };

    // Call Google Veo API through backend
    const response = await fetch(`${BACKEND_API_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [VideoGen] Google Veo API Error:', errorData);
      
      return {
        success: false,
        error: errorData.error || 'Failed to generate video with Google Veo',
      };
    }

    const data = await response.json();
    
    console.log('✅ [VideoGen] Google Veo video generation initiated:', {
      taskId: data.task_id || data.taskId,
      status: data.status,
    });

    return {
      success: true,
      taskId: data.task_id || data.taskId,
      status: data.status || 'pending',
      estimatedTime: data.estimated_time || data.estimatedWaitTime || 180, // 3 minutes default
    };
  } catch (error) {
    console.error('❌ [VideoGen] Google Veo Error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Check video generation status
 */
export const checkVideoStatus = async (
  taskId: string,
  provider: 'kling' | 'runway' | 'luma' | 'google-veo' = 'kling'
): Promise<VideoGenerationResponse> => {
  try {
    console.log('🔍 [VideoGen] Checking status for task:', taskId);

    const response = await fetch(`${BACKEND_API_URL}/video-status/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to check status',
      };
    }

    const data = await response.json();
    
    console.log('📊 [VideoGen] Status update:', {
      taskId,
      status: data.status,
      hasVideo: !!data.videoUrl,
      videoUrl: data.videoUrl ? data.videoUrl.substring(0, 80) + '...' : null,
    });

    return {
      success: true,
      taskId: taskId,
      status: data.status,
      videoUrl: data.videoUrl, // Backend retorna camelCase
      error: data.error,
    };
  } catch (error) {
    console.error('❌ [VideoGen] Status check error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check status',
    };
  }
};

/**
 * Generate video with automatic provider selection
 */
export const generateVideo = async (
  request: VideoGenerationRequest
): Promise<VideoGenerationResponse> => {
  const model = getVideoModelById(request.modelId);
  
  if (!model) {
    return {
      success: false,
      error: 'Invalid model ID',
    };
  }

  // Route to appropriate provider
  switch (model.provider) {
    case 'kling':
      return generateVideoKling(request);
    
    case 'google-veo':
      return generateVideoGoogleVeo(request);
    
    case 'runway':
      // TODO: Implement Runway Gen-3
      return {
        success: false,
        error: 'Runway Gen-3 coming soon',
      };
    
    case 'luma':
      // TODO: Implement Luma AI
      return {
        success: false,
        error: 'Luma AI coming soon',
      };
    
    default:
      return {
        success: false,
        error: `Provider ${model.provider} not supported`,
      };
  }
};

/**
 * Poll for video completion
 */
/**
 * Poll for video completion
 */
export const pollVideoCompletion = async (
  taskId: string,
  provider: 'kling' | 'runway' | 'luma' | 'google-veo' = 'kling',
  maxAttempts: number = 60, // 60 attempts * 5 seconds = 5 minutes
  intervalMs: number = 5000, // Check every 5 seconds
  cancelRef?: { current: boolean } // Optional ref to check for cancellation
): Promise<VideoGenerationResponse> => {
  let attempts = 0;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5; // Stop after 5 consecutive errors

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      // Check if cancelled
      if (cancelRef && cancelRef.current) {
        console.log('🛑 [VideoGen] Polling cancelled by user');
        clearInterval(interval);
        resolve({
          success: false,
          error: 'Video generation cancelled by user',
        });
        return;
      }

      attempts++;

      try {
        const status = await checkVideoStatus(taskId, provider);

        // Video is ready
        if (status.status === 'completed' && status.videoUrl) {
          clearInterval(interval);
          resolve(status);
          return;
        }

        // Video failed
        if (status.status === 'failed') {
          clearInterval(interval);
          resolve(status);
          return;
        }

        // Reset consecutive errors on success
        if (status.success) {
          consecutiveErrors = 0;
        } else {
          consecutiveErrors++;
          console.warn(`❌ [VideoGen] Status check failed (${consecutiveErrors}/${maxConsecutiveErrors})`);
        }

        // Too many consecutive errors
        if (consecutiveErrors >= maxConsecutiveErrors) {
          clearInterval(interval);
          resolve({
            success: false,
            error: 'Video generation failed. The AI model may not be available.',
          });
          return;
        }

        // Max attempts reached
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve({
            success: false,
            error: 'Video generation timeout (5 minutes). Try again later.',
          });
          return;
        }

        // Still processing, continue polling
        console.log(`⏳ [VideoGen] Still processing... (${attempts}/${maxAttempts})`);
      } catch (error) {
        consecutiveErrors++;
        console.error('❌ [VideoGen] Polling error:', error);
        
        // Stop on too many errors
        if (consecutiveErrors >= maxConsecutiveErrors) {
          clearInterval(interval);
          resolve({
            success: false,
            error: 'Failed to check video status multiple times.',
          });
          return;
        }
      }
    }, intervalMs);
  });
};

