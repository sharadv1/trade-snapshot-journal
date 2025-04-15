
/**
 * Re-export all calculation functions from their modular structure
 * This file is kept for backward compatibility
 */

// Re-export everything from the new modular structure
export * from './calculations';

// Re-export formatters for backward compatibility
export { formatCurrency, formatPercentage } from './calculations/formatters';

// Additional exports specifically for the Weekly Journal
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeWithMetrics } from '@/types';
import { isWithinInterval } from 'date-fns';

// Use a cache to prevent redundant calculations
const tradeCache: {
  trades: TradeWithMetrics[] | null;
  timestamp: number;
} = {
  trades: null,
  timestamp: 0
};

// Function to get trades for a specific week
export const getTradesForWeek = async (weekStart: Date, weekEnd: Date): Promise<TradeWithMetrics[]> => {
  try {
    // Reuse cached trades if they were fetched in the last 2 seconds
    const now = Date.now();
    const cacheIsValid = tradeCache.trades !== null && (now - tradeCache.timestamp) < 2000;
    
    // Get all trades with metrics (use cache if valid)
    const allTrades = cacheIsValid ? tradeCache.trades : getTradesWithMetrics();
    
    // Update cache if needed
    if (!cacheIsValid) {
      tradeCache.trades = allTrades;
      tradeCache.timestamp = now;
    }
    
    // Ensure allTrades is an array
    if (!Array.isArray(allTrades)) {
      console.error('Expected array of trades but got:', typeof allTrades);
      return [];
    }
    
    // Filter trades for the week
    const tradesForWeek = allTrades.filter(trade => {
      if (!trade || !trade.exitDate) return false;
      
      try {
        const exitDate = new Date(trade.exitDate);
        return isWithinInterval(exitDate, { start: weekStart, end: weekEnd });
      } catch (e) {
        console.error('Error parsing exit date:', e);
        return false;
      }
    });
    
    return tradesForWeek;
  } catch (error) {
    console.error('Error getting trades for week:', error);
    return [];
  }
};
