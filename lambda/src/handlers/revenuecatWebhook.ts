/**
 * RevenueCat Webhook Handler
 * Automatically grants credits when users subscribe or make purchases
 * 
 * Setup in RevenueCat Dashboard:
 * 1. Go to Project Settings > Integrations > Webhooks
 * 2. Add webhook URL: https://your-api-gateway-url/prod/revenuecat-webhook
 * 3. Select events: INITIAL_PURCHASE, RENEWAL, NON_RENEWING_PURCHASE
 * 4. Copy Authorization Bearer Token and set as REVENUECAT_WEBHOOK_SECRET env var
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../services/mongodb';
import { grantSubscriptionCredits, grantPurchaseCredits, SUBSCRIPTION_CREDITS, PURCHASE_CREDITS } from '../services/creditManager';
import { CONFIG, HTTP_STATUS } from '../config/constants';

/**
 * CORS headers
 */
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
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
 * Verify webhook signature (optional - for extra security)
 */
function verifyWebhookSignature(event: any): boolean {
  // Get Authorization header
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  // If no secret is configured, skip verification (not recommended for production)
  if (!process.env.REVENUECAT_WEBHOOK_SECRET) {
    console.warn('⚠️ REVENUECAT_WEBHOOK_SECRET not configured. Skipping signature verification.');
    return true;
  }
  
  // Verify Bearer token
  const expectedAuth = `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`;
  
  if (authHeader !== expectedAuth) {
    console.error('❌ Invalid webhook signature');
    return false;
  }
  
  return true;
}

/**
 * Map RevenueCat product IDs to our system
 */
function mapProductToCredits(productId: string): { type: 'subscription' | 'purchase'; key: string } | null {
  // Subscription products (recurring)
  if (productId === 'mooviaproweekly' || productId === 'moovia_pro_weekly') {
    return { type: 'subscription', key: 'mooviaproweekly' };
  }
  if (productId === 'mooviaproannual' || productId === 'moovia_pro_annual') {
    return { type: 'subscription', key: 'mooviaproannual' };
  }
  
  // One-time purchase products (non-consumable)
  if (productId === 'moovia_credits_1000') {
    return { type: 'purchase', key: 'moovia_credits_1000' };
  }
  if (productId === 'moovia_credits_5000') {
    return { type: 'purchase', key: 'moovia_credits_5000' };
  }
  if (productId === 'moovia_credits_10000') {
    return { type: 'purchase', key: 'moovia_credits_10000' };
  }
  
  console.warn(`⚠️ Unknown product ID: ${productId}`);
  return null;
}

/**
 * POST /revenuecat-webhook
 * Handle RevenueCat webhook events
 */
export async function handleRevenueCatWebhook(event: any): Promise<APIGatewayProxyResult> {
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'UNKNOWN';
  
  // Handle OPTIONS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: HTTP_STATUS.OK, headers, body: '' };
  }
  
  if (httpMethod !== 'POST') {
    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Only POST method is allowed');
  }
  
  try {
    console.log('🔔 ====== REVENUECAT WEBHOOK RECEIVED ======');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📍 Headers:', JSON.stringify(event.headers, null, 2));
    
    // Verify webhook signature
    if (!verifyWebhookSignature(event)) {
      console.error('❌ Webhook signature verification FAILED');
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, 'Invalid webhook signature');
    }
    console.log('✅ Webhook signature verified');
    
    await connectToDatabase();
    console.log('✅ Database connected');
    
    // Parse webhook payload
    const payload = JSON.parse(event.body || '{}');
    
    console.log('📨 RevenueCat webhook received');
    console.log('Event type:', payload.event?.type);
    console.log('🔍 Full event data:', JSON.stringify(payload.event, null, 2));
    
    const eventType = payload.event?.type;
    const appUserId = payload.event?.app_user_id;
    const productId = payload.event?.product_id;
    const eventId = payload.event?.id;
    
    // Extract App Store transaction IDs for duplicate detection
    // Use transaction_id (from App Store) as the unique identifier
    const storeTransactionId = payload.event?.transaction_id;
    const originalTransactionId = payload.event?.original_transaction_id;
    
    if (!appUserId) {
      console.error('❌ No app_user_id in webhook payload');
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'app_user_id is required');
    }
    
    if (!productId) {
      console.error('❌ No product_id in webhook payload');
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'product_id is required');
    }
    
    // Map product ID to credits
    const productMapping = mapProductToCredits(productId);
    
    if (!productMapping) {
      console.log(`ℹ️ Product ${productId} does not grant credits, ignoring`);
      return successResponse({ message: 'Product does not grant credits' });
    }
    
    console.log(`💳 Processing ${productMapping.type} for user ${appUserId}: ${productMapping.key}`);
    console.log('🔍 Transaction IDs:', {
      eventId,
      storeTransactionId,
      originalTransactionId,
    });
    console.log('👤 App User ID:', appUserId);
    console.log('📦 Product ID:', productId);
    console.log('🏷️  Event Type:', eventType);
    
    // Handle based on event type
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        // Subscription purchase or renewal
        if (productMapping.type === 'subscription') {
          const result = await grantSubscriptionCredits(
            appUserId,
            productMapping.key as keyof typeof SUBSCRIPTION_CREDITS,
            storeTransactionId || eventId  // Use App Store transaction ID as primary identifier
          );
          
          if (!result.success) {
            console.error('❌ Failed to grant subscription credits:', result.error);
            return errorResponse(HTTP_STATUS.INTERNAL_ERROR, result.error || 'Failed to grant credits');
          }
          
          // Check if this was a duplicate transaction
          if (result.duplicate) {
            console.log(`⚠️ Duplicate subscription detected - credits NOT added (already processed)`);
            return successResponse({
              message: 'Subscription already processed (duplicate)',
              creditsGranted: 0,
              duplicate: true,
            });
          }
          
          const creditsGranted = SUBSCRIPTION_CREDITS[productMapping.key as keyof typeof SUBSCRIPTION_CREDITS];
          console.log(`✅ Granted ${creditsGranted} credits to ${appUserId}`);
          console.log('🎉 ====== WEBHOOK SUCCESS ======');
          
          return successResponse({
            message: 'Subscription credits granted successfully',
            creditsGranted,
            duplicate: false,
            userId: appUserId,
            productId,
            transactionId: storeTransactionId || eventId,
          });
        }
        break;
      
      case 'NON_RENEWING_PURCHASE':
        // One-time purchase
        if (productMapping.type === 'purchase') {
          const result = await grantPurchaseCredits(
            appUserId,
            productMapping.key as keyof typeof PURCHASE_CREDITS,
            storeTransactionId || eventId  // Use App Store transaction ID as primary identifier
          );
          
          if (!result.success) {
            console.error('❌ Failed to grant purchase credits:', result.error);
            return errorResponse(HTTP_STATUS.INTERNAL_ERROR, result.error || 'Failed to grant credits');
          }
          
          // Check if this was a duplicate transaction
          if (result.duplicate) {
            console.log(`⚠️ Duplicate purchase detected - credits NOT added (already processed)`);
            return successResponse({
              message: 'Purchase already processed (duplicate)',
              creditsGranted: 0,
              duplicate: true,
            });
          }
          
          const creditsGranted = PURCHASE_CREDITS[productMapping.key as keyof typeof PURCHASE_CREDITS];
          console.log(`✅ Granted ${creditsGranted} credits to ${appUserId}`);
          console.log('🎉 ====== WEBHOOK SUCCESS ======');
          
          return successResponse({
            message: 'Purchase credits granted successfully',
            creditsGranted,
            duplicate: false,
            userId: appUserId,
            productId,
            transactionId: storeTransactionId || eventId,
          });
        }
        break;
      
      case 'CANCELLATION':
      case 'EXPIRATION':
        // Subscription cancelled or expired - don't revoke credits, just log
        console.log(`ℹ️ Subscription ${eventType} for user ${appUserId}`);
        return successResponse({ message: `Subscription ${eventType} processed` });
      
      case 'BILLING_ISSUE':
        console.log(`⚠️ Billing issue for user ${appUserId}`);
        return successResponse({ message: 'Billing issue noted' });
      
      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`);
        return successResponse({ message: `Event type ${eventType} acknowledged` });
    }
    
    // If we reach here, something went wrong
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Failed to process webhook');
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_ERROR, 'Webhook processing failed');
  }
}

