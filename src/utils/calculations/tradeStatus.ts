
/**
 * Utilities for checking trade status
 */
import { Trade } from '@/types';

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
