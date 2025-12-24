/**
 * Google Veo Video Generation Service
 * https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos
 */

import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';

const GOOGLE_VEO_API_KEY = process.env.GOOGLE_VEO_API_KEY || '';
const GOOGLE_VEO_PROJECT_ID = process.env.GOOGLE_VEO_PROJECT_ID || '';
const GOOGLE_VEO_LOCATION = process.env.GOOGLE_VEO_LOCATION || 'us-central1';
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

// Google Veo API endpoint
const getVeoEndpoint = () => {
  // Using the correct Vertex AI endpoint format for video generation
  // Format: https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent
  return `https://${GOOGLE_VEO_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_VEO_PROJECT_ID}/locations/${GOOGLE_VEO_LOCATION}/publishers/google/models/veo-3:generateContent`;
};

/**
 * Get Google OAuth2 access token using Service Account
 */
async function getGoogleAccessToken(): Promise<string> {
  try {
    // If API key is provided and looks like a token (starts with ya29), use it
    if (GOOGLE_VEO_API_KEY && GOOGLE_VEO_API_KEY.startsWith('ya29')) {
      console.log('🔑 [Google Veo] Using provided OAuth2 access token');
      return GOOGLE_VEO_API_KEY;
    }

    // If it's a regular API key (starts with AIza), we'll use it directly in the URL
    if (GOOGLE_VEO_API_KEY && GOOGLE_VEO_API_KEY.startsWith('AIza')) {
      console.log('🔑 [Google Veo] Using API Key (will be added to URL)');
      return GOOGLE_VEO_API_KEY; // Will be handled differently in the request
    }

    // Otherwise, use Service Account credentials
    if (!GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS or valid GOOGLE_VEO_API_KEY required');
    }

    console.log('🔑 [Google Veo] Generating access token from service account');
    const auth = new GoogleAuth({
      keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token from service account');
    }

    console.log('✅ [Google Veo] Access token generated successfully');
    return accessToken.token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Google Veo] Failed to get access token:', errorMessage);
    throw error;
  }
}

export interface GoogleVeoVideoRequest {
  modelId: string; // 'google-veo-3-fast', 'google-veo-3', etc.
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string; // For image-to-video (base64)
  imageBase64?: string; // Alternative base64
  duration?: number; // in seconds (1-8)
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface GoogleVeoVideoResponse {
  success: boolean;
  taskId?: string;
  status?: 'submitted' | 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  processingTimeMs?: number;
  estimatedWaitTime?: number;
}

/**
 * Generate video using Google Veo
 */
export async function generateVideo(request: GoogleVeoVideoRequest): Promise<GoogleVeoVideoResponse> {
  const startTime = Date.now();

  try {
    if (!GOOGLE_VEO_PROJECT_ID) {
      throw new Error('GOOGLE_VEO_PROJECT_ID must be configured');
    }

    console.log('🎬 [Google Veo] Starting video generation:', {
      modelId: request.modelId,
      hasImage: !!(request.imageUrl || request.imageBase64),
      duration: request.duration || 5,
      aspectRatio: request.aspectRatio || '16:9',
    });

    // Get access token
    const accessToken = await getGoogleAccessToken();

    // Prepare request body for Google Veo
    const requestBody: any = {
      prompt: request.prompt,
    };

    // Add negative prompt if provided
    if (request.negativePrompt) {
      requestBody.negativePrompt = request.negativePrompt;
    }

    // Add image for image-to-video mode
    if (request.imageUrl || request.imageBase64) {
      let pureBase64 = request.imageUrl || request.imageBase64;
      
      // Remove data URI prefix if present
      if (pureBase64?.startsWith('data:')) {
        pureBase64 = pureBase64.split(',')[1];
        console.log('🔧 [Google Veo] Removed data URI prefix from base64');
      }
      
      requestBody.image = {
        bytesBase64Encoded: pureBase64
      };
      
      console.log('🖼️ [Google Veo] Image-to-video mode enabled');
      console.log('📏 [Google Veo] Pure base64 length:', pureBase64?.length);
    }

    // Add aspect ratio (default: 16:9)
    // Google Veo only supports "16:9" and "9:16" (1:1 not supported)
    requestBody.aspectRatio = request.aspectRatio || '16:9';

    // Add resolution (default: 720p)
    // For 1080p: only with 8s duration and 16:9 aspect ratio
    const use1080p = request.duration === 8 && requestBody.aspectRatio === '16:9';
    requestBody.resolution = use1080p ? '1080p' : '720p';

    // Add duration (must be string: "4", "6", "8")
    // Veo 3.1/3: 4, 6, 8 seconds
    const durationSeconds = Math.max(4, Math.min(request.duration || 6, 8));
    requestBody.durationSeconds = durationSeconds.toString();

    // Add person generation control
    // For text-to-video: "allow_all"
    // For image-to-video: "allow_adult"
    if (requestBody.image) {
      requestBody.personGeneration = 'allow_adult';
    } else {
      requestBody.personGeneration = 'allow_all';
    }

    console.log('📦 [Google Veo] Request body:', {
      prompt: request.prompt.substring(0, 50) + '...',
      hasImage: !!requestBody.image,
      aspectRatio: requestBody.aspectRatio,
      resolution: requestBody.resolution,
      durationSeconds: requestBody.durationSeconds,
      personGeneration: requestBody.personGeneration,
      hasNegativePrompt: !!requestBody.negativePrompt,
    });

    const endpoint = getVeoEndpoint();
    console.log('🎯 [Google Veo] Using endpoint:', endpoint);
    console.log('🔑 [Google Veo] Auth:', {
      hasAccessToken: !!accessToken,
      tokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : 'MISSING',
      tokenType: accessToken?.startsWith('ya29') ? 'OAuth2' : 'API Key',
      projectId: GOOGLE_VEO_PROJECT_ID,
      location: GOOGLE_VEO_LOCATION,
    });

    // Prepare headers and URL based on auth type
    let finalEndpoint = endpoint;
    const headers: any = {
      'Content-Type': 'application/json',
    };

    // If using API Key (starts with AIza), add it to the URL
    if (accessToken.startsWith('AIza')) {
      finalEndpoint = `${endpoint}?key=${accessToken}`;
      console.log('🔑 [Google Veo] Using API Key authentication');
    } else {
      // OAuth2 token
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('🔑 [Google Veo] Using OAuth2 Bearer token authentication');
    }

    // Call Google Veo API
    const response = await fetch(finalEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log('📡 [Google Veo] Response status:', response.status);
    console.log('📡 [Google Veo] Response headers:', Object.fromEntries(response.headers.entries()));

    // Get response text first to handle both JSON and HTML errors
    const responseText = await response.text();
    console.log('📄 [Google Veo] Response preview:', responseText.substring(0, 500));

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If response is not JSON (probably HTML error page)
      console.error('❌ [Google Veo] Non-JSON response received:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        preview: responseText.substring(0, 200),
      });
      
      let errorMessage = `Google Veo API failed (HTTP ${response.status})`;
      
      if (response.status === 404) {
        errorMessage = `Google Veo model not found (404). This could mean:
  1. Google Veo is not available in your region (${GOOGLE_VEO_LOCATION})
  2. You need to request preview access to Google Veo
  3. The model name or endpoint is incorrect
  4. Vertex AI API is not enabled in project ${GOOGLE_VEO_PROJECT_ID}
  
To request access: https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview`;
      } else if (response.status === 403) {
        errorMessage = `Permission denied (403). Check:
  1. Vertex AI API is enabled
  2. API Key has correct permissions
  3. Project ID is correct: ${GOOGLE_VEO_PROJECT_ID}`;
      } else if (response.status === 401) {
        errorMessage = `Authentication failed (401). Check your GOOGLE_VEO_API_KEY`;
      }
      
      return {
        success: false,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime,
      };
    }

    const processingTimeMs = Date.now() - startTime;

    console.log('📦 [Google Veo] API Response:', {
      status: response.status,
      hasData: !!data,
      hasError: !!data.error,
    });

    // Check for errors
    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `HTTP ${response.status}`;
      console.error('❌ [Google Veo] API Error:', errorMessage);
      console.error('❌ [Google Veo] Full error:', JSON.stringify(data, null, 2));
      
      return {
        success: false,
        error: errorMessage,
        processingTimeMs,
      };
    }

    // Google Veo returns a generation ID/operation name
    // For now, we'll use a simplified approach
    const taskId = data.name || `veo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('🔄 [Google Veo] Video generation initiated');
    console.log('📝 [Google Veo] Task ID:', taskId);

    // Success - video generation started
    return {
      success: true,
      taskId,
      status: 'pending',
      estimatedWaitTime: 180, // 3 minutes default for Google Veo
      processingTimeMs,
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
 * Check video generation status
 */
export async function checkVideoStatus(taskId: string): Promise<GoogleVeoVideoResponse> {
  try {
    console.log('🔍 [Google Veo] Checking task status:', taskId);

    // Get access token
    const accessToken = await getGoogleAccessToken();

    // Google Veo uses operations API for status checking
    let endpoint = `https://${GOOGLE_VEO_LOCATION}-aiplatform.googleapis.com/v1/${taskId}`;
    
    // Prepare headers based on auth type
    const headers: any = {
      'Content-Type': 'application/json',
    };

    // If using API Key (starts with AIza), add it to the URL
    if (accessToken.startsWith('AIza')) {
      endpoint = `${endpoint}?key=${accessToken}`;
    } else {
      // OAuth2 token
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    const data: any = await response.json();

    console.log('📊 [Google Veo] Status Response:', {
      status: response.status,
      done: data.done,
      hasError: !!data.error,
      hasResponse: !!data.response,
    });

    // Check for errors
    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `HTTP ${response.status}`;
      console.error('❌ [Google Veo] Status check error:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Check if video generation is complete
    if (data.done === true) {
      // Extract video URL from response
      const videoUrl = data.response?.candidates?.[0]?.content?.parts?.[0]?.videoMetadata?.videoUri;
      
      if (videoUrl) {
        console.log('✅ [Google Veo] Video generation completed!');
        console.log('🎬 [Google Veo] Video URL:', videoUrl.substring(0, 100) + '...');
        
        return {
          success: true,
          taskId,
          status: 'completed',
          videoUrl,
        };
      } else {
        // Generation failed
        console.error('❌ [Google Veo] Video generation failed - no video URL');
        
        return {
          success: false,
          taskId,
          status: 'failed',
          error: 'Video generation failed',
        };
      }
    } else {
      // Still processing
      console.log('⏳ [Google Veo] Video still processing...');
      
      return {
        success: true,
        taskId,
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
