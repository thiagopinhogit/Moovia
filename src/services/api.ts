// API service for AI image generation with multiple model support
// Use legacy API for expo-file-system v54+
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIModel, getModelById, getDefaultModel } from '../constants/aiModels';
import { STORAGE_KEYS } from '../constants/storage';
import Purchases from 'react-native-purchases';

interface GenerateImageRequest {
  imageUri: string;
  description: string;
  effectId?: string;
  modelId?: string; // Optional: specify which model to use
  useModel?: 'gemini-pro' | 'gemini-flash'; // Backend model selection
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  creditsUsed?: number;
  creditsRemaining?: number;
}

// Get the selected AI model from storage
const getSelectedModel = async (): Promise<AIModel> => {
  try {
    const savedModelId = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_AI_MODEL);
    if (savedModelId) {
      const model = getModelById(savedModelId);
      if (model) {
        return model;
      }
    }
  } catch (error) {
    console.error('❌ [API] Error loading selected model:', error);
  }
  return getDefaultModel();
};

// Save the selected AI model to storage
export const saveSelectedModel = async (modelId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_AI_MODEL, modelId);
    console.log('✅ [API] Saved selected model:', modelId);
  } catch (error) {
    console.error('❌ [API] Error saving selected model:', error);
    throw error;
  }
};

// Generate image using Gemini API
const generateWithGemini = async (
  request: GenerateImageRequest,
  model: AIModel,
  base64: string
): Promise<GenerateImageResponse> => {
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent`;
  
  console.log('🌐 [API] Calling Gemini API...');
  console.log('🔗 [API] URL:', GEMINI_API_URL);
  console.log('🔑 [API] Using API Key:', model.apiKey?.substring(0, 10) + '...');
  
  // Create prompt with effect description
  let prompt = request.description;
  if (request.effectId) {
    prompt = `${prompt}. Apply the following effect: ${request.effectId}`;
  }
  console.log('💬 [API] Final prompt:', prompt);
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('⏱️ [API] Request timeout after ' + model.timeout / 1000 + ' seconds');
    controller.abort();
  }, model.timeout);
  
  let apiResponse;
  try {
    apiResponse = await fetch(
      `${GEMINI_API_URL}?key=${model.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Edit this image: ${prompt}`,
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );
  } catch (fetchError) {
    // Clear timeout on fetch error
    clearTimeout(timeoutId);
    
    console.error('❌ [API] Fetch error:', fetchError);
    
    if (fetchError instanceof Error) {
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out. The image generation took too long. Please try again with a simpler request.',
        };
      } else if (fetchError.message.includes('Network request failed') || fetchError.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.',
        };
      }
    }
    
    // Re-throw to be caught by outer catch
    throw fetchError;
  }

  // Clear timeout after response
  clearTimeout(timeoutId);

  console.log('📡 [API] Response status:', apiResponse.status, apiResponse.statusText);

  if (!apiResponse.ok) {
    let errorMessage = `API request failed with status ${apiResponse.status}`;
    
    console.error('❌ [API] API returned error status:', apiResponse.status);
    
    try {
      const errorData = await apiResponse.json();
      console.error('❌ [API] Error response:', JSON.stringify(errorData, null, 2));
      
      // Extract error message from various API error formats
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error && typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      console.error('❌ [API] Could not parse error response as JSON');
      // If response is not JSON, try to get text
      try {
        const errorText = await apiResponse.text();
        console.error('❌ [API] Error response text:', errorText);
        if (errorText && errorText.trim() !== '') {
          errorMessage = errorText.substring(0, 200); // Limit length
        }
      } catch (textError) {
        console.error('❌ [API] Could not read error response text');
      }
    }
    
    // Add status code context with user-friendly messages
    if (apiResponse.status === 400) {
      errorMessage = `Invalid request: ${errorMessage}`;
    } else if (apiResponse.status === 401) {
      errorMessage = `Authentication failed. The API service is temporarily unavailable. Please try again later.`;
    } else if (apiResponse.status === 403) {
      errorMessage = `Access denied. The API service is temporarily unavailable. Please try again later.`;
    } else if (apiResponse.status === 404) {
      errorMessage = `API endpoint not found. The service may be temporarily unavailable. Please try again later.`;
    } else if (apiResponse.status === 429) {
      errorMessage = `Rate limit exceeded. Please try again in a few moments.`;
    } else if (apiResponse.status >= 500) {
      errorMessage = `Server error (${apiResponse.status}). The service is temporarily unavailable. Please try again later.`;
    }
    
    console.error('❌ [API] Final error message:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }

  const data = await apiResponse.json();
  console.log('📦 [API] Response data keys:', Object.keys(data));
  console.log('📦 [API] Full response:', JSON.stringify(data, null, 2));
  
  // Check for API-level errors in successful HTTP responses
  // Gemini API sometimes returns 200 but with error information in finishReason
  const candidate = data.candidates?.[0];
  if (candidate) {
    const finishReason = candidate.finishReason;
    const finishMessage = candidate.finishMessage;
    
    console.log('🔍 [API] Finish reason:', finishReason);
    if (finishMessage) {
      console.log('📝 [API] Finish message:', finishMessage);
    }
    
    // Check for error conditions in finishReason
    if (finishReason && finishReason !== 'STOP') {
      let errorMessage = 'The AI could not generate the image.';
      
      if (finishReason === 'IMAGE_OTHER' || finishReason === 'OTHER') {
        errorMessage = 'Unable to generate the image. ';
        if (finishMessage) {
          // Extract the user-friendly part of finishMessage (before the markdown link)
          const cleanMessage = finishMessage.split('[send feedback]')[0].trim();
          errorMessage += cleanMessage;
        } else {
          errorMessage += 'Please try rephrasing your request or using a different image.';
        }
      } else if (finishReason === 'SAFETY') {
        errorMessage = 'The request was blocked by safety filters. Please try a different image or description.';
      } else if (finishReason === 'RECITATION') {
        errorMessage = 'The request was blocked due to copyright concerns. Please try a different image.';
      } else if (finishReason === 'MAX_TOKENS') {
        errorMessage = 'The generation exceeded token limits. Please try a simpler request.';
      } else if (finishMessage) {
        // Use the finish message if available
        const cleanMessage = finishMessage.split('[send feedback]')[0].trim();
        errorMessage = cleanMessage;
      }
      
      console.error('❌ [API] Generation failed:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  
  // Extract generated image from response
  // Search through ALL parts for inline_data with image
  const parts = data.candidates?.[0]?.content?.parts || [];
  console.log('🔍 [API] Number of parts in response:', parts.length);
  
  let generatedImage = null;
  let mimeType = 'image/png';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    console.log(`🔍 [API] Part ${i}:`, Object.keys(part));
    
    // Check for inlineData (camelCase - Gemini API format) or inline_data (snake_case)
    const inlineData = part.inlineData || part.inline_data;
    
    if (inlineData && inlineData.data) {
      console.log(`✅ [API] Found image in part ${i}!`);
      console.log(`📊 [API] MIME type:`, inlineData.mimeType || inlineData.mime_type);
      console.log(`📊 [API] Data length:`, inlineData.data.length);
      generatedImage = inlineData.data;
      mimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
      break;
    }
    
    if (part.text) {
      console.log(`📝 [API] Part ${i} has text (${part.text.length} chars)`);
    }
  }
  
  if (generatedImage) {
    console.log('✅ [API] Generated image found! Length:', generatedImage.length);
    // Convert base64 to data URI
    const imageUrl = `data:${mimeType};base64,${generatedImage}`;
    console.log('🖼️ [API] Returning data URI, length:', imageUrl.length);
    return {
      success: true,
      imageUrl: imageUrl,
    };
  } else {
    console.error('❌ [API] No generated image in response');
    // If we reach here, the API returned success but no image and no error reason
    return {
      success: false,
      error: 'The AI service returned an unexpected response. Please try again with a different image or description.',
    };
  }
};

// Generate image using secure AWS Lambda (RECOMMENDED)
const generateWithLambda = async (
  request: GenerateImageRequest,
  model: AIModel,
  base64: string
): Promise<GenerateImageResponse> => {
  console.log('🔒 [API] Using SECURE Lambda API...');
  console.log('🔗 [API] URL:', model.apiUrl);
  
  try {
    // Get user ID - use same method as credit balance check
    const userId = await Purchases.getAppUserID();
    
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated. Please restart the app.',
      };
    }
    
    console.log('👤 [API] User ID:', userId);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('⏱️ [API] Request timeout');
      controller.abort();
    }, model.timeout);
    
    let apiResponse;
    try {
      // Determine which model to use on backend
      const backendModel = model.id === 'gemini-flash' ? 'gemini-flash' : 'gemini-pro';
      
      apiResponse = await fetch(model.apiUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId,
          imageBase64: base64,
          description: request.description,
          effectId: request.effectId,
          model: backendModel, // Send model selection to backend
        }),
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timed out. Please try again with a simpler request.',
          };
        } else if (fetchError.message.includes('Network request failed')) {
          return {
            success: false,
            error: 'Network error. Please check your internet connection.',
          };
        }
      }
      
      throw fetchError;
    }
    
    clearTimeout(timeoutId);
    
    console.log('📡 [Lambda] Response status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      let errorMessage = `Request failed with status ${apiResponse.status}`;
      
      try {
        const errorData = await apiResponse.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Ignore parse error
      }
      
      // User-friendly messages
      if (apiResponse.status === 403) {
        errorMessage = 'Subscription required. Please subscribe to use this feature.';
      } else if (apiResponse.status === 413) {
        errorMessage = 'Image is too large. Please use a smaller image.';
      } else if (apiResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
      } else if (apiResponse.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
    
    const data = await apiResponse.json();
    
    if (data.success && data.imageUrl) {
      console.log('✅ [Lambda] Image generated successfully!');
      if (data.processingTimeMs) {
        console.log('⏱️ [Lambda] Processing time:', data.processingTimeMs, 'ms');
      }
      if (data.creditsUsed !== undefined) {
        console.log('💰 [Lambda] Credits used:', data.creditsUsed);
        console.log('💳 [Lambda] Credits remaining:', data.creditsRemaining);
      }
      return {
        success: true,
        imageUrl: data.imageUrl,
        creditsUsed: data.creditsUsed,
        creditsRemaining: data.creditsRemaining,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to generate image. Please try again.',
      };
    }
  } catch (error) {
    console.error('❌ [Lambda] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred.',
    };
  }
};

// Generate image using Z-Image API (placeholder - will need actual implementation)
const generateWithZImage = async (
  request: GenerateImageRequest,
  model: AIModel,
  base64: string
): Promise<GenerateImageResponse> => {
  console.log('🌐 [API] Calling Z-Image API...');
  console.log('🔗 [API] URL:', model.apiUrl);
  
  // TODO: Implement Z-Image API integration
  // This is a placeholder implementation
  return {
    success: false,
    error: 'Z-Image integration is not yet implemented. Please select a different model.',
  };
};

// Generate image using Flux API (placeholder - will need actual implementation)
const generateWithFlux = async (
  request: GenerateImageRequest,
  model: AIModel,
  base64: string
): Promise<GenerateImageResponse> => {
  console.log('🌐 [API] Calling Flux API...');
  console.log('🔗 [API] URL:', model.apiUrl);
  
  // TODO: Implement Flux API integration
  // This is a placeholder implementation
  return {
    success: false,
    error: 'Flux integration is not yet implemented. Please select a different model.',
  };
};

export const generateImage = async (
  request: GenerateImageRequest
): Promise<GenerateImageResponse> => {
  console.log('🚀 [API] Starting image generation...');
  
  // Get selected model or use override from request
  let model: AIModel;
  if (request.modelId) {
    const requestedModel = getModelById(request.modelId);
    model = requestedModel || await getSelectedModel();
  } else {
    model = await getSelectedModel();
  }
  
  console.log('🤖 [API] Using model:', model.displayName, `(${model.id})`);
  console.log('⚡ [API] Speed:', model.speed, '| Quality:', model.quality);
  console.log('🔓 [API] Censored:', model.censored, '| Free:', model.free);
  
  console.log('📝 [API] Request:', {
    description: request.description,
    effectId: request.effectId,
    imageUri: request.imageUri.substring(0, 50) + '...',
  });

  try {
    // Validate input
    if (!request.imageUri) {
      console.error('❌ [API] No image URI provided');
      return {
        success: false,
        error: 'No image provided. Please select an image first.',
      };
    }

    if (!request.description || request.description.trim() === '') {
      console.error('❌ [API] No description provided');
      return {
        success: false,
        error: 'No description provided. Please describe what you want to generate.',
      };
    }

    // Read image as base64 using expo-file-system legacy API
    console.log('📸 [API] Reading image as base64...');
    
    let base64: string;
    
    // Check if imageUri is already a data URI (base64)
    if (request.imageUri.startsWith('data:')) {
      console.log('📸 [API] Image is already base64 (data URI), extracting...');
      // Extract base64 from data URI (format: data:image/jpeg;base64,XXXXX)
      base64 = request.imageUri.split(',')[1];
      console.log('✅ [API] Base64 extracted from data URI, length:', base64.length);
    } else {
      console.log('📸 [API] Reading image file from URI...');
      // Read from file system
      base64 = await FileSystem.readAsStringAsync(request.imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('✅ [API] Base64 conversion complete, length:', base64.length);
    }

    // Check base64 size and warn if too large
    const sizeInMB = (base64.length * 0.75) / (1024 * 1024); // Approximate size in MB
    console.log(`📊 [API] Image size: ${sizeInMB.toFixed(2)} MB`);
    
    if (sizeInMB > 5) {
      console.warn(`⚠️ [API] Image is large (${sizeInMB.toFixed(2)} MB). May exceed API Gateway limit (6 MB).`);
      return {
        success: false,
        error: 'Image is too large. Please use a smaller image (max 5 MB).',
      };
    }

    // Call the appropriate API based on the model provider
    let result: GenerateImageResponse;
    
    switch (model.provider) {
      case 'lambda':
        result = await generateWithLambda(request, model, base64);
        break;
      case 'gemini':
        result = await generateWithGemini(request, model, base64);
        break;
      case 'z-image':
        result = await generateWithZImage(request, model, base64);
        break;
      case 'flux':
        result = await generateWithFlux(request, model, base64);
        break;
      default:
        console.warn('⚠️ [API] Unknown provider, falling back to Lambda');
        result = await generateWithLambda(request, model, base64);
        break;
    }
    
    return result;
  } catch (error) {
    console.error('❌ [API] Error generating image:', error);
    console.error('❌ [API] Error type:', error?.constructor?.name);
    console.error('❌ [API] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ [API] Error stack:', error instanceof Error ? error.stack : 'N/A');
    
    let errorMessage = 'An unexpected error occurred while generating your image. Please check your internet connection and try again.';
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The image generation took too long. Please try again with a simpler request.';
      } else if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API authentication failed. Please contact support.';
      } else if (error.message && error.message.trim() !== '') {
        errorMessage = error.message;
      }
    }
    
    // Final safety check - ensure we never return an empty error message
    if (!errorMessage || errorMessage.trim() === '') {
      errorMessage = 'An unexpected error occurred. Please check your internet connection and try again.';
      console.error('❌ [API] WARNING: Empty error message detected, using default message');
    }
    
    console.error('❌ [API] Final error message being returned:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Mock function for testing without API
export const generateImageMock = async (
  request: GenerateImageRequest
): Promise<GenerateImageResponse> => {
  console.log('🧪 [MOCK API] Using mock function...');
  console.log('📝 [MOCK API] Request:', request);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('✅ [MOCK API] Mock generation complete');
  
  // Return mock success
  return {
    success: true,
    imageUrl: request.imageUri, // Return the same image for now
  };
};

