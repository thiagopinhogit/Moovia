#!/usr/bin/env ts-node

/**
 * Debug Google Veo API
 * Tests different endpoints to find the correct one
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.GOOGLE_VEO_API_KEY || '';
const PROJECT_ID = process.env.GOOGLE_VEO_PROJECT_ID || '';
const LOCATION = process.env.GOOGLE_VEO_LOCATION || 'us-central1';

async function testEndpoints() {
  console.log('🔍 Testing Google Cloud AI endpoints...\n');
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Location: ${LOCATION}\n`);

  const endpoints = [
    // Vertex AI - Veo 3 with generateContent
    {
      name: 'Veo 3 (generateContent)',
      url: `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-3:generateContent?key=${API_KEY}`,
      body: {
        prompt: 'A cat playing with a ball',
        aspectRatio: '16:9',
        resolution: '720p',
        durationSeconds: '6',
        personGeneration: 'allow_all',
      },
    },
    // Veo 3 Fast
    {
      name: 'Veo 3 Fast (generateContent)',
      url: `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-3-fast:generateContent?key=${API_KEY}`,
      body: {
        prompt: 'A cat playing with a ball',
        aspectRatio: '16:9',
        resolution: '720p',
        durationSeconds: '6',
        personGeneration: 'allow_all',
      },
    },
    // Old format - generate
    {
      name: 'Veo 3 (generate)',
      url: `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-3:generate?key=${API_KEY}`,
      body: {
        prompt: 'A cat playing with a ball',
        aspectRatio: '16:9',
        resolution: '720p',
        durationSeconds: '6',
        personGeneration: 'allow_all',
      },
    },
    // List available models
    {
      name: 'List Available Models',
      url: `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models?key=${API_KEY}`,
      method: 'GET',
    },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url.replace(API_KEY, 'API_KEY')}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.method === 'GET' ? undefined : JSON.stringify(endpoint.body || {}),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! This endpoint works!');
        try {
          const json = JSON.parse(text);
          console.log('Response preview:', JSON.stringify(json, null, 2).substring(0, 500));
        } catch {
          console.log('Response preview:', text.substring(0, 500));
        }
      } else if (response.status === 404) {
        console.log('❌ 404 - Model not found');
      } else if (response.status === 403) {
        console.log('❌ 403 - Permission denied (API not enabled or no access)');
      } else if (response.status === 401) {
        console.log('❌ 401 - Authentication failed');
      } else if (response.status === 400) {
        console.log('⚠️  400 - Bad request (but endpoint exists!)');
        console.log('Error:', text.substring(0, 300));
      } else {
        console.log('Response:', text.substring(0, 300));
      }
    } catch (error) {
      console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown');
    }
  }

  console.log('\n\n📚 Helpful resources:');
  console.log('- Vertex AI Video Generation: https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview');
  console.log('- Enable APIs: https://console.cloud.google.com/apis/library');
  console.log('- Request Veo Access: https://cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos');
}

testEndpoints().catch(console.error);
