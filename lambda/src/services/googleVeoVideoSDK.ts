/**
 * Google Veo Video Generation Service (Using Official Google AI SDK)
 * https://ai.google.dev/gemini-api/docs/video-generation
 */

import { GoogleGenAI } from '@google/genai';

const GOOGLE_VEO_API_KEY = process.env.GOOGLE_VEO_API_KEY || '';

export interface GoogleVeoVideoRequest {
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string;
  imageBase64?: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface GoogleVeoVideoResponse {
  success: boolean;
  taskId?: string;
  operationName?: string;
  status?: 'submitted' | 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  processingTimeMs?: number;
  estimatedWaitTime?: number;
}

/**
 * Generate video using Google Veo (Official SDK)
 */
export async function generateVideo(request: GoogleVeoVideoRequest): Promise<GoogleVeoVideoResponse> {
  const startTime = Date.now();

  try {
    if (!GOOGLE_VEO_API_KEY) {
      throw new Error('GOOGLE_VEO_API_KEY must be configured');
    }

    console.log('🎬 [Google Veo] Starting video generation:', {
      modelId: request.modelId,
      hasImage: !!(request.imageUrl || request.imageBase64),
      duration: request.duration || 6,
      aspectRatio: request.aspectRatio || '16:9',
    });

    // Initialize Google AI
    const genAI = new GoogleGenAI({
      apiKey: GOOGLE_VEO_API_KEY,
    });

    // Prepare config
    const config: any = {
      aspectRatio: request.aspectRatio || '16:9',
    };

    // Add negative prompt if provided
    if (request.negativePrompt) {
      config.negativePrompt = request.negativePrompt;
    }

    // Add duration if specified (must be NUMBER not string!)
    // Google Veo Fast requires duration between 6-8 seconds
    let duration = request.duration || 6;
    if (duration < 6) {
      console.log(`⚠️ [Google Veo] Duration ${duration}s too short, adjusting to 6s (minimum for Fast model)`);
      duration = 6;
    }
    if (duration > 8) {
      console.log(`⚠️ [Google Veo] Duration ${duration}s too long, adjusting to 8s (maximum)`);
      duration = 8;
    }
    config.durationSeconds = duration;

    // Add resolution (default 720p, 1080p only for 8s and 16:9)
    if (request.duration === 8 && config.aspectRatio === '16:9') {
      config.resolution = '1080p';
    } else {
      config.resolution = '720p';
    }

    // Note: personGeneration is not supported in current API version
    // Removed to avoid "allow_all for personGeneration is currently not supported" error

    console.log('📦 [Google Veo] Config:', config);

    // Start video generation
    let operation: any;

    if (request.imageUrl || request.imageBase64) {
      // Image-to-video
      console.log('🖼️ [Google Veo] Image-to-video mode');
      
      let pureBase64 = request.imageUrl || request.imageBase64;
      
      // Remove data URI prefix if present
      if (pureBase64?.startsWith('data:')) {
        pureBase64 = pureBase64.split(',')[1];
        console.log('🔧 [Google Veo] Removed data URI prefix from base64');
      }

      console.log('🖼️ [Google Veo] Using image bytes directly (base64)');

      // Generate video with image bytes directly
      operation = await genAI.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: request.prompt,
        image: {
          imageBytes: pureBase64,
          mimeType: 'image/jpeg',
        },
        config,
      });
    } else {
      // Text-to-video
      console.log('📝 [Google Veo] Text-to-video mode');
      
      operation = await genAI.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview', // Fast model for quicker generation
        prompt: request.prompt,
        config,
      });
    }

    console.log('✅ [Google Veo] Video generation started!');
    console.log('📝 [Google Veo] Operation:', {
      name: operation.name,
      done: operation.done,
    });

    // Return operation info
    return {
      success: true,
      taskId: operation.name,
      operationName: operation.name,
      status: 'pending',
      estimatedWaitTime: 180, // 3 minutes
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Google Veo] Error:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Check video generation status using operation name
 */
export async function checkVideoStatus(operationName: string): Promise<GoogleVeoVideoResponse> {
  try {
    console.log('🔍 [Google Veo] Checking operation status:', operationName);

    if (!GOOGLE_VEO_API_KEY) {
      throw new Error('GOOGLE_VEO_API_KEY must be configured');
    }

    // Use REST API directly instead of SDK
    // The operation name format is: models/{model}/operations/{operation-id}
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}`;
    
    console.log('🌐 [Google Veo] Making REST API call to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GOOGLE_VEO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Google Veo] REST API error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const operation: any = await response.json();

    console.log('📊 [Google Veo] Operation status:', {
      name: operation.name,
      done: operation.done,
      hasResponse: !!operation.response,
      hasError: !!operation.error,
    });

    // Check if done
    if (operation.done) {
      if (operation.error) {
        // Generation failed
        const errorMsg = typeof operation.error === 'string' ? operation.error : JSON.stringify(operation.error);
        console.error('❌ [Google Veo] Generation failed:', errorMsg);
        
        return {
          success: false,
          taskId: operationName,
          status: 'failed',
          error: errorMsg || 'Video generation failed',
        };
      }

      // Log the full response to debug
      console.log('📦 [Google Veo] Full operation.response:', JSON.stringify(operation.response, null, 2));

      // Generation completed - try different possible paths for the video URL
      let videoUrl: string | undefined;
      
      // Try different possible response structures
      if (operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
        videoUrl = operation.response.generateVideoResponse.generatedSamples[0].video.uri;
        console.log('✅ [Google Veo] Found video at: response.generateVideoResponse.generatedSamples[0].video.uri');
      } else if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        videoUrl = operation.response.generatedVideos[0].video.uri;
        console.log('✅ [Google Veo] Found video at: response.generatedVideos[0].video.uri');
      } else if (operation.response?.video?.uri) {
        videoUrl = operation.response.video.uri;
        console.log('✅ [Google Veo] Found video at: response.video.uri');
      } else if (operation.response?.uri) {
        videoUrl = operation.response.uri;
        console.log('✅ [Google Veo] Found video at: response.uri');
      } else if (operation.response?.videoUri) {
        videoUrl = operation.response.videoUri;
        console.log('✅ [Google Veo] Found video at: response.videoUri');
      } else if (operation.response?.url) {
        videoUrl = operation.response.url;
        console.log('✅ [Google Veo] Found video at: response.url');
      }
      
      if (videoUrl) {
        // Add API key to the URL so it can be accessed
        const urlWithKey = videoUrl.includes('?') 
          ? `${videoUrl}&key=${GOOGLE_VEO_API_KEY}`
          : `${videoUrl}?key=${GOOGLE_VEO_API_KEY}`;
        
        console.log('✅ [Google Veo] Video generation completed!');
        console.log('🎬 [Google Veo] Video URL (with key):', urlWithKey);
        
        return {
          success: true,
          taskId: operationName,
          status: 'completed',
          videoUrl: urlWithKey,
        };
      } else {
        console.error('❌ [Google Veo] No video URL in response');
        console.error('📦 [Google Veo] Available response keys:', Object.keys(operation.response || {}));
        
        return {
          success: false,
          taskId: operationName,
          status: 'failed',
          error: 'No video URL in response',
        };
      }
    } else {
      // Still processing
      console.log('⏳ [Google Veo] Video still processing...');
      
      return {
        success: true,
        taskId: operationName,
        status: 'processing',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Google Veo] Status check error:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
