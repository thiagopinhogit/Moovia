#!/usr/bin/env ts-node

/**
 * Test Google Veo Credentials
 * 
 * This script verifies that your Google Veo credentials are properly configured.
 * 
 * Usage:
 *   ts-node test-google-veo.ts
 */

import dotenv from 'dotenv';
import { GoogleAuth } from 'google-auth-library';

// Load environment variables
dotenv.config();

const GOOGLE_VEO_API_KEY = process.env.GOOGLE_VEO_API_KEY || '';
const GOOGLE_VEO_PROJECT_ID = process.env.GOOGLE_VEO_PROJECT_ID || '';
const GOOGLE_VEO_LOCATION = process.env.GOOGLE_VEO_LOCATION || 'us-central1';
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

async function testGoogleAuth() {
  console.log('🧪 Testing Google Veo Credentials...\n');

  // Check configuration
  console.log('📋 Configuration:');
  console.log(`  Project ID: ${GOOGLE_VEO_PROJECT_ID || '❌ NOT SET'}`);
  console.log(`  Location: ${GOOGLE_VEO_LOCATION}`);
  console.log(`  API Key (token): ${GOOGLE_VEO_API_KEY ? '✅ SET (' + GOOGLE_VEO_API_KEY.substring(0, 20) + '...)' : '❌ NOT SET'}`);
  console.log(`  Service Account: ${GOOGLE_APPLICATION_CREDENTIALS || '❌ NOT SET'}`);
  console.log('');

  if (!GOOGLE_VEO_PROJECT_ID) {
    console.error('❌ GOOGLE_VEO_PROJECT_ID is not set!');
    console.log('\nAdd to your .env file:');
    console.log('  GOOGLE_VEO_PROJECT_ID=your-project-id\n');
    process.exit(1);
  }

  // Test authentication methods
  let accessToken: string | null = null;

  // Method 1: Try using provided API key/token
  if (GOOGLE_VEO_API_KEY) {
    if (GOOGLE_VEO_API_KEY.length > 100) {
      console.log('✅ Using provided OAuth2 token');
      accessToken = GOOGLE_VEO_API_KEY;
    } else {
      console.log('⚠️  API key provided but seems too short (expected OAuth2 token)');
    }
  }

  // Method 2: Try using Service Account
  if (!accessToken && GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('🔑 Attempting to authenticate with Service Account...');
      const auth = new GoogleAuth({
        keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      
      if (tokenResponse.token) {
        accessToken = tokenResponse.token;
        console.log('✅ Successfully generated access token from Service Account!');
        console.log(`   Token preview: ${accessToken.substring(0, 20)}...`);
      } else {
        console.log('❌ Failed to get access token from Service Account');
      }
    } catch (error) {
      console.error('❌ Service Account authentication failed:');
      console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('\nMake sure:');
      console.log('  1. The service account JSON file exists');
      console.log('  2. The file path is correct in GOOGLE_APPLICATION_CREDENTIALS');
      console.log('  3. The service account has necessary permissions\n');
    }
  }

  // Method 3: Try Application Default Credentials
  if (!accessToken) {
    try {
      console.log('🔑 Attempting Application Default Credentials...');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      
      if (tokenResponse.token) {
        accessToken = tokenResponse.token;
        console.log('✅ Successfully got token from Application Default Credentials!');
        console.log('   (You probably ran: gcloud auth application-default login)');
      }
    } catch (error) {
      console.log('⚠️  Application Default Credentials not available');
    }
  }

  if (!accessToken) {
    console.error('\n❌ Could not get access token!');
    console.log('\nPlease configure one of the following:');
    console.log('  1. Set GOOGLE_VEO_API_KEY to a valid OAuth2 token');
    console.log('  2. Set GOOGLE_APPLICATION_CREDENTIALS to service account JSON path');
    console.log('  3. Run: gcloud auth application-default login\n');
    console.log('See GOOGLE_VEO_SETUP.md for detailed instructions.\n');
    process.exit(1);
  }

  // Test API endpoint
  console.log('\n🌐 Testing API endpoint...');
  const endpoint = `https://${GOOGLE_VEO_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_VEO_PROJECT_ID}/locations/${GOOGLE_VEO_LOCATION}/publishers/google/models`;
  console.log(`   Endpoint: ${endpoint}`);

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('✅ API endpoint is accessible!');
      console.log('\n🎉 Google Veo credentials are properly configured!');
      console.log('\nYou can now use Google Veo in the app.\n');
    } else {
      const text = await response.text();
      console.log(`⚠️  API returned ${response.status}`);
      console.log(`   Response: ${text.substring(0, 200)}`);
      
      if (response.status === 403) {
        console.log('\n⚠️  Permission denied. Make sure:');
        console.log('  1. Vertex AI API is enabled');
        console.log('  2. Service account has "Vertex AI User" role');
        console.log('  3. Project ID is correct\n');
      } else if (response.status === 404) {
        console.log('\n⚠️  Model not found. This could mean:');
        console.log('  1. Google Veo is not available in your region');
        console.log('  2. You need to request access to Veo preview');
        console.log('  3. The API endpoint has changed\n');
      }
    }
  } catch (error) {
    console.error('❌ API test failed:');
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Run the test
testGoogleAuth().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
