
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
  lastCacheInvalidation: 0,
  currentlyFetching: false,
  preventFetching: false,
  debug: false
};

// Clear cache when necessary, but not too frequently
const checkAndInvalidateCache = () => {
  const now = Date.now();
  // Invalidate the cache every 60 seconds to ensure fresh data while preventing rapid loops
  if (now - tradeCache.lastCacheInvalidation > 60000) {
    tradeCache.trades = null;
    tradeCache.timestamp = 0;
    tradeCache.weekCache.clear();
    tradeCache.lastCacheInvalidation = now;
    if (tradeCache.debug) console.log('Trade cache invalidated due to age');
  }
};

/**
 * Get trades for a specific week with enhanced caching
 * Optimized to prevent redundant calculations and infinite loops
 */
export const getTradesForWeek = (weekStart: Date, weekEnd: Date): TradeWithMetrics[] => {
  try {
    // Validate inputs first to prevent issues
    if (!weekStart || !weekEnd || !(weekStart instanceof Date) || !(weekEnd instanceof Date)) {
      console.error('Invalid week parameters:', { weekStart, weekEnd });
      return [];
    }
    
    // Safety check for recurring calls - this is critical to prevent infinite loops
    if (tradeCache.preventFetching) {
      if (tradeCache.debug) console.log('Fetch prevention active, returning empty data');
      // Try to return cached data if available
      const cacheKey = `${weekStart.toISOString()}_${weekEnd.toISOString()}`;
      const cachedTrades = tradeCache.weekCache.get(cacheKey);
      return cachedTrades || [];
    }
    
    // Periodically invalidate cache to ensure fresh data, but not too frequently
    checkAndInvalidateCache();
    
    // Create a cache key for this specific week request
    const cacheKey = `${weekStart.toISOString()}_${weekEnd.toISOString()}`;
    
    // Check if we have cached results for this week
    if (tradeCache.weekCache.has(cacheKey)) {
      if (tradeCache.debug) console.log(`Using cached trades for week ${cacheKey}`);
      return tradeCache.weekCache.get(cacheKey) || [];
    }
    
    // Prevent concurrent fetches - this is critical
    if (tradeCache.currentlyFetching) {
      if (tradeCache.debug) console.log('Already fetching trade data, returning empty array');
      return [];
    }
    
    // Set fetching flag to prevent concurrent requests
    tradeCache.currentlyFetching = true;
    
    try {
      // If we don't have all trades yet or the cache is old, fetch them
      if (!tradeCache.trades) {
        if (tradeCache.debug) console.log('Fetching fresh trade data');
        tradeCache.trades = getTradesWithMetrics();
        tradeCache.timestamp = Date.now();
      }
      
      // Ensure allTrades is an array
      const allTrades = tradeCache.trades || [];
      if (!Array.isArray(allTrades)) {
        console.error('Expected array of trades but got:', typeof allTrades);
        return [];
      }
      
      if (tradeCache.debug) console.log(`Filtering ${allTrades.length} trades for week ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
      
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
      console.log(`Found ${tradesForWeek.length} trades for week`);
      
      return tradesForWeek;
    } finally {
      // Always reset the fetching flag to prevent deadlocks
      setTimeout(() => {
        tradeCache.currentlyFetching = false;
      }, 100); // Small delay to prevent rapid consecutive calls
    }
  } catch (error) {
    console.error('Error getting trades for week:', error);
    tradeCache.currentlyFetching = false;
    return [];
  }
};

// Add a function to clear cache when needed (e.g., after trade updates)
export const clearTradeCache = () => {
  tradeCache.trades = null;
  tradeCache.timestamp = 0;
  tradeCache.weekCache.clear();
  tradeCache.lastCacheInvalidation = Date.now();
  tradeCache.currentlyFetching = false;
  console.log('Trade cache manually cleared');
};

// Add a function to temporarily prevent fetching during navigation
export const preventTradeFetching = (prevent: boolean) => {
  tradeCache.preventFetching = prevent;
  if (tradeCache.debug) console.log(`Trade fetching prevention ${prevent ? 'enabled' : 'disabled'}`);
};

// Set debug mode
export const setTradeDebug = (debug: boolean) => {
  tradeCache.debug = debug;
};
