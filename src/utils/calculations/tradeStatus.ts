
/**
 * Utilities for checking trade status
 */
import { Trade, PartialExit } from '@/types';

/**
 * Check if a trade is fully exited through partial exits
 */
export function isTradeFullyExited(trade: Trade): boolean {
  if (!trade.partialExits || trade.partialExits.length === 0) {
    return false;
  }
  
  const totalExitedQuantity = trade.partialExits.reduce(
    (total, exit) => total + exit.quantity, 0
  );
  
  return totalExitedQuantity >= trade.quantity;
}

/**
 * Get the remaining quantity for a trade
 */
export function getRemainingQuantity(trade: Trade): number {
  if (!trade.partialExits || trade.partialExits.length === 0) {
    return trade.quantity;
  }
  
  const totalExitedQuantity = trade.partialExits.reduce(
    (total, exit) => total + exit.quantity, 0
  );
  
  return Math.max(0, trade.quantity - totalExitedQuantity);
}

/**
 * Check if a trade can be reopened
 */
export function canReopenTrade(trade: Trade): boolean {
  return trade.status === 'closed';
}

/**
 * Format a date safely, handling invalid dates
 */
export function formatTradeDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'N/A';
  }
}

/**
 * Format date with time safely
 */
export function formatTradeDateWithTime(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return `${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })} ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  } catch (err) {
    console.error('Error formatting date with time:', err);
    return 'N/A';
  }
}
