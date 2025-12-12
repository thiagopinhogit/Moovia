/**
 * Test script to verify Kling AI authentication
 * Run: node test-kling-auth.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

console.log('\n🔑 Testing Kling AI Authentication...\n');

console.log('Environment variables:');
console.log('  KLING_ACCESS_KEY:', KLING_ACCESS_KEY ? `${KLING_ACCESS_KEY.substring(0, 8)}...` : '❌ NOT SET');
console.log('  KLING_SECRET_KEY:', KLING_SECRET_KEY ? `${KLING_SECRET_KEY.substring(0, 8)}...` : '❌ NOT SET');
console.log('');

if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
  console.error('❌ ERROR: API keys not configured in .env file');
  process.exit(1);
}

/**
 * Generate JWT token for Kling AI
 */
function generateKlingToken() {
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: Math.floor(Date.now() / 1000) + 1800, // Current time + 30 min
    nbf: Math.floor(Date.now() / 1000) - 5, // Current time - 5s
  };

  const token = jwt.sign(payload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
    },
  });

  return token;
}

async function testAuth() {
  try {
    console.log('🔐 Generating JWT token...');
    const jwtToken = generateKlingToken();
    console.log('  Token preview:', jwtToken.substring(0, 30) + '...');
    console.log('');

    console.log('📡 Sending test request to Kling AI...\n');

    const requestBody = {
      model_name: 'kling-v1-5',
      prompt: 'A beautiful sunset over the ocean',
      negative_prompt: '',
      cfg_scale: 0.5,
      mode: 'std',
      aspect_ratio: '16:9',
      duration: '5',
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('');

    const response = await fetch('https://api-singapore.klingai.com/v1/videos/text2video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log('📦 Response:');
    console.log('  Status:', response.status);
    console.log('  Response:', JSON.stringify(data, null, 2));
    console.log('');

    if (data.code === 0) {
      console.log('✅ SUCCESS! Authentication is working correctly.');
      console.log('   Task ID:', data.data?.task_id);
      console.log('   Status:', data.data?.task_status);
    } else if (data.code === 1000) {
      console.log('❌ AUTHENTICATION FAILED!');
      console.log('   This means your API keys are incorrect or invalid.');
      console.log('   Please check:');
      console.log('   1. Go to https://app.klingai.com/global/dev/document-api');
      console.log('   2. Verify your Access Key and Secret Key');
      console.log('   3. Make sure you have credits in your account');
    } else {
      console.log('⚠️  API returned an error:');
      console.log('   Code:', data.code);
      console.log('   Message:', data.message);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testAuth();
