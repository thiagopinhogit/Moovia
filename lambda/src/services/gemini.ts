/**
 * Google Gemini API Service
 * Handles image generation requests
 */

import fetch from 'node-fetch';
import { CONFIG } from '../config/constants';

export interface GeminiRequest {
  imageBase64: string;
  description: string;
  effectId?: string;
  model?: 'gemini-pro' | 'gemini-flash'; // Model selection
}

export interface GeminiResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTimeMs: number;
}

/**
 * Generate image using Google Gemini API
 */
export async function generateImage(request: GeminiRequest): Promise<GeminiResponse> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Calling Gemini API...');
    
    // Validate API key
    if (!CONFIG.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not configured');
    }
    
    // Determine which model to use based on documentation
    const modelName = request.model === 'gemini-flash' 
      ? 'gemini-2.5-flash-image' 
      : 'gemini-3-pro-image-preview';
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    
    console.log(`🤖 Using model: ${modelName}`);
    
    // Create prompt
    let prompt = request.description;
    if (request.effectId) {
      prompt = `${prompt}. Apply the following effect: ${request.effectId}`;
    }
    
    console.log('💬 Prompt:', prompt);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, CONFIG.REQUEST_TIMEOUT_MS);
    
    let apiResponse;
    try {
      // Build request body for REST API
      const requestBody = {
            contents: [
              {
                parts: [
                  {
                    text: `Edit this image: ${prompt}`,
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: request.imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
        },
      };
      
      apiResponse = await fetch(
        `${apiUrl}?key=${CONFIG.GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal as any,
          body: JSON.stringify(requestBody),
        }
      );
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out after 2 minutes',
          processingTimeMs: Date.now() - startTime,
        };
      }
      
      throw fetchError;
    }
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', apiResponse.status);
    
    // Handle error responses
    if (!apiResponse.ok) {
      let errorMessage = `API request failed with status ${apiResponse.status}`;
      
      try {
        const errorData: any = await apiResponse.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        // Ignore JSON parse error
      }
      
      return {
        success: false,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime,
      };
    }
    
    // Parse response
    const data: any = await apiResponse.json();
    
    // Check for API-level errors
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      let errorMessage = 'The AI could not generate the image';
      
      if (candidate.finishReason === 'SAFETY') {
        errorMessage = 'Request blocked by safety filters';
      } else if (candidate.finishMessage) {
        errorMessage = candidate.finishMessage.split('[send feedback]')[0].trim();
      }
      
      return {
        success: false,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime,
      };
    }
    
    // Extract generated image
    const parts = data.candidates?.[0]?.content?.parts || [];
    let generatedImage = null;
    let mimeType = 'image/png';
    
    for (const part of parts) {
      const inlineData = part.inlineData || part.inline_data;
      if (inlineData?.data) {
        generatedImage = inlineData.data;
        mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
        break;
      }
    }
    
    if (!generatedImage) {
      return {
        success: false,
        error: 'No generated image in response',
        processingTimeMs: Date.now() - startTime,
      };
    }
    
    // Convert to data URI
    const imageUrl = `data:${mimeType};base64,${generatedImage}`;
    const processingTimeMs = Date.now() - startTime;
    
    console.log(`✅ Image generated successfully in ${processingTimeMs}ms`);
    
    return {
      success: true,
      imageUrl,
      processingTimeMs,
    };
  } catch (error: any) {
    console.error('❌ Gemini API error:', error);
    
    return {
      success: false,
      error: error.message || 'Unexpected error',
      processingTimeMs: Date.now() - startTime,
    };
  }
}

