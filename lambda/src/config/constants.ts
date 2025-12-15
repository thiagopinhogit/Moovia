/**
 * Configuration constants for Lambda function
 * Using getters to ensure environment variables are read at runtime, not import time
 */

export const CONFIG = {
  // MongoDB
  get MONGODB_URI() { return process.env.MONGODB_URI || ''; },
  
  // Google Gemini API
  get GOOGLE_API_KEY() { return process.env.GOOGLE_API_KEY || ''; },
  get GEMINI_MODEL() { return process.env.GEMINI_MODEL || 'gemini-3-pro-image-preview'; },
  get GEMINI_API_URL() { 
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.GEMINI_MODEL}:generateContent`;
  },
  
  // Rate Limits (requests per day)
  RATE_LIMITS: {
    get FREE() { return parseInt(process.env.RATE_LIMIT_FREE || '0', 10); },
    get PREMIUM() { return parseInt(process.env.RATE_LIMIT_PREMIUM || '1000', 10); },
  },
  
  // Cost Control
  get MAX_DAILY_COST() { return parseFloat(process.env.MAX_DAILY_COST_USD || '50'); },
  get MAX_MONTHLY_COST() { return parseFloat(process.env.MAX_MONTHLY_COST_USD || '500'); },
  
  // Request Timeout
  REQUEST_TIMEOUT_MS: 120000, // 2 minutes
  
  // Estimated Costs (USD) - Ajuste conforme preços reais da API
  ESTIMATED_COST_PER_REQUEST: 0.01, // $0.01 por request (estimativa)
  
  // AWS
  get AWS_REGION() { return process.env.AWS_REGION || 'sa-east-1'; },
};

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

// Credit costs per model (MUST match frontend: src/constants/credits.ts)
// Formula: API Cost / 0.005 (cost per credit) = Credits needed
// With 80% margin: $9.99 plan → $2 max cost → $0.005 per credit
export const CREDIT_COSTS = {
  'gemini-pro': 2,    // ~$0.01 API cost → 2 credits (80% margin)
  'gemini-flash': 1,  // ~$0.005 API cost → 1 credit (80% margin)
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

