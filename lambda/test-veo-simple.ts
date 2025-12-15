#!/usr/bin/env ts-node

/**
 * Test Google Veo with correct model name
 */

import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const API_KEY = process.env.GOOGLE_VEO_API_KEY || '';

async function testGoogleVeo() {
  console.log('🧪 Testing Google Veo API...\n');
  
  if (!API_KEY) {
    console.error('❌ GOOGLE_VEO_API_KEY not set in .env');
    process.exit(1);
  }

  console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...\n`);

  try {
    const genAI = new GoogleGenAI({ apiKey: API_KEY });

    console.log('📝 Generating test video with veo-3.1-generate-preview...');
    
    const operation = await genAI.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: 'A cat playing with a ball',
      config: {
        aspectRatio: '16:9',
        resolution: '720p',
        durationSeconds: '4',
        personGeneration: 'allow_all',
      },
    });

    console.log('\n✅ Success! Video generation started!');
    console.log('Operation:', operation.name);
    console.log('Done:', operation.done);
    
    console.log('\n💡 To check status, save this operation name and poll it.');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    
    if (error.message?.includes('404')) {
      console.log('\n📋 This means:');
      console.log('  1. Google Veo is not available with your API key');
      console.log('  2. You need to request preview access');
      console.log('  3. Visit: https://aistudio.google.com/ to check access');
    } else if (error.message?.includes('403')) {
      console.log('\n📋 This means:');
      console.log('  1. API Key doesn\'t have permission');
      console.log('  2. Generate a new API key at: https://aistudio.google.com/apikey');
    }
  }
}

testGoogleVeo();
