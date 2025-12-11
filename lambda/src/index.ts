/**
 * AWS Lambda Handler - Lumo AI Image Generation
 * Handles image generation requests with subscription validation and cost tracking
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyEventV2 } from 'aws-lambda';
import { connectToDatabase } from './services/mongodb';
import { validateSubscription, incrementRequestCount } from './services/subscription';
import { generateImage } from './services/gemini';
import { updateCostTracking, isCostLimitExceeded } from './services/costTracking';
import { ApiRequest } from './models/ApiRequest';
import { CONFIG, HTTP_STATUS } from './config/constants';
import { 
  hasEnoughCredits, 
  deductImageGenerationCredits, 
  getUserCredits,
  CREDIT_COSTS,
  addCredits
} from './services/creditManager';
import { handleRevenueCatWebhook } from './handlers/revenuecatWebhook';
import { getBalance, getHistory, getStats } from './handlers/creditHandlers';

/**
 * Lambda Handler - supports both v1.0 and v2.0 API Gateway formats
 * Routes requests to the appropriate handler based on path
 */
export async function handler(event: any): Promise<APIGatewayProxyResult> {
  console.log('🚀 Lambda invoked');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    'Content-Type': 'application/json',
  };
  
  // Detect API Gateway version and extract method
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  const path = event.path || event.rawPath || event.requestContext?.http?.path || '/';
  
  console.log(`📍 Route: ${httpMethod} ${path}`);
  
  // Handle OPTIONS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: HTTP_STATUS.OK,
      headers,
      body: '',
    };
  }
  
  // Route to webhook handler
  if (path === '/revenuecat-webhook' || path.endsWith('/revenuecat-webhook')) {
    console.log('📨 Routing to RevenueCat webhook handler');
    return handleRevenueCatWebhook(event);
  }
  
  // Route to credit balance (GET /credits/{userId})
  if (httpMethod === 'GET' && (path.startsWith('/credits/') || path.match(/\/credits\/[^/]+$/))) {
    console.log('💰 Routing to credit balance handler');
    // Extract userId from path
    const userId = path.split('/').pop();
    event.queryStringParameters = { ...event.queryStringParameters, userId };
    return getBalance(event);
  }
  
  // Route to image generation handler (default)
  if (path === '/generate-image' || path.endsWith('/generate-image')) {
    console.log('🎨 Routing to image generation handler');
    return handleGenerateImage(event, headers);
  }
  
  // Unknown route
  return {
    statusCode: HTTP_STATUS.NOT_FOUND,
    headers,
    body: JSON.stringify({
      success: false,
      error: `Route not found: ${path}`,
    }),
  };
}

/**
 * Handle image generation requests
 */
async function handleGenerateImage(event: any, headers: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Only POST allowed
  if (httpMethod !== 'POST') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Only POST method is allowed',
      }),
    };
  }
  
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { userId, imageBase64, description, effectId, model } = body;
    
    // Validate required fields
    if (!userId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'userId is required', headers);
    }
    
    if (!imageBase64) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'imageBase64 is required', headers);
    }
    
    if (!description) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'description is required', headers);
    }
    
    console.log(`📝 Request from user: ${userId}`);
    
    // Determine model to use (default to gemini-pro if not specified)
    const modelToUse = (model === 'gemini-flash' || model === 'gemini-pro') ? model : 'gemini-pro';
    const creditCost = CREDIT_COSTS[modelToUse as keyof typeof CREDIT_COSTS];
    
    console.log(`🤖 Using model: ${modelToUse} (Cost: ${creditCost} credits)`);
    
    // Check if user has enough credits
    const userCredits = await getUserCredits(userId);
    console.log(`💰 User ${userId} has ${userCredits.credits} credits`);
    
    if (userCredits.credits < creditCost) {
      return errorResponse(
        HTTP_STATUS.FORBIDDEN,
        `Insufficient credits. You have ${userCredits.credits} credits, but need ${creditCost} credits to generate an image with ${modelToUse}. Please purchase more credits or choose a cheaper model.`,
        headers
      );
    }
    
    // Deduct credits BEFORE generation (prevents abuse if request is cancelled)
    console.log(`💸 Deducting ${creditCost} credits from user ${userId}`);
    const deductResult = await deductImageGenerationCredits(userId, modelToUse, undefined, undefined);
    
    if (!deductResult.success) {
      return errorResponse(
        HTTP_STATUS.INTERNAL_ERROR,
        deductResult.error || 'Failed to deduct credits',
        headers
      );
    }
    
    console.log(`✅ Credits deducted. New balance: ${userCredits.credits - creditCost}`);
    
    // Track user tier (assume premium if they have credits)
    const subscription = { tier: 'premium' as const, isActive: true, canMakeRequest: true };
    
    // Generate image with the selected model
    const result = await generateImage({
      imageBase64,
      description,
      effectId,
      model: modelToUse,
    });
    
    // Increment request counter
    await incrementRequestCount(userId);
    
    // Log request to MongoDB
    await logRequest({
      userId,
      success: result.success,
      errorMessage: result.error,
      processingTimeMs: result.processingTimeMs,
      tier: subscription.tier,
      effectId,
      description,
    });
    
    // Update cost tracking
    await updateCostTracking(
      result.success,
      CONFIG.ESTIMATED_COST_PER_REQUEST,
      userId,
      subscription.tier,
      result.processingTimeMs
    );
    
    // Return response
    if (result.success) {
      console.log(`✅ Request completed successfully for user ${userId}`);
      
      // Get updated balance
      const updatedCredits = await getUserCredits(userId);
      
      return {
        statusCode: HTTP_STATUS.OK,
        headers,
        body: JSON.stringify({
          success: true,
          imageUrl: result.imageUrl,
          processingTimeMs: result.processingTimeMs,
          creditsUsed: creditCost,
          creditsRemaining: updatedCredits.credits,
        }),
      };
    } else {
      console.log(`❌ Request failed for user ${userId}: ${result.error}`);
      
      // REFUND credits on failure (fair to the user)
      console.log(`💸 Refunding ${creditCost} credits to user ${userId} due to failure`);
      const refundResult = await addCredits(userId, creditCost, 'refund', {
        reason: 'Image generation failed',
        originalTransactionId: deductResult.transaction?.transactionId,
        modelUsed: modelToUse,
        errorMessage: result.error,
      });
      
      if (refundResult.success) {
        console.log(`✅ Refund successful. Balance restored.`);
      } else {
        console.error(`❌ Refund failed: ${refundResult.error}`);
      }
      
      return errorResponse(HTTP_STATUS.INTERNAL_ERROR, result.error || 'Image generation failed', headers);
    }
  } catch (error: any) {
    console.error('❌ Lambda error:', error);
    
    return errorResponse(
      HTTP_STATUS.INTERNAL_ERROR,
      'Internal server error',
      headers
    );
  }
}

/**
 * Helper: Create error response
 */
function errorResponse(statusCode: number, error: string, headers: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      success: false,
      error,
    }),
  };
}

/**
 * Helper: Log request to MongoDB
 */
async function logRequest(data: {
  userId: string;
  success: boolean;
  errorMessage?: string;
  processingTimeMs: number;
  tier: 'free' | 'premium';
  effectId?: string;
  description: string;
}): Promise<void> {
  try {
    await ApiRequest.create({
      userId: data.userId,
      timestamp: new Date(),
      requestType: 'image_generation',
      success: data.success,
      errorMessage: data.errorMessage,
      processingTimeMs: data.processingTimeMs,
      estimatedCostUSD: CONFIG.ESTIMATED_COST_PER_REQUEST,
      metadata: {
        effectId: data.effectId,
        description: data.description,
        modelUsed: CONFIG.GEMINI_MODEL,
      },
      subscriptionTier: data.tier,
      region: CONFIG.AWS_REGION,
    });
    
    console.log('📊 Request logged to MongoDB');
  } catch (error) {
    console.error('❌ Error logging request:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

