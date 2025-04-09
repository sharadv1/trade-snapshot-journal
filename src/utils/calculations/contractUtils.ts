
/**
 * Utilities for futures contract calculations
 */
import { Trade, COMMON_FUTURES_CONTRACTS } from '@/types';

// Constants
const FUTURES_CONTRACTS_KEY = 'futures_contracts';

/**
 * Get the point value for a futures contract with priority for custom configurations
 */
export function getContractPointValue(trade: Trade): number {
  if (trade.type !== 'futures') {
    return 1;
  }
  
  const normalizedSymbol = trade.symbol?.toUpperCase().trim();
  console.log(`Getting point value for ${normalizedSymbol}`);
  
  // First priority: Check for custom contract configurations from the contract manager
  try {
    const storedContractsJson = localStorage.getItem(FUTURES_CONTRACTS_KEY);
    if (storedContractsJson && trade.symbol) {
      const storedContracts = JSON.parse(storedContractsJson);
      
      // Find exact match for the symbol
      const exactMatch = storedContracts.find((c: any) => 
        c.symbol.toUpperCase() === normalizedSymbol
      );
      
      if (exactMatch && exactMatch.pointValue) {
        console.log(`Using custom contract configuration for ${trade.symbol}: point value $${exactMatch.pointValue}`);
        return Number(exactMatch.pointValue);
      }
    }
  } catch (error) {
    console.warn('Error reading stored contracts:', error);
  }
  
  // Second priority: If contract details has tickValue directly, use it as the point value
  if (trade.contractDetails?.tickValue) {
    // Ensure the tickValue is properly parsed as a number and has a reasonable value
    const tickValue = Number(trade.contractDetails.tickValue);
    if (tickValue > 0) {
      console.log(`Using contract details tick value for ${trade.symbol}: ${tickValue}`);
      return tickValue;
    }
  }
  
  // Third priority: Check common futures contracts for this symbol - improved matching
  const contractInfo = COMMON_FUTURES_CONTRACTS.find(c => {
    const standardSymbol = c.symbol.toUpperCase().trim();
    return standardSymbol === normalizedSymbol;
  });
  
  if (contractInfo) {
    console.log(`Using standard point value for ${trade.symbol}: $${contractInfo.pointValue}`);
    return contractInfo.pointValue;
  }
  
  // Fourth priority: Default fallbacks based on common contracts
  if (normalizedSymbol === 'SI') {
    console.log('SILVER CONTRACT DETECTED: SI - Using $5000 point value');
    return 5000; // Standard Silver futures
  } else if (normalizedSymbol === 'SIL' || normalizedSymbol === 'MSI') {
    console.log('MICRO SILVER CONTRACT DETECTED: SIL - Using $1000 point value');
    return 1000; // Micro Silver futures
  } else if (normalizedSymbol?.includes('ES') || normalizedSymbol === 'SP') {
    return 50; // E-mini S&P 500
  } else if (normalizedSymbol?.includes('NQ')) {
    return 20; // E-mini Nasdaq 100
  } else if (normalizedSymbol?.includes('YM')) {
    return 5; // E-mini Dow
  } else if (normalizedSymbol?.includes('RTY') || normalizedSymbol?.includes('ER2')) {
    return 50; // E-mini Russell 2000
  } else if (normalizedSymbol?.includes('GC') || normalizedSymbol?.includes('GOLD')) {
    return 100; // Gold futures
  } else if (normalizedSymbol?.includes('CL') || normalizedSymbol?.includes('OIL')) {
    return 1000; // Crude Oil futures
  } else if (normalizedSymbol?.includes('ZC') || normalizedSymbol?.includes('CORN')) {
    return 50; // Corn futures
  } else if (normalizedSymbol?.includes('ZW') || normalizedSymbol?.includes('WHEAT')) {
    return 50; // Wheat futures
  } else if (normalizedSymbol?.includes('ZS') || normalizedSymbol?.includes('SOYBEAN')) {
    return 50; // Soybean futures
  } else if (normalizedSymbol?.includes('6E') || normalizedSymbol?.includes('EUR')) {
    return 125000; // Euro FX futures
  } else if (normalizedSymbol?.includes('6J') || normalizedSymbol?.includes('JPY')) {
    return 12500000; // Japanese Yen futures
  } else if (normalizedSymbol?.includes('6B') || normalizedSymbol?.includes('GBP')) {
    return 62500; // British Pound futures
  } else if (normalizedSymbol?.includes('KC') || normalizedSymbol?.includes('COFFEE')) {
    return 37500; // Coffee futures
  } else if (normalizedSymbol?.includes('CT') || normalizedSymbol?.includes('COTTON')) {
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
  
  // First check for custom contract configuration
  try {
    const storedContractsJson = localStorage.getItem(FUTURES_CONTRACTS_KEY);
    if (storedContractsJson && trade.symbol) {
      const storedContracts = JSON.parse(storedContractsJson);
      const customContract = storedContracts.find((c: any) => 
        c.symbol.toUpperCase() === trade.symbol.toUpperCase()
      );
      
      if (customContract && customContract.tickSize && customContract.pointValue) {
        const tickSize = Number(customContract.tickSize);
        const pointValue = Number(customContract.pointValue);
        return tickSize * pointValue;
      }
    }
  } catch (error) {
    console.warn('Error reading stored contracts:', error);
  }
  
  // Fallback to contract details
  if (trade.contractDetails.tickValue && trade.contractDetails.tickSize) {
    return Number(trade.contractDetails.tickValue) * Number(trade.contractDetails.tickSize);
  }
  
  return 0;
}
