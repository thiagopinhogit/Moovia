/**
 * Cost Tracking Service
 * Monitors and alerts on API costs
 */

import { CostTracking } from '../models/CostTracking';
import { CONFIG } from '../config/constants';

/**
 * Update daily cost tracking
 */
export async function updateCostTracking(
  success: boolean,
  costUSD: number,
  userId: string,
  tier: 'free' | 'premium',
  processingTimeMs: number
): Promise<void> {
  try {
    const today = getStartOfDay(new Date());
    
    const update: any = {
      $inc: {
        totalRequests: 1,
        totalCostUSD: costUSD,
      },
      $addToSet: {
        uniqueUsers: userId, // MongoDB vai contar únicos
      },
    };
    
    if (success) {
      update.$inc.successfulRequests = 1;
    } else {
      update.$inc.failedRequests = 1;
    }
    
    // Incrementa contador do tier correto
    if (tier === 'premium') {
      update.$inc['breakdown.premiumUsers'] = 1;
    } else {
      update.$inc['breakdown.freeUsers'] = 1;
    }
    
    const tracking = await CostTracking.findOneAndUpdate(
      { date: today },
      update,
      { upsert: true, new: true }
    );
    
    // Verifica se precisa enviar alerta
    await checkCostAlerts(tracking);
    
    console.log(`💰 Cost tracking updated: $${tracking.totalCostUSD.toFixed(4)} today, ${tracking.uniqueUsers.length} unique users`);
  } catch (error) {
    console.error('❌ Error updating cost tracking:', error);
    // Não bloqueia a request se falhar o tracking
  }
}

/**
 * Check if cost limits exceeded and send alerts
 */
async function checkCostAlerts(tracking: any): Promise<void> {
  try {
    // Se já enviou alerta hoje, não envia novamente
    if (tracking.costAlertSent) {
      return;
    }
    
    const dailyCost = tracking.totalCostUSD;
    
    // Alerta se ultrapassar 80% do limite diário
    if (dailyCost >= CONFIG.MAX_DAILY_COST * 0.8) {
      console.warn(`⚠️ COST ALERT: Daily cost at $${dailyCost.toFixed(2)} (80% of limit)`);
      // TODO: Enviar email/SNS notification
      
      tracking.costAlertSent = true;
      await tracking.save();
    }
    
    // Alerta crítico se ultrapassar 100%
    if (dailyCost >= CONFIG.MAX_DAILY_COST) {
      console.error(`🚨 CRITICAL: Daily cost limit exceeded! $${dailyCost.toFixed(2)}`);
      // TODO: Enviar email urgente / desabilitar API temporariamente
    }
  } catch (error) {
    console.error('❌ Error checking cost alerts:', error);
  }
}

/**
 * Get total cost for period
 */
export async function getTotalCost(days: number = 1): Promise<number> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await CostTracking.aggregate([
      {
        $match: {
          date: { $gte: getStartOfDay(startDate) },
        },
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$totalCostUSD' },
        },
      },
    ]);
    
    return result[0]?.totalCost || 0;
  } catch (error) {
    console.error('❌ Error getting total cost:', error);
    return 0;
  }
}

/**
 * Check if daily/monthly cost limit exceeded
 */
export async function isCostLimitExceeded(): Promise<boolean> {
  try {
    const dailyCost = await getTotalCost(1);
    const monthlyCost = await getTotalCost(30);
    
    if (dailyCost >= CONFIG.MAX_DAILY_COST) {
      console.warn(`⚠️ Daily cost limit exceeded: $${dailyCost.toFixed(2)}`);
      return true;
    }
    
    if (monthlyCost >= CONFIG.MAX_MONTHLY_COST) {
      console.warn(`⚠️ Monthly cost limit exceeded: $${monthlyCost.toFixed(2)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking cost limit:', error);
    return false; // Em caso de erro, permite continuar
  }
}

/**
 * Helper: Get start of day (00:00:00)
 */
function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

