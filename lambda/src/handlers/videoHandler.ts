/**
 * Video Generation Handler
 * Handles video generation requests with Kling AI
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { generateVideo, checkVideoStatus } from '../services/klingVideo';
import { 
  hasEnoughCredits, 
  getUserCredits,
  addCredits
} from '../services/creditManager';
import { HTTP_STATUS } from '../config/constants';
import { ApiRequest } from '../models/ApiRequest';
import { VideoTask } from '../models/VideoTask';
import { CONFIG } from '../config/constants';

// Credit costs per generation
const VIDEO_CREDIT_COSTS = {
  'kling-v1-5-text': 50,      // Kling 2.5 Turbo text-to-video
  'kling-v1-5-image': 75,     // Kling 2.5 Turbo image-to-video
  'kling-v1-text': 80,         // Kling 2.0 Standard text-to-video
  'kling-v1-image': 120,       // Kling 2.0 Standard image-to-video
};

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
      model = 'kling-v1-5', // Default to 2.5 Turbo
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

    // Determine credit cost
    const isImageToVideo = !!(finalImageUrl || imageBase64);
    const costKey = `${model}-${isImageToVideo ? 'image' : 'text'}` as keyof typeof VIDEO_CREDIT_COSTS;
    const creditCost = VIDEO_CREDIT_COSTS[costKey] || VIDEO_CREDIT_COSTS['kling-v1-5-text'];

    console.log(`💰 Credit cost: ${creditCost} credits (${costKey})`);

    // ⚠️ TEMPORARILY DISABLED FOR TESTING - Re-enable before production!
    // TODO: Remove these comments and uncomment the code below when ready to enable credit system
    
    /*
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
    
    // Use addCredits with negative amount for deduction
    const deductResult = await addCredits(userId, -creditCost, 'video_generation', {
      modelUsed: model,
      isImageToVideo,
      duration,
      aspectRatio,
      prompt: prompt.substring(0, 100), // Store first 100 chars
    });

    if (!deductResult.success) {
      return errorResponse(
        HTTP_STATUS.INTERNAL_ERROR,
        deductResult.error || 'Failed to deduct credits',
        headers
      );
    }

    console.log(`✅ Credits deducted. New balance: ${userCredits.credits - creditCost}`);
    */
    
    console.log('⚠️ [VideoGen] Credit checks DISABLED for testing - proceeding with generation');

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
      videoRequest.mode = mode as 'std' | 'pro';
    }

    const result = await generateVideo(videoRequest);

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
          provider: 'kling',
          videoModel: model, // Renamed from 'model' to 'videoModel'
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

      // ⚠️ TESTING MODE: Skip refund since we didn't deduct credits
      /*
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
      */

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
    // Extract taskId from path
    const path = event.path || event.rawPath || '';
    const taskId = path.split('/').pop();

    if (!taskId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'taskId is required', headers);
    }

    console.log(`🔍 [VideoStatus] Checking status for task: ${taskId}`);

    // Check status with Kling AI
    const result = await checkVideoStatus(taskId);

    if (result.success) {
      console.log(`📊 [VideoStatus] Status retrieved:`, {
        taskId,
        status: result.status,
        hasVideo: !!result.videoUrl,
        videoUrl: result.videoUrl ? result.videoUrl.substring(0, 100) + '...' : 'NO VIDEO URL',
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
        success: true,
        status: result.status,
        videoUrl: result.videoUrl ? result.videoUrl.substring(0, 100) + '...' : 'NO VIDEO URL',
      });

      return {
        statusCode: HTTP_STATUS.OK,
        headers,
        body: JSON.stringify({
          success: true,
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

