
import { WeeklyReflection, MonthlyReflection, TradeWithMetrics } from '@/types';
import { getTradesForWeek } from '@/utils/tradeCalculations';

/**
 * Get the current week or month ID based on a date
 * @param date Optional date to use (defaults to current date)
 * @param period 'week' or 'month'
 * @returns ID string in the format YYYY-MM-DD (for week) or YYYY-MM (for month)
 */
export const getCurrentPeriodId = (date: Date = new Date(), period: 'week' | 'month' = 'week'): string => {
  if (period === 'week') {
    // Format as YYYY-MM-DD for week IDs
    return date.toISOString().split('T')[0];
  } else {
    // Format as YYYY-MM for month IDs
    return date.toISOString().slice(0, 7);
  }
};

/**
 * Count the number of words in a string
 */
export const countWords = (text: string = ''): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // First remove HTML tags
  const strippedText = text.replace(/<[^>]*>/g, ' ');
  
  // Then count non-empty words
  const words = strippedText.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
};

/**
 * Get statistics for a reflection
 */
export const getReflectionStats = (reflection: WeeklyReflection | MonthlyReflection) => {
  const weekStart = reflection.weekStart ? new Date(reflection.weekStart) : 
                   (reflection.monthStart ? new Date(reflection.monthStart) : null);
                   
  const weekEnd = reflection.weekEnd ? new Date(reflection.weekEnd) : 
                 (reflection.monthEnd ? new Date(reflection.monthEnd) : null);

  const trades = weekStart && weekEnd
    ? getTradesForWeek(weekStart, weekEnd)
    : [];

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
    hasContent: Boolean(reflection.reflection && reflection.reflection.trim().length > 0),
    winCount: winCount,
    lossCount: lossCount,
    winRate: winRate
  };
};
