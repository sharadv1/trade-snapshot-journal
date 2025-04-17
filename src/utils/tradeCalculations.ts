
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
  lastFetch: 0,
  fetchLock: false,
  debugMode: false
};

/**
 * Get trades for a specific week with enhanced caching
 */
export const getTradesForWeek = (weekStart: Date, weekEnd: Date): TradeWithMetrics[] => {
  try {
    // Validate inputs first to prevent issues
    if (!weekStart || !weekEnd || !(weekStart instanceof Date) || !(weekEnd instanceof Date)) {
      console.error('Invalid week parameters:', { weekStart, weekEnd });
      return [];
    }
    
    // Create a cache key for this specific week request
    const cacheKey = `${weekStart.toISOString()}_${weekEnd.toISOString()}`;
    
    // Check if we've fetched too recently (prevent rapid loops)
    const now = Date.now();
    if (now - tradeCache.lastFetch < 300 && tradeCache.fetchLock) {
      if (tradeCache.debugMode) console.log('Throttling fetch requests - using cached data');
      
      // Return cached data if available
      const cachedTrades = tradeCache.weekCache.get(cacheKey);
      return cachedTrades || [];
    }
    
    // Update fetch timestamp
    tradeCache.lastFetch = now;
    
    // Check if we have cached results for this week
    if (tradeCache.weekCache.has(cacheKey)) {
      if (tradeCache.debugMode) console.log(`Using cached trades for week ${cacheKey}`);
      return tradeCache.weekCache.get(cacheKey) || [];
    }
    
    // Set lock to prevent concurrent fetches
    if (tradeCache.fetchLock) {
      if (tradeCache.debugMode) console.log('Fetch lock active, returning empty array');
      return [];
    }
    
    // Acquire lock
    tradeCache.fetchLock = true;
    
    try {
      // If we don't have all trades yet or the cache is old, fetch them
      if (!tradeCache.trades || now - tradeCache.timestamp > 60000) {
        if (tradeCache.debugMode) console.log('Fetching fresh trade data');
        tradeCache.trades = getTradesWithMetrics();
        tradeCache.timestamp = now;
      }
      
      // Ensure allTrades is an array
      const allTrades = tradeCache.trades || [];
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
      
      // Cache the results for this specific week
      tradeCache.weekCache.set(cacheKey, tradesForWeek);
      
      if (tradeCache.debugMode) {
        console.log(`Found ${tradesForWeek.length} trades for week`);
      }
      
      return tradesForWeek;
    } finally {
      // Release lock after a small delay to prevent rapid re-execution
      setTimeout(() => {
        tradeCache.fetchLock = false;
      }, 300);
    }
  } catch (error) {
    console.error('Error getting trades for week:', error);
    // Release lock in case of error
    setTimeout(() => {
      tradeCache.fetchLock = false;
    }, 300);
    return [];
  }
};

// Add a function to clear cache when needed (e.g., after trade updates)
export const clearTradeCache = () => {
  tradeCache.trades = null;
  tradeCache.timestamp = 0;
  tradeCache.weekCache.clear();
  tradeCache.lastCacheInvalidation = Date.now();
  tradeCache.fetchLock = false;
  console.log('Trade cache manually cleared');
};

// Add a function to temporarily prevent fetching during navigation
export const preventTradeFetching = (prevent: boolean) => {
  // Only log when changing the state to reduce noise
  if (tradeCache.fetchLock !== prevent) {
    console.log(`Trade fetching prevention ${prevent ? 'enabled' : 'disabled'}`);
    tradeCache.fetchLock = prevent;
  }
};

// Set debug mode
export const setTradeDebug = (debug: boolean) => {
  tradeCache.debugMode = debug;
};
