
/**
 * Utilities for futures contract calculations
 */
import { Trade, COMMON_FUTURES_CONTRACTS } from '@/types';

/**
 * Get the point value for a futures contract
 */
export function getContractPointValue(trade: Trade): number {
  if (trade.type !== 'futures') {
    return 1;
  }
  
  // If contract details has tickValue directly, use it as the point value
  if (trade.contractDetails?.tickValue) {
    return trade.contractDetails.tickValue;
  }
  
  // Check common futures contracts for this symbol
  const contractInfo = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === trade.symbol);
  if (contractInfo) {
    console.log(`Using standard point value for ${trade.symbol}: $${contractInfo.pointValue}`);
    return contractInfo.pointValue;
  }
  
  console.warn(`No point value found for futures contract ${trade.symbol}, using default of 1`);
  return 1; // Default fallback
}

/**
 * Calculate the tick value for a futures contract
 */
export function getContractTickValue(trade: Trade): number {
  if (trade.type !== 'futures' || !trade.contractDetails) {
    return 0;
  }
  
  if (trade.contractDetails.tickValue && trade.contractDetails.tickSize) {
    return trade.contractDetails.tickValue * trade.contractDetails.tickSize;
  }
  
  return 0;
}
