
/**
 * Re-export all calculation functions from their modular structure
 * This file is kept for backward compatibility
 */

// Re-export everything from the new modular structure
export * from './calculations';

// Re-export formatters for backward compatibility
export { formatCurrency, formatPercentage } from './calculations/formatters';

// Additional exports specifically for the Weekly Journal
import { getTrades } from './storage/storageCore';
import { calculateTradeMetrics } from './calculations';

export const getTradesForWeek = async (weekStart: Date, weekEnd: Date): Promise<any[]> => {
  const trades = await getTrades();
  
  return trades.filter(trade => {
    const entryDate = new Date(trade.entryDate);
    return entryDate >= weekStart && entryDate <= weekEnd;
  }).map(trade => ({
    ...trade,
    metrics: calculateTradeMetrics(trade)
  }));
};
