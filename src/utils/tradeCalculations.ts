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
  monthCache: new Map<string, TradeWithMetrics[]>(), // Add month cache
  lastCacheInvalidation: 0,
  lastFetch: 0,
  fetchLock: false,
  debugMode: true  // Set to true by default to help debug
};

/**
 * Get trades for a specific week with enhanced caching
 */
export const getTradesForWeek = (weekStart: Date, weekEnd: Date): TradeWithMetrics[] => {
  if (tradeCache.debugMode) {
    console.log(`getTradesForWeek called for ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
  }
  
  try {
    // Validate inputs first to prevent issues
    if (!weekStart || !weekEnd || !(weekStart instanceof Date) || !(weekEnd instanceof Date)) {
      console.error('Invalid week parameters:', { weekStart, weekEnd });
      return [];
    }

    // Create a cache key for this specific week request
    const cacheKey = `${weekStart.toISOString()}_${weekEnd.toISOString()}`;

    // Only get trades fresh each time - no caching or reuse
    if (tradeCache.debugMode) console.log('Forcing fresh trade data fetch');
    
    const allTrades = getTradesWithMetrics();
    tradeCache.trades = allTrades;
    tradeCache.timestamp = Date.now();

    // Ensure allTrades is an array
    if (!Array.isArray(allTrades)) {
      console.error('Expected array of trades but got:', typeof allTrades);
      return [];
    }
    
    if (tradeCache.debugMode) console.log(`Got ${allTrades.length} total trades, filtering for week`);
    
    // Filter trades for the week - CRITICAL FIX: Make sure we're filtering correctly
    const tradesForWeek = allTrades.filter(trade => {
      if (!trade || !trade.exitDate) return false;
      
      try {
        // Parse the exitDate correctly
        const exitDate = new Date(trade.exitDate);
        
        // Check if the trade's exit date is within the specified week
        const isInWeek = isWithinInterval(exitDate, { start: weekStart, end: weekEnd });
        
        if (tradeCache.debugMode && isInWeek) {
          console.log(`Trade ${trade.id} (${trade.symbol}) is in the selected week`);
        }
        
        return isInWeek;
      } catch (e) {
        console.error('Error parsing exit date:', e);
        return false;
      }
    });
    
    // Store in week cache
    tradeCache.weekCache.set(cacheKey, tradesForWeek);
    
    console.log(`Found ${tradesForWeek.length} trades for week ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
    
    return tradesForWeek;
  } catch (error) {
    console.error('Error getting trades for week:', error);
    return [];
  }
};

/**
 * Get trades for a specific month with enhanced caching
 */
export const getTradesForMonth = (monthStart: Date, monthEnd: Date): TradeWithMetrics[] => {
  if (tradeCache.debugMode) {
    console.log(`getTradesForMonth called for ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
  }
  
  try {
    // Validate inputs first to prevent issues
    if (!monthStart || !monthEnd || !(monthStart instanceof Date) || !(monthEnd instanceof Date)) {
      console.error('Invalid month parameters:', { monthStart, monthEnd });
      return [];
    }

    // Create a cache key for this specific month request
    const cacheKey = `${monthStart.toISOString()}_${monthEnd.toISOString()}`;

    // Only get trades fresh each time - no caching or reuse
    if (tradeCache.debugMode) console.log('Forcing fresh trade data fetch');
    
    const allTrades = getTradesWithMetrics();
    tradeCache.trades = allTrades;
    tradeCache.timestamp = Date.now();

    // Ensure allTrades is an array
    if (!Array.isArray(allTrades)) {
      console.error('Expected array of trades but got:', typeof allTrades);
      return [];
    }
    
    if (tradeCache.debugMode) console.log(`Got ${allTrades.length} total trades, filtering for month`);
    
    // Filter trades for the month
    const tradesForMonth = allTrades.filter(trade => {
      if (!trade || !trade.exitDate) return false;
      
      try {
        // Parse the exitDate correctly
        const exitDate = new Date(trade.exitDate);
        
        // Check if the trade's exit date is within the specified month
        const isInMonth = exitDate >= monthStart && exitDate <= monthEnd;
        
        if (tradeCache.debugMode && isInMonth) {
          console.log(`Trade ${trade.id} (${trade.symbol}) is in the selected month`);
        }
        
        return isInMonth;
      } catch (e) {
        console.error('Error parsing exit date:', e);
        return false;
      }
    });
    
    // Store in month cache
    tradeCache.monthCache.set(cacheKey, tradesForMonth);
    
    console.log(`Found ${tradesForMonth.length} trades for month ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
    
    return tradesForMonth;
  } catch (error) {
    console.error('Error getting trades for month:', error);
    return [];
  }
};

// Add a function to clear cache when needed (e.g., after trade updates)
export const clearTradeCache = () => {
  tradeCache.trades = null;
  tradeCache.timestamp = 0;
  tradeCache.weekCache.clear();
  tradeCache.monthCache.clear();
  tradeCache.lastCacheInvalidation = Date.now();
  tradeCache.fetchLock = false;
  console.log('Trade cache manually cleared');
};

// Add a function to temporarily prevent fetching during navigation
export const preventTradeFetching = (prevent: boolean) => {
  tradeCache.fetchLock = prevent;
  console.log(`Trade fetching prevention ${prevent ? 'enabled' : 'disabled'}`);
};

// Set debug mode
export const setTradeDebug = (debug: boolean) => {
  tradeCache.debugMode = debug;
};
