# Fix: One-Time Purchase Webhook Event Processing

## 🐛 Problem

When users purchased credits (one-time purchase products like `moovia_credits_1000`), the RevenueCat webhook was receiving an `INITIAL_PURCHASE` event instead of `NON_RENEWING_PURCHASE`. 

The webhook handler code only processed subscription products for `INITIAL_PURCHASE` events, causing one-time purchase credits to be ignored.

## 🔍 Root Cause

The issue was in `/lambda/src/handlers/revenuecatWebhook.ts`:

```typescript
case 'INITIAL_PURCHASE':
case 'RENEWAL':
  // Only handled subscription type
  if (productMapping.type === 'subscription') {
    // Grant subscription credits...
  }
  // ❌ Missing: no handling for productMapping.type === 'purchase'
  break;
```

When a user bought credits:
1. RevenueCat sent event type: `INITIAL_PURCHASE`
2. Product mapping identified it as type: `purchase`
3. The code checked `if (productMapping.type === 'subscription')` → FALSE
4. No credits were granted ❌

## ✅ Solution

Added an `else if` clause to handle one-time purchases that arrive as `INITIAL_PURCHASE` events:

```typescript
case 'INITIAL_PURCHASE':
case 'RENEWAL':
  // Can be either subscription or one-time purchase
  if (productMapping.type === 'subscription') {
    // Handle subscription...
  } else if (productMapping.type === 'purchase') {
    // Handle one-time purchase (can also come as INITIAL_PURCHASE)
    const result = await grantPurchaseCredits(
      appUserId,
      productMapping.key as keyof typeof PURCHASE_CREDITS,
      storeTransactionId || eventId
    );
    // ... rest of the logic
  }
  break;
```

## 📝 Changes Made

### File: `/lambda/src/handlers/revenuecatWebhook.ts`

**Before:**
- `INITIAL_PURCHASE` / `RENEWAL`: Only handled subscriptions
- One-time purchases were silently ignored

**After:**
- `INITIAL_PURCHASE` / `RENEWAL`: Handles both subscriptions AND one-time purchases
- Checks `productMapping.type` and routes to appropriate handler
- Includes duplicate detection for both types

### File: `/lambda/src/services/mongodb.ts`

**Bonus Fix:** Improved MongoDB connection handling:
- Added check for connection state 2 (connecting)
- Waits for `connected` event before proceeding
- Prevents race condition where queries execute before connection is ready
- Fixes `Cannot call usercredits.findOne() before initial connection is complete` error

## 🧪 How to Test

1. **Start local server:**
   ```bash
   cd lambda
   npm run dev
   ```

2. **Make a test purchase** in the app (Sandbox mode)

3. **Check server logs** for:
   ```
   💳 Processing purchase for user ...
   ✅ Granted 1000 credits to ...
   🎉 ====== WEBHOOK SUCCESS ======
   ```

4. **Verify credits** were added to user account

## 📊 Event Types

### Now Supported

| Event Type | Subscription | One-Time Purchase |
|-----------|-------------|-------------------|
| `INITIAL_PURCHASE` | ✅ Supported | ✅ Supported |
| `RENEWAL` | ✅ Supported | ✅ Supported (if applicable) |
| `NON_RENEWING_PURCHASE` | ❌ N/A | ✅ Supported |

## 🎯 Why INITIAL_PURCHASE for Both?

RevenueCat can send `INITIAL_PURCHASE` for both:
- **Subscriptions**: First subscription purchase
- **Non-consumables**: First time purchasing a non-consumable product

The product type (`subscription` vs `purchase`) is determined by our `mapProductToCredits()` function, not the event type.

## ✨ Benefits

1. ✅ One-time purchases now work correctly
2. ✅ Duplicate purchase protection maintained
3. ✅ Clear logging for debugging
4. ✅ No breaking changes to existing subscription flow
5. ✅ MongoDB connection is now more stable

## 🚀 Deployment

To deploy the fix:

```bash
cd lambda
npm run deploy-fal-ai
```

Or deploy all functions:

```bash
./deploy-all.sh
```

---

**Date:** January 8, 2026  
**Author:** AI Assistant  
**Issue:** One-time purchase credits not being granted  
**Status:** ✅ FIXED

