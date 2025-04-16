
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

// Enhanced cache with timestamp and request identifier
const tradeCache = {
  trades: null as TradeWithMetrics[] | null,
  timestamp: 0,
  weekCache: new Map<string, TradeWithMetrics[]>(),
  currentRequest: null as string | null
};

// Function to get trades for a specific week with enhanced caching
export const getTradesForWeek = async (weekStart: Date, weekEnd: Date): Promise<TradeWithMetrics[]> => {
  try {
    // Create a cache key for this specific week request
    const cacheKey = `${weekStart.toISOString()}_${weekEnd.toISOString()}`;
    
    // Check if we've already cached this specific week's data
    if (tradeCache.weekCache.has(cacheKey)) {
      return tradeCache.weekCache.get(cacheKey) || [];
    }
    
    // If we're making this exact request already, return empty to prevent loop
    if (tradeCache.currentRequest === cacheKey) {
      console.log('Preventing recursive trade calculation for the same week');
      return [];
    }
    
    // Set the current request to prevent loops
    tradeCache.currentRequest = cacheKey;
    
    // Reuse cached trades if they were fetched in the last 5 seconds
    const now = Date.now();
    const cacheIsValid = tradeCache.trades !== null && (now - tradeCache.timestamp) < 5000;
    
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
      tradeCache.currentRequest = null;
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
    
    // Cache the results for this specific week
    tradeCache.weekCache.set(cacheKey, tradesForWeek);
    console.log(`Loaded ${tradesForWeek.length} trades for week`);
    
    // Clear the current request
    tradeCache.currentRequest = null;
    
    return tradesForWeek;
  } catch (error) {
    console.error('Error getting trades for week:', error);
    tradeCache.currentRequest = null;
    return [];
  }
};

// Add a function to clear cache when needed (e.g., after trade updates)
export const clearTradeCache = () => {
  tradeCache.trades = null;
  tradeCache.timestamp = 0;
  tradeCache.weekCache.clear();
  tradeCache.currentRequest = null;
};
