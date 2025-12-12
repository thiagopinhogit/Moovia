# Moovia - Video Generation Setup

## 🎬 Kling AI Integration

This project uses **Kling AI 2.5 Turbo** for video generation with support for multiple AI models.

### Architecture Overview

```
App (React Native)
    ↓
Your Backend API
    ↓
Kling AI API
```

## 📁 Files Created

### Frontend (React Native)
- `src/constants/videoModels.ts` - Video model configurations
- `src/services/videoGeneration.ts` - Video generation service
- `backend-example/video-api.ts` - Backend API example

### Key Features
✅ Multi-model support (easy to add Runway, Luma, etc)
✅ Text-to-Video
✅ Image-to-Video  
✅ Automatic polling for completion
✅ Credit system integration ready

## 🚀 Setup Instructions

### 1. Get Kling AI API Key

1. Go to [Kling AI Developer Portal](https://app.klingai.com/global/dev/document-api)
2. Sign up / Log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy your API key

### 2. Backend Setup

You need a backend to proxy Kling AI requests (to keep API keys secure).

#### Option A: Node.js/Express Backend

```bash
# Create backend folder
mkdir backend
cd backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express axios dotenv cors

# Create .env file
echo "KLING_API_KEY=your_kling_api_key_here" > .env
echo "PORT=3000" >> .env
```

Create `backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import videoRouter from './routes/video';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/video', videoRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
```

Use the `backend-example/video-api.ts` file as your `backend/src/routes/video.ts`

#### Option B: Serverless (AWS Lambda, Vercel, etc)

Deploy the API endpoints as serverless functions:
- `/api/video/generate` - POST
- `/api/video/status/:taskId` - GET

### 3. Configure App

Update `src/services/videoGeneration.ts`:

```typescript
// Change this to your backend URL
const BACKEND_API_URL = 'https://your-backend.com/api'; // Production
// or
const BACKEND_API_URL = 'http://localhost:3000/api'; // Development
```

### 4. Update Environment Variables

Create `.env` file in your React Native project:

```bash
BACKEND_API_URL=http://localhost:3000/api
# Or your production URL
# BACKEND_API_URL=https://your-backend.com/api
```

## 📊 Models Available

### Kling 2.5 Turbo (Current)
- **Speed**: Fast ⚡
- **Quality**: High
- **Max Duration**: 5 seconds
- **Credits**: 50 (text-to-video), 75 (image-to-video)
- **Aspect Ratios**: 16:9, 9:16, 1:1

### Kling 2.0 Standard (Available)
- **Speed**: Normal
- **Quality**: Standard
- **Max Duration**: 10 seconds
- **Credits**: 80 (text-to-video), 120 (image-to-video)

### Runway Gen-3 (Coming Soon)
- **Speed**: Slow
- **Quality**: Ultra
- **Max Duration**: 10 seconds
- **Credits**: 200+

## 🔧 Usage Example

```typescript
import { generateVideo, pollVideoCompletion } from './services/videoGeneration';

// Generate video
const response = await generateVideo({
  modelId: 'kling-2.5-turbo',
  prompt: 'A cat playing piano in a jazz club',
  duration: 5,
  aspectRatio: '16:9',
});

if (response.success && response.taskId) {
  // Poll for completion
  const result = await pollVideoCompletion(
    response.taskId,
    'kling'
  );
  
  if (result.success && result.videoUrl) {
    console.log('Video ready:', result.videoUrl);
  }
}
```

## 💰 Credits System

### Current Pricing (per generation)

| Model | Text-to-Video | Image-to-Video |
|-------|--------------|----------------|
| Kling 2.5 Turbo | 50 credits | 75 credits |
| Kling 2.0 Standard | 80 credits | 120 credits |
| Runway Gen-3 | 200 credits | 300 credits |

### Integration with Existing Credits

The video generation automatically integrates with your existing credit system in `src/services/credits.ts`.

Update `src/constants/credits.ts` to add video costs:

```typescript
export const VIDEO_CREDIT_COSTS = {
  'kling-2.5-turbo-text': 50,
  'kling-2.5-turbo-image': 75,
  'kling-2.0-standard-text': 80,
  'kling-2.0-standard-image': 120,
};
```

## 🎯 Adding More Models

To add a new model (e.g., Runway Gen-3):

1. **Update `videoModels.ts`**:
```typescript
'runway-gen3': {
  id: 'runway-gen3',
  displayName: 'Runway Gen-3',
  provider: 'runway',
  // ... configuration
}
```

2. **Add Provider Handler** in `videoGeneration.ts`:
```typescript
case 'runway':
  return generateVideoRunway(request);
```

3. **Implement Backend Endpoint**:
```typescript
// backend/src/routes/video.ts
// Add Runway API integration
```

## 🔗 Kling AI API Reference

- **Documentation**: https://app.klingai.com/global/dev/document-api
- **API Base URL**: `https://api.klingai.com/v1`
- **Endpoints**:
  - POST `/videos/text2video` - Generate video
  - GET `/videos/text2video/:taskId` - Check status

### Request Format

```json
{
  "model_name": "kling-v1-5",
  "prompt": "Your prompt here",
  "negative_prompt": "",
  "cfg_scale": 0.5,
  "mode": "std",
  "aspect_ratio": "16:9",
  "duration": "5"
}
```

### Response Format

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "xxx-xxx-xxx",
    "task_status": "submitted"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Check your Kling AI API key in `.env`
   - Make sure it's correctly set in backend

2. **"Video generation timeout"**
   - Increase `maxAttempts` in `pollVideoCompletion`
   - Check Kling AI service status

3. **"Insufficient credits"**
   - Implement credit check in backend
   - Deduct credits before starting generation

## 📝 Next Steps

1. ✅ Setup backend with Kling AI API key
2. ✅ Test video generation
3. 🔲 Add Runway Gen-3 support
4. 🔲 Add Luma AI support
5. 🔲 Implement webhook for completion
6. 🔲 Add video preview/playback in app

## 🤝 Support

For Kling AI API support:
- Documentation: https://app.klingai.com/global/dev/document-api
- Email: support@klingai.com

For app support:
- GitHub Issues: [your-repo]/issues

