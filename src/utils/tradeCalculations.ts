
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
  try {
    const trades = await getTrades();
    
    // Ensure trades is an array before filtering
    if (!Array.isArray(trades)) {
      console.error('Expected array of trades but got:', typeof trades);
      return [];
    }
    
    return trades.filter(trade => {
      try {
        const entryDate = new Date(trade.entryDate);
        return entryDate >= weekStart && entryDate <= weekEnd;
      } catch (error) {
        console.error('Error processing trade date:', error, trade);
        return false;
      }
    }).map(trade => {
      try {
        return {
          ...trade,
          metrics: calculateTradeMetrics(trade)
        };
      } catch (error) {
        console.error('Error calculating metrics for trade:', error, trade);
        // Return trade without metrics if calculation fails
        return {
          ...trade,
          metrics: { profitLoss: 0, rMultiple: 0 }
        };
      }
    });
  } catch (error) {
    console.error('Error in getTradesForWeek:', error);
    return [];
  }
};
