
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
    
    // Prevent duplicate in-flight requests
    if (tradeCache.pendingRequests.has(cacheKey)) {
      console.log(`Request already in progress for week ${cacheKey}`);
      return tradeCache.weekCache.get(cacheKey) || [];
    }
    
    // Check if we've already cached this specific week's data
    if (tradeCache.weekCache.has(cacheKey)) {
      const cachedResult = tradeCache.weekCache.get(cacheKey);
      if (cachedResult) {
        console.log(`Using cached data for week ${cacheKey}`);
        return cachedResult;
      }
    }
    
    // If we're making this exact request already, return empty to prevent loop
    if (tradeCache.currentRequest === cacheKey) {
      console.log('Preventing recursive trade calculation for the same week');
      return [];
    }
    
    // Track this request
    tradeCache.currentRequest = cacheKey;
    tradeCache.pendingRequests.add(cacheKey);
    
    try {
      // Reuse cached trades if they were fetched in the last 10 seconds
      const now = Date.now();
      const cacheIsValid = tradeCache.trades !== null && (now - tradeCache.timestamp) < 10000;
      
      // Get all trades with metrics (use cache if valid)
      const allTrades = cacheIsValid ? tradeCache.trades : getTradesWithMetrics();
      
      // Update cache if needed
      if (!cacheIsValid && allTrades) {
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
      
      // Cache the results for this specific week
      tradeCache.weekCache.set(cacheKey, tradesForWeek);
      console.log(`Loaded ${tradesForWeek.length} trades for week ${cacheKey}`);
      
      return tradesForWeek;
    } finally {
      // Always clean up request tracking
      tradeCache.currentRequest = null;
      tradeCache.pendingRequests.delete(cacheKey);
    }
  } catch (error) {
    console.error('Error getting trades for week:', error);
    // Remove from pending requests to allow retries
    if (weekStart && weekEnd) {
      tradeCache.pendingRequests.delete(`${weekStart.toISOString()}_${weekEnd.toISOString()}`);
    }
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
