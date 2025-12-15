/**
 * Credit System Constants
 * Defines credit costs, subscription credits, and purchase packages
 */

// Credit costs per model (must match backend)
// Formula: API Cost / 0.005 (cost per credit) = Credits needed
// With 80% margin: $9.99 plan → $2 max cost → $0.005 per credit
export const CREDIT_COSTS = {
  'gemini-pro': 2,    // ~$0.01 API cost → 2 credits (80% margin)
  'gemini-flash': 1,  // ~$0.005 API cost → 1 credit (80% margin)
} as const;

// Credits granted per subscription tier (must match backend)
export const SUBSCRIPTION_CREDITS = {
  'mooviaproweekly': 400,
  'mooviaproannual': 1600,
} as const;

// One-time purchase credit packages (must match backend)
export const PURCHASE_CREDITS = {
  'moovia_credits_1000': 1000,
  'moovia_credits_5000': 5000,
  'moovia_credits_10000': 10000,
} as const;

// Calculate how many images you can generate with credits
export function calculateImageCount(credits: number, model: keyof typeof CREDIT_COSTS): number {
  return Math.floor(credits / CREDIT_COSTS[model]);
}

// Get recommended model based on credit balance
export function getRecommendedModel(credits: number): 'gemini-pro' | 'gemini-flash' | null {
  if (credits >= CREDIT_COSTS['gemini-pro']) {
    return 'gemini-pro';
  }
  if (credits >= CREDIT_COSTS['gemini-flash']) {
    return 'gemini-flash';
  }
  return null;
}

// Calculate subscription value (credits per dollar)
export function getSubscriptionValue(tier: keyof typeof SUBSCRIPTION_CREDITS): {
  credits: number;
  imagesWithPro: number;
  imagesWithFlash: number;
} {
  const credits = SUBSCRIPTION_CREDITS[tier];
  return {
    credits,
    imagesWithPro: calculateImageCount(credits, 'gemini-pro'),
    imagesWithFlash: calculateImageCount(credits, 'gemini-flash'),
  };
}

// Format credit package for display
export function formatCreditPackage(productId: keyof typeof PURCHASE_CREDITS): string {
  const credits = PURCHASE_CREDITS[productId];
  return `${credits.toLocaleString()} Credits`;
}

// Get model display name
export const MODEL_DISPLAY_NAMES = {
  'gemini-pro': 'Gemini Pro (High Quality)',
  'gemini-flash': 'Gemini Flash (Fast & Economical)',
} as const;

// Get model description
export const MODEL_DESCRIPTIONS = {
  'gemini-pro': 'Best quality images with advanced AI processing',
  'gemini-flash': 'Fast generation with good quality at lower cost',
} as const;

// Get model badges
export const MODEL_BADGES = {
  'gemini-pro': '🚀 Premium',
  'gemini-flash': '⚡ Fast',
} as const;

