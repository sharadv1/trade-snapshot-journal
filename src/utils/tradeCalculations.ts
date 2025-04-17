
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
  currentRequest: null as string | null,
  pendingRequests: new Set<string>(),
  lastCacheInvalidation: 0
};

// Clear cache when necessary
const checkAndInvalidateCache = () => {
  const now = Date.now();
  // Invalidate the cache every 30 seconds to ensure fresh data
  if (now - tradeCache.lastCacheInvalidation > 30000) {
    tradeCache.trades = null;
    tradeCache.timestamp = 0;
    tradeCache.weekCache.clear();
    tradeCache.lastCacheInvalidation = now;
    console.log('Trade cache invalidated due to age');
  }
};

/**
 * Get trades for a specific week with enhanced caching
 * Optimized to prevent redundant calculations and infinite loops
 */
export const getTradesForWeek = async (weekStart: Date, weekEnd: Date): Promise<TradeWithMetrics[]> => {
  try {
    // Validate inputs first to prevent issues
    if (!weekStart || !weekEnd || !(weekStart instanceof Date) || !(weekEnd instanceof Date)) {
      console.error('Invalid week parameters:', { weekStart, weekEnd });
      return [];
    }
    
    // Periodically invalidate cache to ensure fresh data
    checkAndInvalidateCache();
    
    // Create a cache key for this specific week request
    const cacheKey = `${weekStart.toISOString()}_${weekEnd.toISOString()}`;
    
    // Force fresh data when explicitly requested for trade issues
    // This helps fix the trade data display problems
    tradeCache.trades = null;
    
    // Get all trades with metrics (always get fresh data to fix display issues)
    const allTrades = getTradesWithMetrics();
    
    // Update cache
    tradeCache.trades = allTrades;
    tradeCache.timestamp = Date.now();
    
    // Ensure allTrades is an array
    if (!Array.isArray(allTrades)) {
      console.error('Expected array of trades but got:', typeof allTrades);
      return [];
    }
    
    console.log(`Filtering ${allTrades.length} trades for week ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
    
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
    console.log(`Loaded ${tradesForWeek.length} trades for week ${cacheKey}`);
    
    return tradesForWeek;
  } catch (error) {
    console.error('Error getting trades for week:', error);
    return [];
  }
};

// Add a function to clear cache when needed (e.g., after trade updates)
export const clearTradeCache = () => {
  tradeCache.trades = null;
  tradeCache.timestamp = 0;
  tradeCache.weekCache.clear();
  tradeCache.currentRequest = null;
  tradeCache.pendingRequests.clear();
  tradeCache.lastCacheInvalidation = Date.now();
  console.log('Trade cache manually cleared');
};
