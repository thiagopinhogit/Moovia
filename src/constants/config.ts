/**
 * App Configuration
 * 
 * Centralized configuration for the mobile app.
 * Update the backend configuration here to change it everywhere in the app.
 */

/**
 * Backend API Configuration
 * 
 * Production: AWS Lambda + API Gateway
 * Development: Local backend (if running)
 */
const USE_PRODUCTION = true; // Set to false for local development

// Production (AWS Lambda)
const PRODUCTION_BACKEND_URL = 'https://krgq9pgvb0.execute-api.sa-east-1.amazonaws.com/prod';

// Local Development
const BACKEND_IP = '192.168.15.108';
const BACKEND_PORT = '3000';
const LOCAL_BACKEND_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;

/**
 * Complete backend URL
 * Used by all API calls in the app
 */
export const BACKEND_URL = USE_PRODUCTION ? PRODUCTION_BACKEND_URL : LOCAL_BACKEND_URL;

/**
 * API Endpoints
 * All backend endpoints are available here for easy reference
 */
export const API_ENDPOINTS = {
  // Image generation
  generateImage: `${BACKEND_URL}/generate-image`,
  
  // Credits
  getCredits: (userId: string) => `${BACKEND_URL}/credits/${userId}`,
  
  // Webhook (for RevenueCat)
  revenueCatWebhook: `${BACKEND_URL}/revenuecat-webhook`,
} as const;

/**
 * Environment info (for debugging)
 */
export const CONFIG = {
  backendUrl: BACKEND_URL,
  isProduction: USE_PRODUCTION,
  isDevelopment: __DEV__,
} as const;


