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
    // For weekly reflections, we want to use the start of the week (Monday) as the ID
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate difference to get to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    
    // Format as YYYY-MM-DD for week IDs
    return monday.toISOString().split('T')[0];
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
 * Type guard to check if a reflection is a weekly reflection
 */
export function isWeeklyReflection(reflection: WeeklyReflection | MonthlyReflection): reflection is WeeklyReflection {
  return ('weekStart' in reflection && reflection.weekStart !== undefined) || 
         ('weekEnd' in reflection && reflection.weekEnd !== undefined) || 
         ('weekId' in reflection && reflection.weekId !== undefined);
}

/**
 * Type guard to check if a reflection is a monthly reflection
 */
export function isMonthlyReflection(reflection: WeeklyReflection | MonthlyReflection): reflection is MonthlyReflection {
  return ('monthStart' in reflection && reflection.monthStart !== undefined) || 
         ('monthEnd' in reflection && reflection.monthEnd !== undefined) || 
         ('monthId' in reflection && reflection.monthId !== undefined);
}

/**
 * Get statistics for a reflection
 */
export const getReflectionStats = (reflection: WeeklyReflection | MonthlyReflection) => {
  let dateStart: Date | null = null;
  let dateEnd: Date | null = null;
  
  // Determine the date range based on the reflection type
  if (isWeeklyReflection(reflection)) {
    if (reflection.weekStart) {
      dateStart = new Date(reflection.weekStart);
    }
    if (reflection.weekEnd) {
      dateEnd = new Date(reflection.weekEnd);
    }
  } else if (isMonthlyReflection(reflection)) {
    if (reflection.monthStart) {
      dateStart = new Date(reflection.monthStart);
    }
    if (reflection.monthEnd) {
      dateEnd = new Date(reflection.monthEnd);
    }
  }

  if (!dateStart || !dateEnd) {
    // Return default empty stats if no dates are available
    return {
      pnl: 0,
      rValue: 0,
      tradeCount: 0,
      hasContent: Boolean(reflection.reflection && reflection.reflection.trim().length > 0),
      winCount: 0,
      lossCount: 0,
      winRate: 0
    };
  }

  const trades = getTradesForWeek(dateStart, dateEnd);

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

/**
 * Create a consistent week ID from any date by finding the Monday of that week
 * @param date Any date within the week
 * @returns ID string in the format YYYY-MM-DD representing the Monday of that week
 */
export const getWeekIdFromDate = (date: Date): string => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate difference to get to Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  
  // Format as YYYY-MM-DD for week IDs
  return monday.toISOString().split('T')[0];
};
