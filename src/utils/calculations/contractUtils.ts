
/**
 * Utilities for futures contract calculations
 */
import { Trade, COMMON_FUTURES_CONTRACTS } from '@/types';

// Constants
const FUTURES_CONTRACTS_KEY = 'futures_contracts';

/**
 * Get the point value for a futures contract
 */
export function getContractPointValue(trade: Trade): number {
  if (trade.type !== 'futures') {
    return 1;
  }
  
  // If contract details has tickValue directly, use it as the point value
  if (trade.contractDetails?.tickValue) {
    // Ensure the tickValue is properly parsed as a number and has a reasonable value
    const tickValue = Number(trade.contractDetails.tickValue);
    if (tickValue > 0) {
      return tickValue;
    }
  }
  
  // Check for stored custom contracts first
  try {
    const storedContractsJson = localStorage.getItem(FUTURES_CONTRACTS_KEY);
    if (storedContractsJson) {
      const storedContracts = JSON.parse(storedContractsJson);
      const matchedContract = storedContracts.find((c: any) => 
        c.symbol === trade.symbol ||
        (trade.symbol && c.symbol && trade.symbol.includes(c.symbol))
      );
      
      if (matchedContract) {
        console.log(`Using stored contract for ${trade.symbol}: point value $${matchedContract.pointValue}`);
        return matchedContract.pointValue;
      }
    }
  } catch (error) {
    console.warn('Error reading stored contracts:', error);
  }
  
  // Check for Silver specifically (common symbols: SI, SIL, SILVER)
  const isCommonSilverSymbol = 
    trade.symbol?.toUpperCase() === 'SI' || 
    trade.symbol?.toUpperCase() === 'SIL' || 
    trade.symbol?.toUpperCase() === 'SILVER' ||
    trade.symbol?.toUpperCase().startsWith('SI.');
    
  if (isCommonSilverSymbol && !trade.symbol?.includes('MSFT') && !trade.symbol?.includes('CSCO')) {
    console.log('Using standard point value for Silver futures: $5000');
    return 5000; // Default value for Silver futures
  }
  
  // Check common futures contracts for this symbol
  const contractInfo = COMMON_FUTURES_CONTRACTS.find(c => 
    c.symbol === trade.symbol || 
    (trade.symbol && c.symbol && trade.symbol.includes(c.symbol))
  );
  
  if (contractInfo) {
    console.log(`Using standard point value for ${trade.symbol}: $${contractInfo.pointValue}`);
    return contractInfo.pointValue;
  }
  
  // Default fallbacks based on common contracts
  if (trade.symbol?.includes('ES') || trade.symbol === 'SP') {
    return 50; // E-mini S&P 500
  } else if (trade.symbol?.includes('NQ')) {
    return 20; // E-mini Nasdaq 100
  } else if (trade.symbol?.includes('YM')) {
    return 5; // E-mini Dow
  } else if (trade.symbol?.includes('RTY') || trade.symbol?.includes('ER2')) {
    return 50; // E-mini Russell 2000
  } else if (trade.symbol?.includes('GC') || trade.symbol?.includes('GOLD')) {
    return 100; // Gold futures
  } else if (trade.symbol?.includes('CL') || trade.symbol?.includes('OIL')) {
    return 1000; // Crude Oil futures
  } else if (trade.symbol?.includes('ZC') || trade.symbol?.includes('CORN')) {
    return 50; // Corn futures
  } else if (trade.symbol?.includes('ZW') || trade.symbol?.includes('WHEAT')) {
    return 50; // Wheat futures
  } else if (trade.symbol?.includes('ZS') || trade.symbol?.includes('SOYBEAN')) {
    return 50; // Soybeans futures
  } else if (trade.symbol?.includes('6E') || trade.symbol?.includes('EUR')) {
    return 125000; // Euro FX futures
  } else if (trade.symbol?.includes('6J') || trade.symbol?.includes('JPY')) {
    return 12500000; // Japanese Yen futures
  } else if (trade.symbol?.includes('6B') || trade.symbol?.includes('GBP')) {
    return 62500; // British Pound futures
  } else if (trade.symbol?.includes('KC') || trade.symbol?.includes('COFFEE')) {
    return 37500; // Coffee futures
  } else if (trade.symbol?.includes('CT') || trade.symbol?.includes('COTTON')) {
    return 50000; // Cotton futures
  }
  
  console.warn(`No point value found for futures contract ${trade.symbol}, using default of 1000`);
  return 1000; // More reasonable default fallback for unknown contracts
}

/**
 * Calculate the tick value for a futures contract
 */
export function getContractTickValue(trade: Trade): number {
  if (trade.type !== 'futures' || !trade.contractDetails) {
    return 0;
  }
  
  if (trade.contractDetails.tickValue && trade.contractDetails.tickSize) {
    return Number(trade.contractDetails.tickValue) * Number(trade.contractDetails.tickSize);
  }
  
  return 0;
}
