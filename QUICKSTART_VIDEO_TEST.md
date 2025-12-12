# 🚀 Quick Start - Test Video Generation NOW

## Step 1: Setup Backend (5 minutes)

```bash
# Navigate to lambda folder
cd lambda

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

## Step 2: Add Your Kling AI API Key

1. Go to https://app.klingai.com/global/dev/document-api
2. Login/Register
3. Go to API Keys section
4. Create new API key
5. Copy the key

Edit `lambda/.env`:
```env
KLING_API_KEY=sk-xxxxxxxxxxxxxxxxxx
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

## Step 3: Start Backend Server

```bash
# In lambda folder
npm run dev
```

You should see:
```
🚀 Server started on port 3000
✅ Connected to MongoDB
```

## Step 4: Test Video Generation

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "prompt": "A majestic lion walking through the savanna at sunset, cinematic 4k",
    "model": "kling-v1-5",
    "duration": "5",
    "aspectRatio": "16:9"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "taskId": "task_abc123...",
  "status": "submitted",
  "estimatedWaitTime": 120,
  "creditsUsed": 50,
  "creditsRemaining": 950
}
```

## Step 5: Check Video Status

Copy the `taskId` from above and check status:

```bash
curl http://localhost:3000/video-status/task_abc123...
```

Keep checking every 10-20 seconds until status is `succeed`:

```json
{
  "success": true,
  "taskId": "task_abc123...",
  "status": "succeed",
  "videoUrl": "https://kling-cdn.com/videos/xxx.mp4"
}
```

## Step 6: Test from React Native App

Make sure backend is running, then:

1. Open the app in simulator/device
2. Tap the `+` button
3. Select "Text to Video"
4. Enter a prompt: "A cat playing piano in a jazz club"
5. Tap "Create"

The app will:
- ✅ Call your local backend (`http://localhost:3000`)
- ✅ Backend calls Kling AI
- ✅ App polls for completion
- ✅ Shows video when ready!

## 🎯 What to Test

### Text-to-Video ✨
```json
{
  "userId": "test-user",
  "prompt": "A futuristic city with flying cars at night, neon lights, cyberpunk style",
  "model": "kling-v1-5",
  "duration": "5"
}
```

### Image-to-Video 🖼️
```json
{
  "userId": "test-user",
  "prompt": "Add smooth camera movement and cinematic effects",
  "imageUrl": "https://your-image.jpg",
  "model": "kling-v1-5",
  "duration": "5"
}
```

## 📊 Monitor Credits

Check balance:
```bash
curl http://localhost:3000/credits/test-user-123
```

## ⚡ Quick Commands

```bash
# Start backend
cd lambda && npm run dev

# Test text-to-video
curl -X POST http://localhost:3000/generate-video -H "Content-Type: application/json" -d '{"userId":"test","prompt":"A cat playing piano","model":"kling-v1-5","duration":"5"}'

# Check status (replace TASK_ID)
curl http://localhost:3000/video-status/TASK_ID

# Check credits
curl http://localhost:3000/credits/test-user-123
```

## 🐛 Common Issues

**Backend won't start:**
- Run `npm install` first
- Check `.env` file exists
- Make sure port 3000 is not in use

**"KLING_API_KEY not configured":**
- Add your API key to `lambda/.env`
- Restart the server

**"Insufficient credits":**
- Add credits to test user in MongoDB:
  ```javascript
  db.usercredits.updateOne(
    {userId: "test-user-123"}, 
    {$set: {credits: 1000}}, 
    {upsert: true}
  )
  ```

**Can't connect from app:**
- Make sure backend is running
- Use `http://localhost:3000` (not https)
- For iOS simulator, localhost works fine
- For Android emulator, use `http://10.0.2.2:3000`

## 🎉 Success!

When you see the video URL in the response, copy it and open in browser to watch your generated video!

Next: Deploy to production and add more AI models! 🚀

