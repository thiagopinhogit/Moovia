/**
 * Lambda Handler for Credit Management
 * Separate endpoints for different credit operations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../services/mongodb';
import {
  getUserCredits,
  getCreditHistory,
  getCreditStats,
  grantSubscriptionCredits,
  grantPurchaseCredits,
  SUBSCRIPTION_CREDITS,
  PURCHASE_CREDITS,
} from '../services/creditManager';
import { HTTP_STATUS } from '../config/constants';

/**
 * CORS headers
 */
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Helper: Create error response
 */
function errorResponse(statusCode: number, error: string): APIGatewayProxyResult {
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
 * Helper: Create success response
 */
function successResponse(data: any): APIGatewayProxyResult {
  return {
    statusCode: HTTP_STATUS.OK,
    headers,
    body: JSON.stringify({
      success: true,
      ...data,
    }),
  };
}

/**
 * GET /credits/balance
 * Get user's current credit balance
 */
export async function getBalance(event: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Handle OPTIONS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: HTTP_STATUS.OK, headers, body: '' };
  }
  
  try {
    await connectToDatabase();
    
    // Get userId from query parameters
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'userId is required');
    }
    
    const userCredits = await getUserCredits(userId);
    
    return successResponse({
      userId: userCredits.userId,
      credits: userCredits.credits,
      subscriptionTier: userCredits.subscriptionTier,
      lastUpdated: userCredits.lastUpdated,
    });
  } catch (error: any) {
    console.error('❌ Error getting balance:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Failed to get credit balance');
  }
}

/**
 * GET /credits/history
 * Get user's credit transaction history
 */
export async function getHistory(event: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Handle OPTIONS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: HTTP_STATUS.OK, headers, body: '' };
  }
  
  try {
    await connectToDatabase();
    
    // Get parameters from query string
    const userId = event.queryStringParameters?.userId;
    const limit = parseInt(event.queryStringParameters?.limit || '50', 10);
    const offset = parseInt(event.queryStringParameters?.offset || '0', 10);
    
    if (!userId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'userId is required');
    }
    
    const history = await getCreditHistory(userId, limit, offset);
    
    return successResponse({
      userId,
      transactions: history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('❌ Error getting history:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Failed to get credit history');
  }
}

/**
 * GET /credits/stats
 * Get user's credit statistics
 */
export async function getStats(event: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Handle OPTIONS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: HTTP_STATUS.OK, headers, body: '' };
  }
  
  try {
    await connectToDatabase();
    
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'userId is required');
    }
    
    const stats = await getCreditStats(userId);
    
    return successResponse(stats);
  } catch (error: any) {
    console.error('❌ Error getting stats:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Failed to get credit statistics');
  }
}

/**
 * POST /credits/grant-subscription
 * Grant credits from subscription
 * This should be called by RevenueCat webhook
 */
export async function grantSubscription(event: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Handle OPTIONS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: HTTP_STATUS.OK, headers, body: '' };
  }
  
  if (httpMethod !== 'POST') {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Only POST method is allowed');
  }
  
  try {
    await connectToDatabase();
    
    const body = JSON.parse(event.body || '{}');
    const { userId, subscriptionTier, revenueCatTransactionId } = body;
    
    if (!userId || !subscriptionTier) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'userId and subscriptionTier are required');
    }
    
    // Validate subscription tier
    if (!(subscriptionTier in SUBSCRIPTION_CREDITS)) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, `Invalid subscription tier. Valid tiers: ${Object.keys(SUBSCRIPTION_CREDITS).join(', ')}`);
    }
    
    console.log(`💳 Granting subscription credits for ${userId}: ${subscriptionTier}`);
    
    const result = await grantSubscriptionCredits(
      userId,
      subscriptionTier as keyof typeof SUBSCRIPTION_CREDITS,
      revenueCatTransactionId
    );
    
    if (!result.success) {
      return errorResponse(HTTP_STATUS.INTERNAL_ERROR, result.error || 'Failed to grant credits');
    }
    
    return successResponse({
      transaction: result.transaction,
      message: `Successfully granted ${SUBSCRIPTION_CREDITS[subscriptionTier as keyof typeof SUBSCRIPTION_CREDITS]} credits`,
    });
  } catch (error: any) {
    console.error('❌ Error granting subscription credits:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Failed to grant subscription credits');
  }
}

/**
 * POST /credits/grant-purchase
 * Grant credits from one-time purchase
 */
export async function grantPurchase(event: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Handle OPTIONS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: HTTP_STATUS.OK, headers, body: '' };
  }
  
  if (httpMethod !== 'POST') {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Only POST method is allowed');
  }
  
  try {
    await connectToDatabase();
    
    const body = JSON.parse(event.body || '{}');
    const { userId, productId, purchaseToken } = body;
    
    if (!userId || !productId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'userId and productId are required');
    }
    
    // Validate product ID
    if (!(productId in PURCHASE_CREDITS)) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, `Invalid product ID. Valid products: ${Object.keys(PURCHASE_CREDITS).join(', ')}`);
    }
    
    console.log(`💰 Granting purchase credits for ${userId}: ${productId}`);
    
    const result = await grantPurchaseCredits(
      userId,
      productId as keyof typeof PURCHASE_CREDITS,
      purchaseToken
    );
    
    if (!result.success) {
      return errorResponse(HTTP_STATUS.INTERNAL_ERROR, result.error || 'Failed to grant credits');
    }
    
    return successResponse({
      transaction: result.transaction,
      message: `Successfully granted ${PURCHASE_CREDITS[productId as keyof typeof PURCHASE_CREDITS]} credits`,
    });
  } catch (error: any) {
    console.error('❌ Error granting purchase credits:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Failed to grant purchase credits');
  }
}

/**
 * GET /credits/products
 * Get available credit products (for frontend to display)
 */
export async function getProducts(event: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Handle OPTIONS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: HTTP_STATUS.OK, headers, body: '' };
  }
  
  try {
    return successResponse({
      subscriptions: Object.entries(SUBSCRIPTION_CREDITS).map(([tier, credits]) => ({
        id: tier,
        credits,
        type: 'subscription',
      })),
      purchases: Object.entries(PURCHASE_CREDITS).map(([productId, credits]) => ({
        id: productId,
        credits,
        type: 'one_time_purchase',
      })),
    });
  } catch (error: any) {
    console.error('❌ Error getting products:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Failed to get products');
  }
}

