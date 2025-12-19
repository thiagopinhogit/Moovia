/**
 * Fal AI Video Generation Service
 * https://fal.ai/models/fal-ai/kling-video
 * Authentication: API Key (FAL_KEY)
 */

import { fal } from '@fal-ai/client';

const FAL_KEY = process.env.FAL_KEY || '';

// Configure Fal AI client
if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY,
  });
}

export interface FalVideoRequest {
  model: 'kling-v2.5-turbo-pro' | 'kling-v2.5-turbo-standard' | 'kling-v1-5-pro';
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string; // For image-to-video
  duration?: '5' | '10'; // seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  cfgScale?: number; // 0-1, default 0.5
}

export interface FalVideoResponse {
  success: boolean;
  taskId?: string;
  status?: 'submitted' | 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  processingTimeMs?: number;
  estimatedWaitTime?: number;
}

/**
 * Map model names to Fal AI endpoints
 * Returns appropriate endpoint based on model and whether it's image-to-video or text-to-video
 */
function getModelEndpoint(model: string, hasImage: boolean): string {
  // Fal AI Kling endpoints
  // https://fal.ai/models/fal-ai/kling-video
  const modelMap: Record<string, { textToVideo: string; imageToVideo: string }> = {
    'kling-v2.5-turbo-pro': {
      textToVideo: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
      imageToVideo: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
    },
    'kling-v2.5-turbo-standard': {
      textToVideo: 'fal-ai/kling-video/v2.5-turbo/standard/text-to-video',
      imageToVideo: 'fal-ai/kling-video/v2.5-turbo/standard/image-to-video',
    },
    'kling-v1-5-pro': {
      textToVideo: 'fal-ai/kling-video/v1.5/pro/text-to-video',
      imageToVideo: 'fal-ai/kling-video/v1.5/pro/image-to-video',
    },
  };
  
  const endpoints = modelMap[model] || modelMap['kling-v2.5-turbo-pro'];
  return hasImage ? endpoints.imageToVideo : endpoints.textToVideo;
}

/**
 * Generate video using Fal AI Kling
 */
export async function generateVideo(request: FalVideoRequest): Promise<FalVideoResponse> {
  const startTime = Date.now();

  try {
    if (!FAL_KEY) {
      throw new Error('FAL_KEY must be configured');
    }

    console.log('🎬 [Fal AI] Starting video generation:', {
      model: request.model,
      hasImage: !!request.imageUrl,
      duration: request.duration || '5',
      aspectRatio: request.aspectRatio || '16:9',
    });

    // Prepare request input
    const input: any = {
      prompt: request.prompt,
      duration: request.duration || '5',
    };

    // Add optional parameters
    if (request.negativePrompt) {
      input.negative_prompt = request.negativePrompt;
    }

    if (request.cfgScale !== undefined) {
      input.cfg_scale = request.cfgScale;
    }

    // Determine if it's image-to-video or text-to-video
    const hasImage = !!request.imageUrl;
    
    // Add image URL for image-to-video
    if (hasImage && request.imageUrl) {
      // Remove data URI prefix if present
      let imageUrl = request.imageUrl;
      if (imageUrl.startsWith('data:')) {
        // For data URIs, we need to upload to Fal storage first
        console.log('📤 [Fal AI] Uploading base64 image to Fal storage...');
        
        // Convert data URI to blob
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(':')[1].split(';')[0];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create a File-like object
        const file = new Blob([buffer], { type: mimeType });
        
        // Upload to Fal storage
        imageUrl = await fal.storage.upload(file as any);
        console.log('✅ [Fal AI] Image uploaded:', imageUrl.substring(0, 100) + '...');
      }
      
      input.image_url = imageUrl;
      console.log('🖼️ [Fal AI] Image-to-video mode enabled');
    } else {
      // Text-to-video mode - add aspect ratio
      input.aspect_ratio = request.aspectRatio || '16:9';
      console.log('📝 [Fal AI] Text-to-video mode enabled');
    }

    console.log('📦 [Fal AI] Request input:', {
      prompt: input.prompt.substring(0, 50) + '...',
      hasImage: !!input.image_url,
      aspect_ratio: input.aspect_ratio,
      duration: input.duration,
      negative_prompt: input.negative_prompt,
      cfg_scale: input.cfg_scale,
    });

    // Get endpoint for the model based on mode
    const endpoint = getModelEndpoint(request.model, hasImage);
    console.log('🎯 [Fal AI] Using endpoint:', endpoint);

    // Submit request to Fal AI queue
    const { request_id } = await fal.queue.submit(endpoint, {
      input,
    });

    const processingTimeMs = Date.now() - startTime;

    console.log('✅ [Fal AI] Video generation started:', {
      requestId: request_id,
      processingTimeMs,
    });

    // Success - video generation started
    return {
      success: true,
      taskId: request_id,
      status: 'pending',
      processingTimeMs,
      estimatedWaitTime: 120, // Usually 1-3 minutes
    };
  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;
    console.error('❌ [Fal AI] Error:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      processingTimeMs,
    };
  }
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(taskId: string): Promise<FalVideoResponse> {
  const startTime = Date.now();

  try {
    if (!FAL_KEY) {
      throw new Error('FAL_KEY must be configured');
    }

    console.log('🔍 [Fal AI] Checking task status:', taskId);

    // Try to determine the endpoint from the task (we'll try all possible endpoints)
    // For now, we'll try the most common ones in order
    const endpoints = [
      'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
      'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
      'fal-ai/kling-video/v2.5-turbo/standard/image-to-video',
      'fal-ai/kling-video/v2.5-turbo/standard/text-to-video',
      'fal-ai/kling-video/v1.5/pro/image-to-video',
      'fal-ai/kling-video/v1.5/pro/text-to-video',
    ];

    // Try each endpoint until we find the right one
    let status: any = null;
    let workingEndpoint: string | null = null;
    
    for (const endpoint of endpoints) {
      try {
        status = await fal.queue.status(endpoint, {
          requestId: taskId,
          logs: false,
        });
        workingEndpoint = endpoint;
        console.log(`✅ [Fal AI] Found task at endpoint: ${endpoint}`);
        break;
      } catch (error: any) {
        // Try next endpoint
        continue;
      }
    }

    if (!status || !workingEndpoint) {
      console.error('❌ [Fal AI] Task not found in any endpoint');
      return {
        success: false,
        error: 'Task not found',
        processingTimeMs: Date.now() - startTime,
      };
    }

    console.log('📊 [Fal AI] Status Response:', {
      status: status.status,
    });

    // Map Fal AI status to our standard status
    let mappedStatus: 'submitted' | 'pending' | 'processing' | 'completed' | 'failed';
    
    if (status.status === 'IN_QUEUE') {
      mappedStatus = 'pending';
    } else if (status.status === 'IN_PROGRESS') {
      mappedStatus = 'processing';
    } else if (status.status === 'COMPLETED') {
      mappedStatus = 'completed';
      
      // Get the result
      try {
        const result = await fal.queue.result(workingEndpoint, {
          requestId: taskId,
        });

        console.log('✅ [Fal AI] Video generation completed!');
        console.log('🎬 [Fal AI] Result:', result.data);

        const videoUrl = result.data?.video?.url;

        if (videoUrl) {
          console.log('🎬 [Fal AI] Video URL:', videoUrl);
        }

        const processingTimeMs = Date.now() - startTime;

        return {
          success: true,
          taskId: taskId,
          status: 'completed',
          videoUrl: videoUrl,
          processingTimeMs,
        };
      } catch (error: any) {
        console.error('❌ [Fal AI] Error getting result:', error);
        return {
          success: false,
          error: error.message || 'Failed to get result',
          processingTimeMs: Date.now() - startTime,
        };
      }
    } else {
      mappedStatus = 'failed';
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      success: mappedStatus !== 'failed',
      taskId: taskId,
      status: mappedStatus,
      processingTimeMs,
      error: mappedStatus === 'failed' ? 'Video generation failed' : undefined,
    };
  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;
    console.error('❌ [Fal AI] Status Check Error:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      processingTimeMs,
    };
  }
}

