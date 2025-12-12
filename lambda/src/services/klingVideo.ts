/**
 * Kling AI Video Generation Service
 * https://api-singapore.klingai.com
 * Authentication: JWT Token (Bearer)
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY || '';
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY || '';
const KLING_API_BASE = 'https://api-singapore.klingai.com/v1';

/**
 * Generate JWT token for Kling AI authentication
 * Token is valid for 30 minutes
 */
function generateKlingToken(): string {
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: Math.floor(Date.now() / 1000) + 1800, // Current time + 1800s (30 min)
    nbf: Math.floor(Date.now() / 1000) - 5, // Current time - 5s (starts 5s ago)
  };

  const token = jwt.sign(payload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
    },
  });

  return token;
}

export interface KlingVideoRequest {
  model: 'kling-v1-5' | 'kling-v1'; // v1-5 = 2.5 Turbo, v1 = 2.0 Standard
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string; // For image-to-video
  duration?: '5' | '10'; // seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  mode?: 'std' | 'pro';
  cfgScale?: number; // 0-1, default 0.5
}

export interface KlingVideoResponse {
  success: boolean;
  taskId?: string;
  status?: 'submitted' | 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  processingTimeMs?: number;
  estimatedWaitTime?: number;
}

/**
 * Generate video using Kling AI
 */
export async function generateVideo(request: KlingVideoRequest): Promise<KlingVideoResponse> {
  const startTime = Date.now();

  try {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      throw new Error('KLING_ACCESS_KEY and KLING_SECRET_KEY must be configured');
    }

    // Generate JWT token for authentication
    const jwtToken = generateKlingToken();

    console.log('🔑 [Kling] JWT Token generated:', {
      hasAccessKey: !!KLING_ACCESS_KEY,
      hasSecretKey: !!KLING_SECRET_KEY,
      tokenPrefix: jwtToken.substring(0, 20) + '...',
    });

    console.log('🎬 [Kling] Starting video generation:', {
      model: request.model,
      hasImage: !!request.imageUrl,
      duration: request.duration || '5',
      aspectRatio: request.aspectRatio || '16:9',
    });

    // Prepare request body - Base fields
    const requestBody: any = {
      model_name: request.model,
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio || '16:9',
      duration: request.duration || '5',
    };

    // Add optional fields only if provided
    if (request.negativePrompt) {
      requestBody.negative_prompt = request.negativePrompt;
    }
    
    if (request.cfgScale !== undefined) {
      requestBody.cfg_scale = request.cfgScale;
    }

    // Determine if it's image-to-video or text-to-video
    const isImageToVideo = !!request.imageUrl;
    let endpoint = `${KLING_API_BASE}/videos/text2video`;

    // Add image for image-to-video mode
    if (request.imageUrl) {
      endpoint = `${KLING_API_BASE}/videos/image2video`;
      
      // Remove data URI prefix if present (Kling API requires pure base64)
      let pureBase64 = request.imageUrl;
      if (pureBase64.startsWith('data:')) {
        // Extract pure base64 from data URI: data:image/jpeg;base64,XXXXX
        pureBase64 = pureBase64.split(',')[1];
        console.log('🔧 [Kling] Removed data URI prefix from base64');
      }
      
      requestBody.image = pureBase64;
      console.log('🖼️ [Kling] Image-to-video mode enabled');
      console.log('📏 [Kling] Pure base64 length:', pureBase64.length);
    }

    // Only add 'mode' parameter for kling-v1 (v2.0 Standard)
    // kling-v1-5 (v2.5 Turbo) doesn't support this parameter
    if (request.model === 'kling-v1' && request.mode) {
      requestBody.mode = request.mode;
      console.log('⚙️ [Kling] Mode parameter added:', request.mode);
    }

    console.log('📦 [Kling] Final request body keys:', Object.keys(requestBody));
    console.log('🎯 [Kling] Using endpoint:', endpoint);

    console.log('📦 [Kling] Request body:', {
      model_name: requestBody.model_name,
      prompt: requestBody.prompt.substring(0, 50) + '...',
      hasImage: !!requestBody.image,
      imageLength: requestBody.image ? requestBody.image.length : 0,
      duration: requestBody.duration,
      aspect_ratio: requestBody.aspect_ratio,
      mode: requestBody.mode, // Will be undefined for kling-v1-5
      hasMode: 'mode' in requestBody,
    });

    // Convert to JSON and log what will actually be sent
    const jsonBody = JSON.stringify(requestBody);
    const previewLength = requestBody.image ? 300 : 200;
    console.log('📤 [Kling] JSON being sent (length):', jsonBody.length);
    console.log('📤 [Kling] JSON preview:', jsonBody.substring(0, previewLength) + '...');

    // Call Kling AI API with JWT Bearer token
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonBody,
    });

    const data: any = await response.json();
    const processingTimeMs = Date.now() - startTime;

    console.log('📦 [Kling] API Response:', {
      status: response.status,
      code: data.code,
      message: data.message,
      taskId: data.data?.task_id,
      taskStatus: data.data?.task_status,
    });

    // Check for errors
    if (!response.ok || data.code !== 0) {
      const errorMessage = data.message || `HTTP ${response.status}`;
      console.error('❌ [Kling] API Error:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        processingTimeMs,
      };
    }

    // Map Kling AI status to our standard status
    // Kling uses: submitted, processing, succeed, failed
    // We use: submitted, pending, processing, completed, failed
    const klingStatus = data.data.task_status;
    let mappedStatus: 'submitted' | 'pending' | 'processing' | 'completed' | 'failed';
    
    if (klingStatus === 'succeed') {
      mappedStatus = 'completed';
    } else if (klingStatus === 'submitted') {
      mappedStatus = 'pending';
    } else {
      mappedStatus = klingStatus as any;
    }

    console.log('🔄 [Kling] Status mapping:', klingStatus, '→', mappedStatus);

    // Success - video generation started
    return {
      success: true,
      taskId: data.data.task_id,
      status: mappedStatus,
      processingTimeMs,
      estimatedWaitTime: 120, // Usually 1-3 minutes
    };
  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;
    console.error('❌ [Kling] Error:', error);
    
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
export async function checkVideoStatus(taskId: string): Promise<KlingVideoResponse> {
  const startTime = Date.now();

  try {
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      throw new Error('KLING_ACCESS_KEY and KLING_SECRET_KEY must be configured');
    }

    // Generate JWT token for authentication
    const jwtToken = generateKlingToken();

    console.log('🔍 [Kling] Checking task status:', taskId);

    // Determine endpoint based on taskId or default to image2video
    // Note: We should store the task type when creating it, but for now we'll try image2video first
    const endpoint = `${KLING_API_BASE}/videos/image2video/${taskId}`;

    // Call Kling AI status API with JWT Bearer token
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
    });

    const data: any = await response.json();
    const processingTimeMs = Date.now() - startTime;

    console.log('📊 [Kling] Status Response:', {
      status: response.status,
      code: data.code,
      taskStatus: data.data?.task_status,
      hasVideo: !!data.data?.task_result?.videos?.[0]?.url,
    });

    // Check for errors
    if (!response.ok || data.code !== 0) {
      const errorMessage = data.message || `HTTP ${response.status}`;
      console.error('❌ [Kling] Status Error:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        processingTimeMs,
      };
    }

    const taskData = data.data;
    const videoUrl = taskData.task_result?.videos?.[0]?.url;

    // Map Kling status to our status
    let status: KlingVideoResponse['status'];
    switch (taskData.task_status) {
      case 'submitted':
      case 'pending':
        status = 'pending';
        break;
      case 'processing':
        status = 'processing';
        break;
      case 'succeed':
        status = 'completed'; // Map 'succeed' to 'completed'
        console.log('✅ [Kling] Video generation completed!');
        break;
      case 'failed':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }
    
    if (videoUrl) {
      console.log('🎬 [Kling] Video URL:', videoUrl);
    }

    return {
      success: true,
      taskId: taskId,
      status: status,
      videoUrl: videoUrl,
      processingTimeMs,
      error: status === 'failed' ? 'Video generation failed' : undefined,
    };
  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;
    console.error('❌ [Kling] Status Check Error:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      processingTimeMs,
    };
  }
}

