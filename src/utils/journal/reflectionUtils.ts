
import { format, addDays } from 'date-fns';
import { MonthlyReflection, WeeklyReflection, TradeWithMetrics } from '@/types';
import { getTradesForWeek, getTradesForMonth } from '@/utils/tradeCalculations';

/**
 * Get the current period ID for weekly or monthly reflections
 */
export const getCurrentPeriodId = (type: 'weekly' | 'monthly') => {
  const today = new Date();
  
  if (type === 'weekly') {
    // Ensure we're always getting the current week or future week, never past week
    const nextWeek = addDays(today, 1); // Add a day to ensure we're in the current week
    return format(nextWeek, 'yyyy-MM-dd');
  } else {
    return format(today, 'yyyy-MM');
  }
};

/**
 * Count words in a text string, handling HTML content
 */
export const countWords = (text: string): number => {
  if (!text) return 0;

  // Remove HTML tags
  const textOnly = text.replace(/<[^>]*>/g, ' ');
  
  // Remove special chars and collapse whitespace
  const cleanText = textOnly.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Count words
  return cleanText ? cleanText.split(' ').length : 0;
};

/**
 * Get statistics for a reflection (weekly or monthly)
 */
export const getReflectionStats = (reflection: WeeklyReflection | MonthlyReflection) => {
  // Default values if we can't calculate stats
  const defaultStats = {
    pnl: 0,
    rValue: 0,
    tradeCount: 0,
    hasContent: false,
    winCount: 0,
    lossCount: 0,
    winRate: 0
  };

  try {
    // Handle weekly reflections
    if ('weekStart' in reflection && 'weekEnd' in reflection) {
      const weekStart = reflection.weekStart ? new Date(reflection.weekStart) : null;
      const weekEnd = reflection.weekEnd ? new Date(reflection.weekEnd) : null;

      if (!weekStart || !weekEnd) return defaultStats;

      const trades = getTradesForWeek(weekStart, weekEnd);
      return calculateStats(trades, !!reflection.reflection);
    } 
    // Handle monthly reflections
    else if ('monthStart' in reflection && 'monthEnd' in reflection) {
      const monthStart = reflection.monthStart ? new Date(reflection.monthStart) : null;
      const monthEnd = reflection.monthEnd ? new Date(reflection.monthEnd) : null;

      if (!monthStart || !monthEnd) return defaultStats;

      const trades = getTradesForMonth(monthStart, monthEnd);
      return calculateStats(trades, !!reflection.reflection);
    }
    
    return defaultStats;
  } catch (error) {
    console.error("Error calculating reflection stats:", error);
    return defaultStats;
  }
};

/**
 * Calculate stats from a list of trades
 */
function calculateStats(trades: TradeWithMetrics[], hasContent: boolean) {
  const tradeCount = trades.length;
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
  const totalR = trades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
  const winCount = trades.filter(trade => (trade.metrics?.profitLoss || 0) > 0).length;
  const lossCount = trades.filter(trade => (trade.metrics?.profitLoss || 0) < 0).length;
  const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;

  return {
    pnl: totalPnL,
    rValue: totalR,
    tradeCount: tradeCount,
    hasContent: hasContent,
    winCount: winCount,
    lossCount: lossCount,
    winRate: winRate
  };
}
