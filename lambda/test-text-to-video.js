/**
 * Quick test: Text-to-video with kling-v1-5
 */

require('dotenv').config();
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

function generateKlingToken() {
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: Math.floor(Date.now() / 1000) + 1800,
    nbf: Math.floor(Date.now() / 1000) - 5,
  };

  return jwt.sign(payload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' },
  });
}

async function testTextToVideo() {
  console.log('\n🎬 Testing TEXT-TO-VIDEO (no image)...\n');

  const jwtToken = generateKlingToken();

  const requestBody = {
    model_name: 'kling-v1-5',
    prompt: 'A beautiful sunset over the ocean with waves',
    aspect_ratio: '16:9',
    duration: '5',
  };

  console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://api-singapore.klingai.com/v1/videos/text2video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  console.log('\n📦 Response:');
  console.log('  Status:', response.status);
  console.log('  Data:', JSON.stringify(data, null, 2));

  if (data.code === 0) {
    console.log('\n✅ SUCCESS! Text-to-video works!');
    console.log('   Task ID:', data.data?.task_id);
  } else {
    console.log('\n❌ FAILED:', data.message);
  }
}

testTextToVideo().catch(console.error);
