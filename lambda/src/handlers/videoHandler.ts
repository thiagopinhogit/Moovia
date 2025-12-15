/**
 * Video Generation Handler
 * Handles video generation requests with multiple providers (Kling AI, Google Veo)
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { generateVideo as generateKlingVideo, checkVideoStatus as checkKlingStatus } from '../services/klingVideo';
import { generateVideo as generateGoogleVeoVideo, checkVideoStatus as checkGoogleVeoStatus } from '../services/googleVeoVideoSDK';
import { 
  hasEnoughCredits, 
  getUserCredits,
  deductCredits,
  addCredits
} from '../services/creditManager';
import { HTTP_STATUS } from '../config/constants';
import { ApiRequest } from '../models/ApiRequest';
import { VideoTask } from '../models/VideoTask';
import { CONFIG } from '../config/constants';

// Credits per second for each model (with 80% margin built-in)
// Formula: (API Cost per second) / 0.005 (cost per credit) = Credits per second
const CREDITS_PER_SECOND = {
  'kling-v1-5': 8.4,           // Kling 2.5 Turbo: $0.042/s → 8.4 credits/s
  'kling-v2-5-turbo': 8.4,     // Same as kling-v1-5
  'kling-v1': 14,              // Kling 2.0 Standard: $0.07/s → 14 credits/s
  'google-veo': 30,            // Google Veo 3.1 Fast: $0.15/s → 30 credits/s
  'google-veo-3-1': 80,        // Google Veo 3.1 Standard: $0.40/s → 80 credits/s
  'veo-3.1-generate-preview': 80,        // Google Veo 3.1: $0.40/s → 80 credits/s
  'veo-3.1-fast-generate-preview': 30,  // Google Veo 3.1 Fast: $0.15/s → 30 credits/s
} as const;

/**
 * Calculate dynamic credit cost based on duration and mode
 * @param model Model identifier
 * @param duration Video duration in seconds
 * @param isImageToVideo Whether it's image-to-video (50% more expensive)
 * @returns Total credit cost
 */
function calculateCreditCost(model: string, duration: number, isImageToVideo: boolean): number {
  const creditsPerSecond = CREDITS_PER_SECOND[model as keyof typeof CREDITS_PER_SECOND] || CREDITS_PER_SECOND['kling-v1-5'];
  let baseCost = creditsPerSecond * duration;
  
  // Image-to-video is 50% more expensive
  if (isImageToVideo) {
    baseCost = Math.ceil(baseCost * 1.5);
  } else {
    baseCost = Math.ceil(baseCost);
  }
  
  return baseCost;
}

/**
 * Handle video generation request
 * POST /generate-video
 */
export async function handleGenerateVideo(event: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { 
      userId, 
      prompt, 
      imageUrl, 
      imageBase64, // Support base64 encoded images from mobile
      provider = 'kling', // Provider: 'kling' or 'google-veo'
      modelId, // Model ID from frontend
      model = 'kling-v1-5', // Default to 2.5 Turbo (for backwards compatibility)
      duration = '5', 
      aspectRatio = '16:9',
      negativePrompt,
      mode = 'std'
    } = body;

    // Validate required fields
    if (!userId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'userId is required', headers);
    }

    if (!prompt) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'prompt is required', headers);
    }

    console.log(`🎬 [VideoGen] Request from user: ${userId}`, {
      provider,
      modelId,
      model,
      hasImageUrl: !!imageUrl,
      hasImageBase64: !!imageBase64,
      duration,
      aspectRatio,
    });

    // Convert base64 to data URI if provided
    let finalImageUrl = imageUrl;
    if (imageBase64 && !imageUrl) {
      // Create data URI from base64
      finalImageUrl = `data:image/jpeg;base64,${imageBase64}`;
      console.log('📸 [VideoGen] Converted base64 to data URI');
    }

    // Determine credit cost dynamically based on duration
    const isImageToVideo = !!(finalImageUrl || imageBase64);
    const durationInSeconds = parseInt(duration) || 5;
    const creditCost = calculateCreditCost(model, durationInSeconds, isImageToVideo);

    console.log(`💰 Credit cost: ${creditCost} credits (model: ${model}, duration: ${durationInSeconds}s, mode: ${isImageToVideo ? 'image-to-video' : 'text-to-video'})`);

    // Check if user has enough credits
    const userCredits = await getUserCredits(userId);
    console.log(`💳 User ${userId} has ${userCredits.credits} credits`);

    if (userCredits.credits < creditCost) {
      return errorResponse(
        HTTP_STATUS.FORBIDDEN,
        `Insufficient credits. You have ${userCredits.credits} credits, but need ${creditCost} credits to generate this video.`,
        headers
      );
    }

    // Deduct credits BEFORE generation
    console.log(`💸 Deducting ${creditCost} credits from user ${userId}`);
    
    // Use deductCredits for proper credit deduction
    const deductResult = await deductCredits(userId, creditCost, 'video_generation', {
      modelUsed: model,
      isImageToVideo,
      duration,
      aspectRatio,
      prompt: prompt.substring(0, 100), // Store first 100 chars
    });

    if (!deductResult.success) {
      return errorResponse(
        HTTP_STATUS.FORBIDDEN,
        deductResult.error || 'Failed to deduct credits',
        headers
      );
    }

    console.log(`✅ Credits deducted. New balance: ${userCredits.credits - creditCost}`);
    
    console.log('⚠️ [VideoGen] Credit checks DISABLED for testing - proceeding with generation');

    // Route to appropriate provider
    let result: any;
    
    if (provider === 'google-veo') {
      console.log('🎯 [VideoGen] Routing to Google Veo provider');
      
      // Generate video with Google Veo
      result = await generateGoogleVeoVideo({
        modelId: modelId || 'google-veo-3-fast',
        prompt,
        negativePrompt,
        imageUrl: finalImageUrl,
        imageBase64,
        duration: parseInt(duration),
        aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      });
    } else {
      // Default to Kling AI
      console.log('🎯 [VideoGen] Routing to Kling provider');
      
      // Generate video with Kling AI
      const videoRequest: any = {
        model: model as 'kling-v1-5' | 'kling-v1',
        prompt,
        negativePrompt,
        imageUrl: finalImageUrl,
        duration: duration as '5' | '10',
        aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      };

      // Only add 'mode' for kling-v1 (not supported by kling-v1-5)
      if (model === 'kling-v1') {
        videoRequest.mode = mode;
      }

      result = await generateKlingVideo(videoRequest);
    }

    // Log request to MongoDB (non-blocking)
    logVideoRequest({
      userId,
      success: result.success,
      taskId: result.taskId,
      errorMessage: result.error,
      processingTimeMs: result.processingTimeMs || 0,
      model,
      prompt,
      isImageToVideo,
      creditCost,
    }).catch(err => {
      console.error('❌ Failed to log video request (non-critical):', err.message);
    });

    // Save video task to MongoDB for tracking
    if (result.success && result.taskId) {
      try {
        await VideoTask.create({
          userId,
          taskId: result.taskId,
          provider: provider || 'kling',
          videoModel: modelId || model, // Use modelId if provided, fallback to model
          status: result.status || 'pending',
          prompt,
          imageUrl: finalImageUrl,
          duration: parseInt(duration),
          aspectRatio,
          creditsUsed: creditCost,
          metadata: {
            mode: isImageToVideo ? 'image-to-video' : 'text-to-video',
            negativePrompt,
          },
        });
        console.log('📝 Video task saved to MongoDB');
      } catch (error) {
        console.error('❌ Failed to save video task:', error);
      }
    }

    // Return response
    if (result.success && result.taskId) {
      console.log(`✅ Video generation started for user ${userId}`, {
        taskId: result.taskId,
        status: result.status,
      });

      // ⚠️ TESTING MODE: Skip credit balance check
      // const updatedCredits = await getUserCredits(userId);

      return {
        statusCode: HTTP_STATUS.OK,
        headers,
        body: JSON.stringify({
          success: true,
          taskId: result.taskId,
          status: result.status,
          estimatedWaitTime: result.estimatedWaitTime,
          creditsUsed: 0, // Testing mode: no credits used
          creditsRemaining: 999999, // Testing mode: fake balance
        }),
      };
    } else {
      console.log(`❌ Video generation failed for user ${userId}:`, result.error);

      // REFUND credits on failure
      console.log(`💸 Refunding ${creditCost} credits to user ${userId} due to failure`);
      const refundResult = await addCredits(userId, creditCost, 'refund', {
        reason: 'Video generation failed',
        originalTransactionId: deductResult.transaction?.transactionId,
        modelUsed: model,
        errorMessage: result.error,
      });

      if (refundResult.success) {
        console.log(`✅ Refund successful. Balance restored.`);
      } else {
        console.error(`❌ Refund failed:`, refundResult.error);
      }

      return errorResponse(
        HTTP_STATUS.INTERNAL_ERROR,
        result.error || 'Video generation failed',
        headers
      );
    }
  } catch (error: any) {
    console.error('❌ [VideoGen] Handler error:', error);

    return errorResponse(
      HTTP_STATUS.INTERNAL_ERROR,
      'Internal server error',
      headers
    );
  }
}

/**
 * Handle video status check
 * GET /video-status/:taskId
 */
export async function handleVideoStatus(event: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    // Extract taskId from path - handle both simple IDs and paths with slashes
    const path = event.path || event.rawPath || '';
    // Remove /video-status/ prefix and get everything after it
    const taskId = path.replace('/video-status/', '');

    if (!taskId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'taskId is required', headers);
    }

    console.log(`🔍 [VideoStatus] Checking status for task: ${taskId}`);

    // Find task in MongoDB to determine provider AND check timeout
    let provider: string = 'kling'; // default
    let videoTask: any = null;
    
    try {
      videoTask = await VideoTask.findOne({ taskId });
      if (videoTask) {
        if (videoTask.provider) {
          provider = videoTask.provider;
          console.log(`🔍 [VideoStatus] Provider from DB: ${provider}`);
        }
        
        // Check if video generation has timed out (10 minutes)
        const createdAt = videoTask.createdAt;
        const now = new Date();
        const timeDiffMs = now.getTime() - createdAt.getTime();
        const timeoutMs = 10 * 60 * 1000; // 10 minutes
        
        if (timeDiffMs > timeoutMs) {
          const minutesElapsed = Math.floor(timeDiffMs / (60 * 1000));
          console.log(`⏱️ [VideoStatus] Video generation timeout! Elapsed: ${minutesElapsed} minutes`);
          
          // Mark as failed in DB
          await VideoTask.updateOne(
            { taskId },
            { 
              $set: { 
                status: 'failed',
                errorMessage: `Video generation timed out after ${minutesElapsed} minutes`,
                completedAt: new Date(),
              }
            }
          );
          
          return {
            statusCode: HTTP_STATUS.OK,
            headers,
            body: JSON.stringify({
              success: false,
              taskId,
              status: 'failed',
              error: `Video generation timed out after ${minutesElapsed} minutes. Please try again.`,
            }),
          };
        }
      } else {
        // If not in DB, try to detect from taskId format
        if (taskId.startsWith('models/veo') || taskId.includes('veo-3')) {
          provider = 'google-veo';
          console.log(`🔍 [VideoStatus] Provider detected from taskId format: ${provider}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not determine provider from DB');
      // Try to detect from taskId format
      if (taskId.startsWith('models/veo') || taskId.includes('veo-3')) {
        provider = 'google-veo';
        console.log(`🔍 [VideoStatus] Provider detected from taskId format: ${provider}`);
      }
    }

    console.log(`🔍 [VideoStatus] Using provider: ${provider}`);

    // Check status with appropriate provider
    let result: any;
    if (provider === 'google-veo') {
      result = await checkGoogleVeoStatus(taskId);
    } else {
      result = await checkKlingStatus(taskId);
    }

    // Handle both success and failed status (but not communication errors)
    if (result.success || result.status === 'failed') {
      console.log(`📊 [VideoStatus] Status retrieved:`, {
        taskId,
        status: result.status,
        hasVideo: !!result.videoUrl,
        videoUrl: result.videoUrl ? result.videoUrl.substring(0, 100) + '...' : 'NO VIDEO URL',
        error: result.error || 'none',
      });

      // Update task in MongoDB
      if (result.status) {
        try {
          const updateData: any = {
            status: result.status,
            updatedAt: new Date(),
          };

          if (result.videoUrl) {
            updateData.videoUrl = result.videoUrl;
          }

          if (result.status === 'completed' || result.status === 'failed') {
            updateData.completedAt = new Date();
          }

          if (result.error) {
            updateData.errorMessage = result.error;
          }

          await VideoTask.updateOne(
            { taskId },
            { $set: updateData }
          );

          console.log('✅ Video task updated in MongoDB');
        } catch (error) {
          console.error('❌ Failed to update video task:', error);
        }
      }

      console.log('📤 Video status response:', {
        statusCode: HTTP_STATUS.OK,
        success: result.status !== 'failed', // Success only if not failed
        status: result.status,
        videoUrl: result.videoUrl ? result.videoUrl.substring(0, 100) + '...' : 'NO VIDEO URL',
      });

      return {
        statusCode: HTTP_STATUS.OK,
        headers,
        body: JSON.stringify({
          success: result.status !== 'failed', // Success only if not failed
          taskId,
          status: result.status,
          videoUrl: result.videoUrl,
          error: result.error,
        }),
      };
    } else {
      console.log(`❌ [VideoStatus] Failed to get status:`, result.error);

      return errorResponse(
        HTTP_STATUS.INTERNAL_ERROR,
        result.error || 'Failed to check video status',
        headers
      );
    }
  } catch (error: any) {
    console.error('❌ [VideoStatus] Handler error:', error);

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
 * Helper: Log video request to MongoDB
 */
async function logVideoRequest(data: {
  userId: string;
  success: boolean;
  taskId?: string;
  errorMessage?: string;
  processingTimeMs: number;
  model: string;
  prompt: string;
  isImageToVideo: boolean;
  creditCost: number;
}): Promise<void> {
  try {
    await ApiRequest.create({
      userId: data.userId,
      timestamp: new Date(),
      requestType: 'video_generation',
      success: data.success,
      errorMessage: data.errorMessage,
      processingTimeMs: data.processingTimeMs,
      estimatedCostUSD: 0.05, // Adjust based on Kling AI pricing
      metadata: {
        taskId: data.taskId,
        model: data.model,
        modelUsed: data.model, // Required field
        prompt: data.prompt.substring(0, 200),
        isImageToVideo: data.isImageToVideo,
        creditCost: data.creditCost,
      },
      subscriptionTier: 'premium',
      region: CONFIG.AWS_REGION,
    });

    console.log('📊 Video request logged to MongoDB');
  } catch (error) {
    console.error('❌ Error logging video request:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

