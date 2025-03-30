
/**
 * Utilities for futures contract calculations
 */
import { Trade, COMMON_FUTURES_CONTRACTS } from '@/types';

/**
 * Get the point value for a futures contract
 */
export function getContractPointValue(trade: Trade): number {
  if (trade.type !== 'futures' || !trade.contractDetails) {
    return 1;
  }
  
  // If contract details has tickValue and tickSize, calculate pointValue
  if (trade.contractDetails.tickValue && trade.contractDetails.tickSize) {
    return trade.contractDetails.tickValue / trade.contractDetails.tickSize;
  }
  
  // Check common futures contracts for this symbol
  const contractInfo = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === trade.symbol);
  if (contractInfo) {
    return contractInfo.pointValue;
  }
  
  return 1; // Default fallback
}
