#!/bin/bash

# Quick test script for video generation
# Usage: ./test-video.sh

echo "🎬 Testing Moovia Video Generation API"
echo ""

# Configuration
BASE_URL="http://localhost:3000"
USER_ID="test-user-123"

# Test 1: Generate Text-to-Video
echo "📝 Test 1: Text-to-Video Generation"
echo "------------------------------------"

RESPONSE=$(curl -s -X POST ${BASE_URL}/generate-video \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${USER_ID}\",
    \"prompt\": \"A majestic lion walking through the savanna at golden hour, cinematic 4k\",
    \"model\": \"kling-v1-5\",
    \"duration\": \"5\",
    \"aspectRatio\": \"16:9\"
  }")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract taskId
TASK_ID=$(echo "$RESPONSE" | grep -o '"taskId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  echo "❌ Failed to get taskId. Check if backend is running."
  exit 1
fi

echo "✅ Task ID: $TASK_ID"
echo ""

# Test 2: Check Status
echo "📊 Test 2: Checking Video Status"
echo "------------------------------------"
echo "Waiting for video generation (this may take 1-3 minutes)..."
echo ""

MAX_ATTEMPTS=36  # 36 * 5 seconds = 3 minutes
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  
  STATUS_RESPONSE=$(curl -s ${BASE_URL}/video-status/${TASK_ID})
  
  # Extract status
  STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  echo "[$ATTEMPT/$MAX_ATTEMPTS] Status: $STATUS"
  
  if [ "$STATUS" = "succeed" ]; then
    echo ""
    echo "🎉 Video Generation Complete!"
    echo "------------------------------------"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
    
    # Extract video URL
    VIDEO_URL=$(echo "$STATUS_RESPONSE" | grep -o '"videoUrl":"[^"]*"' | cut -d'"' -f4)
    echo ""
    echo "🎥 Video URL: $VIDEO_URL"
    echo ""
    echo "✅ Test completed successfully!"
    exit 0
  elif [ "$STATUS" = "failed" ]; then
    echo ""
    echo "❌ Video Generation Failed"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
    exit 1
  fi
  
  sleep 5
done

echo ""
echo "⏱️ Timeout: Video generation took too long"
echo "Check status manually: curl ${BASE_URL}/video-status/${TASK_ID}"

# Test 3: Check Credits
echo ""
echo "💰 Test 3: Checking Credit Balance"
echo "------------------------------------"

CREDITS_RESPONSE=$(curl -s ${BASE_URL}/credits/${USER_ID})
echo "$CREDITS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREDITS_RESPONSE"

