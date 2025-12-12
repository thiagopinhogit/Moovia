/**
 * Backend API Example for Kling AI Video Generation
 * This should be deployed as a serverless function or Express API
 * 
 * Install dependencies:
 * npm install express axios dotenv
 */

// Example implementation for your backend
// File: backend/src/routes/video.ts

import express from 'express';
import axios from 'axios';

const router = express.Router();

const KLING_API_KEY = process.env.KLING_API_KEY;
const KLING_API_BASE = 'https://api.klingai.com/v1';

/**
 * Generate video endpoint
 * POST /api/video/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      provider,
      model_name,
      prompt,
      image_url,
      mode,
      duration,
      aspect_ratio,
      negative_prompt,
    } = req.body;

    if (provider !== 'kling') {
      return res.status(400).json({
        error: 'Only Kling provider supported currently',
      });
    }

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
      });
    }

    // Validate user credits here (from your database)
    // const user = await getUserFromToken(req.headers.authorization);
    // if (user.credits < requiredCredits) {
    //   return res.status(402).json({ error: 'Insufficient credits' });
    // }

    console.log('🎬 Calling Kling AI API:', {
      model: model_name,
      mode,
      duration,
    });

    // Call Kling AI API
    // Reference: https://app.klingai.com/global/dev/document-api/quickStart/apiInterface/taskSubmission
    const klingResponse = await axios.post(
      `${KLING_API_BASE}/videos/text2video`,
      {
        model_name: model_name || 'kling-v1-5',
        prompt: prompt,
        negative_prompt: negative_prompt || '',
        cfg_scale: 0.5,
        mode: mode || 'std',
        aspect_ratio: aspect_ratio || '16:9',
        duration: duration || '5',
        // Add image_url for image-to-video
        ...(image_url && { image: image_url }),
      },
      {
        headers: {
          'Authorization': `Bearer ${KLING_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const taskData = klingResponse.data;

    console.log('✅ Kling AI task created:', {
      taskId: taskData.data.task_id,
      status: taskData.data.task_status,
    });

    // Deduct credits from user account
    // await deductCredits(user.id, requiredCredits);

    // Save task to database
    // await saveVideoTask({
    //   userId: user.id,
    //   taskId: taskData.data.task_id,
    //   provider: 'kling',
    //   status: 'pending',
    //   prompt,
    //   credits: requiredCredits,
    // });

    res.json({
      success: true,
      task_id: taskData.data.task_id,
      status: taskData.data.task_status,
      estimated_time: 120, // Kling usually takes 1-3 minutes
    });
  } catch (error: any) {
    console.error('❌ Error generating video:', error.response?.data || error.message);
    
    res.status(500).json({
      error: error.response?.data?.message || 'Failed to generate video',
      details: error.response?.data,
    });
  }
});

/**
 * Check video status endpoint
 * GET /api/video/status/:taskId
 */
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { provider = 'kling' } = req.query;

    if (provider !== 'kling') {
      return res.status(400).json({
        error: 'Only Kling provider supported currently',
      });
    }

    console.log('🔍 Checking task status:', taskId);

    // Call Kling AI status API
    // Reference: https://app.klingai.com/global/dev/document-api/quickStart/apiInterface/taskQuery
    const klingResponse = await axios.get(
      `${KLING_API_BASE}/videos/text2video/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${KLING_API_KEY}`,
        },
      }
    );

    const taskData = klingResponse.data.data;

    console.log('📊 Task status:', {
      taskId,
      status: taskData.task_status,
      hasVideo: !!taskData.task_result?.videos?.[0]?.url,
    });

    // Map Kling status to our status
    let status: string;
    switch (taskData.task_status) {
      case 'submitted':
      case 'pending':
        status = 'pending';
        break;
      case 'processing':
        status = 'processing';
        break;
      case 'succeed':
        status = 'completed';
        break;
      case 'failed':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }

    // Update task in database
    // await updateVideoTask(taskId, {
    //   status,
    //   videoUrl: taskData.task_result?.videos?.[0]?.url,
    // });

    res.json({
      success: true,
      task_id: taskId,
      status: status,
      video_url: taskData.task_result?.videos?.[0]?.url,
      error: taskData.task_status === 'failed' ? 'Generation failed' : undefined,
    });
  } catch (error: any) {
    console.error('❌ Error checking status:', error.response?.data || error.message);
    
    res.status(500).json({
      error: error.response?.data?.message || 'Failed to check status',
      details: error.response?.data,
    });
  }
});

export default router;

// Example Express setup
// File: backend/src/index.ts
/*
import express from 'express';
import videoRouter from './routes/video';

const app = express();

app.use(express.json());
app.use('/api/video', videoRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
*/

