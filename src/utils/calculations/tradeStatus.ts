
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
