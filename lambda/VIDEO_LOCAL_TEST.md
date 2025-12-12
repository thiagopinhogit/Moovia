# 🧪 Local Testing Guide - Video Generation

## Setup

### 1. Install Dependencies

```bash
cd lambda
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `lambda` folder:

```bash
cp env.example .env
```

Edit `.env` and add your keys:

```env
MONGODB_URI=mongodb+srv://your-connection-string
KLING_API_KEY=your_kling_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Get Your Kling AI API Key

1. Go to [Kling AI Developer Portal](https://app.klingai.com/global/dev/document-api)
2. Sign up / Log in
3. Navigate to **API Keys** section
4. Create a new API key
5. Copy and paste into your `.env` file

## Running Locally

### Start the server:

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Testing Video Generation

### 1. Test Video Generation (Text-to-Video)

```bash
curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "prompt": "A cat playing piano in a jazz club, cinematic lighting",
    "model": "kling-v1-5",
    "duration": "5",
    "aspectRatio": "16:9"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "taskId": "task_xxx-xxx-xxx",
  "status": "submitted",
  "estimatedWaitTime": 120,
  "creditsUsed": 50,
  "creditsRemaining": 950
}
```

### 2. Test Video Generation (Image-to-Video)

```bash
curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "prompt": "Animate this image with smooth camera movement",
    "imageUrl": "https://your-image-url.jpg",
    "model": "kling-v1-5",
    "duration": "5",
    "aspectRatio": "16:9"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "taskId": "task_xxx-xxx-xxx",
  "status": "submitted",
  "estimatedWaitTime": 120,
  "creditsUsed": 75,
  "creditsRemaining": 925
}
```

### 3. Check Video Status

Replace `TASK_ID` with the taskId from previous step:

```bash
curl http://localhost:3000/video-status/TASK_ID
```

**Possible Responses:**

**Still Processing:**
```json
{
  "success": true,
  "taskId": "task_xxx-xxx-xxx",
  "status": "processing",
  "videoUrl": null
}
```

**Completed:**
```json
{
  "success": true,
  "taskId": "task_xxx-xxx-xxx",
  "status": "succeed",
  "videoUrl": "https://kling.ai/videos/xxx.mp4"
}
```

**Failed:**
```json
{
  "success": true,
  "taskId": "task_xxx-xxx-xxx",
  "status": "failed",
  "error": "Video generation failed"
}
```

## Testing from React Native App

Update `src/services/videoGeneration.ts`:

```typescript
const BACKEND_API_URL = 'http://localhost:3000'; // For local testing
// const BACKEND_API_URL = 'https://your-api.com'; // For production
```

### Test in App:

```typescript
import { generateVideo, pollVideoCompletion } from './services/videoGeneration';

// Generate video
const result = await generateVideo({
  modelId: 'kling-2.5-turbo',
  prompt: 'A cat playing piano in a jazz club',
  duration: 5,
  aspectRatio: '16:9',
});

if (result.success && result.taskId) {
  console.log('Video generation started:', result.taskId);
  
  // Poll for completion
  const video = await pollVideoCompletion(result.taskId, 'kling');
  
  if (video.success && video.videoUrl) {
    console.log('Video ready!', video.videoUrl);
  }
}
```

## Available Models

| Model ID | Model Name | Credit Cost (Text) | Credit Cost (Image) |
|----------|-----------|-------------------|---------------------|
| `kling-v1-5` | Kling 2.5 Turbo | 50 | 75 |
| `kling-v1` | Kling 2.0 Standard | 80 | 120 |

## Credit Management

### Check User Credits:

```bash
curl http://localhost:3000/credits/test-user-123
```

### Add Credits (for testing):

You can use the MongoDB directly or create a test endpoint. Example with MongoDB:

```javascript
// In MongoDB Compass or mongo shell
db.usercredits.updateOne(
  { userId: "test-user-123" },
  { 
    $set: { credits: 1000 },
    $setOnInsert: { userId: "test-user-123", createdAt: new Date() }
  },
  { upsert: true }
)
```

## Troubleshooting

### "KLING_API_KEY not configured"
- Make sure `.env` file exists in `lambda` folder
- Check that `KLING_API_KEY` is set correctly
- Restart the server after changing `.env`

### "Insufficient credits"
- Add credits to your test user in MongoDB
- Or use the `add-credits` endpoint if you have one

### "Failed to connect to MongoDB"
- Check `MONGODB_URI` in `.env`
- Make sure MongoDB is accessible from your network
- Check MongoDB Atlas whitelist (allow your IP)

### Video generation timeout
- Kling AI usually takes 1-3 minutes
- Check task status manually: `https://api.klingai.com/v1/videos/text2video/{taskId}`
- Verify your Kling AI API key is valid

## Monitoring

### View Logs:

The server logs will show:
- `🎬 [Kling] Starting video generation` - When generation starts
- `✅ Credits deducted` - When credits are removed
- `📦 [Kling] API Response` - Kling AI response
- `💸 Refunding credits` - If generation fails

### View in MongoDB:

Check the `apirequests` collection for logged video generations:

```javascript
db.apirequests.find({ 
  requestType: "video_generation",
  userId: "test-user-123"
}).sort({ timestamp: -1 }).limit(10)
```

## Next Steps

1. ✅ Test locally
2. 🔲 Deploy to AWS Lambda
3. 🔲 Update app to use production URL
4. 🔲 Add more video models (Runway, Luma)
5. 🔲 Implement webhook for completion notifications

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-video` | Generate a new video |
| GET | `/video-status/:taskId` | Check video generation status |
| GET | `/credits/:userId` | Get user credit balance |
| POST | `/generate-image` | Generate image (existing) |
| POST | `/revenuecat-webhook` | Handle subscription webhooks |

