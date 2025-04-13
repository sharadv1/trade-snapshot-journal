
import { Trade, PartialExit } from '@/types';

/**
 * Calculate the remaining quantity for a trade after partial exits
 */
export function getRemainingQuantity(trade: Trade): number {
  if (!trade || !trade.quantity) return 0;
  
  // Convert quantity to number if it's a string
  const initialQuantity = typeof trade.quantity === 'string' ? 
    parseFloat(trade.quantity) : trade.quantity;
  
  // If no partial exits, return full quantity
  if (!trade.partialExits || trade.partialExits.length === 0) {
    return initialQuantity;
  }
  
  // Sum up the quantity of all partial exits
  const exitedQuantity = trade.partialExits.reduce((sum, exit) => {
    const exitQuantity = typeof exit.quantity === 'string' ? 
      parseFloat(exit.quantity.toString()) : exit.quantity;
    return sum + exitQuantity;
  }, 0);
  
  // Return the remaining quantity, minimum 0
  return Math.max(initialQuantity - exitedQuantity, 0);
}

/**
 * Check if a trade is fully exited through partial exits
 */
export function isTradeFullyExited(trade: Trade): boolean {
  const remainingQty = getRemainingQuantity(trade);
  return remainingQty <= 0;
}

/**
 * Format a trade date (without time)
 */
export function formatTradeDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a trade date with time
 */
export function formatTradeDateWithTime(dateString?: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date with time:', error);
    return 'Invalid date';
  }
}
