
import { Trade } from '@/types';
import { getContractPointValue } from './contractUtils';

// Constants
const FUTURES_CONTRACTS_KEY = 'futures_contracts';

export const getTradeMetrics = (trade: Trade) => {
  // Initialize with fallback values to prevent undefined errors
  let profitLoss = 0;
  let riskRewardRatio = 0;
  let rMultiple = 0;
  let profitLossPercentage = 0;
  let riskedAmount = 0;
  let initialRiskedAmount = 0;
  let maxPotentialGain = 0;
  let calculationExplanation = '';
  let weightedExitPrice: number | undefined = undefined;
  let latestExitDate: string | undefined = undefined;
  let maxFavorableExcursion = 0; // How much the trade went in your favor
  let maxAdverseExcursion = 0; // How much heat the trade took
  let capturedProfitPercent = 0; // What percentage of the max move you captured

  // Validate essential properties
  if (!trade) {
    calculationExplanation += 'Trade object is missing or invalid. ';
    return {
      profitLoss,
      riskRewardRatio,
      rMultiple,
      profitLossPercentage,
      riskedAmount,
      initialRiskedAmount,
      maxPotentialGain,
      calculationExplanation,
      weightedExitPrice,
      latestExitDate,
      maxFavorableExcursion,
      maxAdverseExcursion,
      capturedProfitPercent
    };
  }

  // Ensure trade.direction exists and is valid
  const direction = trade.direction || 'long';
  
  // Safety check for required fields
  if (!trade.entryPrice) {
    calculationExplanation += 'Entry price is missing. ';
    return {
      profitLoss,
      riskRewardRatio,
      rMultiple,
      profitLossPercentage,
      riskedAmount,
      initialRiskedAmount,
      maxPotentialGain,
      calculationExplanation,
      weightedExitPrice,
      latestExitDate,
      maxFavorableExcursion,
      maxAdverseExcursion,
      capturedProfitPercent
    };
  }

  // We'll check for initialStopLoss first, and only if that's missing, we'll check for stopLoss
  // This way, we can still calculate metrics even if the current stop loss is missing
  if (!trade.initialStopLoss && !trade.stopLoss) {
    calculationExplanation += 'Both initial and current stop loss are missing. ';
    return {
      profitLoss,
      riskRewardRatio,
      rMultiple,
      profitLossPercentage,
      riskedAmount,
      initialRiskedAmount,
      maxPotentialGain,
      calculationExplanation,
      weightedExitPrice,
      latestExitDate,
      maxFavorableExcursion,
      maxAdverseExcursion,
      capturedProfitPercent
    };
  }

  // Get custom contract details if available
  const getCustomContractDetails = () => {
    if (!trade.symbol || trade.type !== 'futures') return null;
    
    try {
      const storedContractsJson = localStorage.getItem(FUTURES_CONTRACTS_KEY);
      if (storedContractsJson) {
        const storedContracts = JSON.parse(storedContractsJson);
        // Ensure we have an array before using find
        if (Array.isArray(storedContracts)) {
          return storedContracts.find((c: any) => 
            c && c.symbol && trade.symbol && 
            c.symbol.toUpperCase() === trade.symbol.toUpperCase()
          );
        }
        return null;
      }
    } catch (error) {
      console.error('Error reading stored contracts:', error);
    }
    return null;
  };

  // Get point value for futures contract - do this early to ensure consistent usage
  let pointValue = 1;
  const customContract = getCustomContractDetails();
  
  if (trade.type === 'futures') {
    // First priority: custom contract configurations
    if (customContract && customContract.pointValue) {
      pointValue = Number(customContract.pointValue);
      console.log(`Metrics calculation for ${trade.symbol}: using custom configured point value $${pointValue}`);
    }
    // Second priority: contract details saved with the trade
    else if (trade.contractDetails?.tickValue && Number(trade.contractDetails.tickValue) > 0) {
      pointValue = Number(trade.contractDetails.tickValue);
      console.log(`Metrics calculation for ${trade.symbol}: using stored point value ${pointValue}`);
    }
    // Third priority: calculate from utility function
    else {
      pointValue = getContractPointValue(trade);
      console.log(`Metrics calculation for ${trade.symbol}: using calculated point value ${pointValue}`);
    }
  }

  // Safely parse numeric values from trade data
  const safeParseFloat = (value: any, defaultValue = 0): number => {
    if (value === undefined || value === null) return defaultValue;
    
    // Handle string parsing safely
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    
    // Handle number directly
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    return defaultValue;
  };
  
  const calculatePartialExits = () => {
    if (!trade.partialExits || trade.partialExits.length === 0) {
      return;
    }

    let totalQuantityExited = 0;
    let weightedSum = 0;
    let runningProfitLoss = 0;

    trade.partialExits.forEach(exit => {
      if (exit.exitPrice && exit.quantity) {
        const quantity = safeParseFloat(exit.quantity);
        const exitPrice = safeParseFloat(exit.exitPrice);
        const entryPrice = safeParseFloat(trade.entryPrice);

        const tradeDirectionMultiplier = direction === 'long' ? 1 : -1;
        
        // Calculate P&L with point value for futures
        let exitProfitLoss = (exitPrice - entryPrice) * quantity * tradeDirectionMultiplier;
        if (trade.type === 'futures') {
          exitProfitLoss = exitProfitLoss * pointValue;
        }

        runningProfitLoss += exitProfitLoss;
        weightedSum += exitPrice * quantity;
        totalQuantityExited += quantity;
      }
    });

    if (totalQuantityExited > 0) {
      weightedExitPrice = weightedSum / totalQuantityExited;
      profitLoss = runningProfitLoss;
      latestExitDate = trade.partialExits[trade.partialExits.length - 1].exitDate;
    }
  };

  if (trade.partialExits && trade.partialExits.length > 0) {
    calculatePartialExits();
  } else if (trade.exitPrice && trade.quantity) {
    const quantity = safeParseFloat(trade.quantity);
    const entryPrice = safeParseFloat(trade.entryPrice);
    const exitPrice = safeParseFloat(trade.exitPrice);

    // Calculate P&L properly accounting for direction
    const tradeDirectionMultiplier = direction === 'long' ? 1 : -1;
    
    // Calculate P&L with point value for futures
    let exitProfitLoss = (exitPrice - entryPrice) * quantity * tradeDirectionMultiplier;
    if (trade.type === 'futures') {
      exitProfitLoss = exitProfitLoss * pointValue;
    }
    
    profitLoss = exitProfitLoss;
    weightedExitPrice = exitPrice;
    latestExitDate = trade.exitDate;
  }

  // Parse numeric values
  const entryValue = safeParseFloat(trade.entryPrice);
  
  // CHANGE: Prioritize initialStopLoss for calculations if available, otherwise fall back to stopLoss
  const stopLossValue = trade.stopLoss ? safeParseFloat(trade.stopLoss) : 0;
  const initialStopLossValue = trade.initialStopLoss ? safeParseFloat(trade.initialStopLoss) : stopLossValue;
  
  // Calculate risk based on direction - CRITICAL FOR SHORT POSITIONS
  const isLong = direction === 'long';
  let riskedAmountPerUnit = 0;
  
  if (isLong) {
    // For long: risk = entry - stop (if stop < entry)
    if (stopLossValue < entryValue) {
      riskedAmountPerUnit = entryValue - stopLossValue;
    } else {
      riskedAmountPerUnit = 0;
      calculationExplanation += `Warning: Stop loss (${stopLossValue}) is above entry price (${entryValue}) for a long position. `;
    }
  } else {
    // For short: risk = stop - entry (if stop > entry)
    if (stopLossValue > entryValue) {
      riskedAmountPerUnit = stopLossValue - entryValue;
    } else {
      riskedAmountPerUnit = 0;
      calculationExplanation += `Warning: Stop loss (${stopLossValue}) is below entry price (${entryValue}) for a short position. `;
    }
  }
  
  // Calculate INITIAL risk per share/contract using initialStopLoss (NEW APPROACH)
  let initialRiskedAmountPerUnit = 0;
  
  // IMPORTANT CHANGE: Always use initialStopLoss if available for R multiple calculations
  if (initialStopLossValue) {
    if (isLong) {
      // For long: risk = entry - stop (if stop < entry)
      if (initialStopLossValue < entryValue) {
        initialRiskedAmountPerUnit = entryValue - initialStopLossValue;
      } else {
        initialRiskedAmountPerUnit = 0;
        calculationExplanation += `Warning: Initial stop loss (${initialStopLossValue}) is above entry price (${entryValue}) for a long position. `;
      }
    } else {
      // For short: risk = stop - entry (if stop > entry)
      if (initialStopLossValue > entryValue) {
        initialRiskedAmountPerUnit = initialStopLossValue - entryValue;
      } else {
        initialRiskedAmountPerUnit = 0;
        calculationExplanation += `Warning: Initial stop loss (${initialStopLossValue}) is below entry price (${entryValue}) for a short position. `;
      }
    }
  } else {
    // Only if initialStopLoss is not available, use current stopLoss
    initialRiskedAmountPerUnit = riskedAmountPerUnit;
  }
  
  // Apply contract multiplier for futures
  if (trade.type === 'futures') {
    riskedAmountPerUnit = riskedAmountPerUnit * pointValue;
    initialRiskedAmountPerUnit = initialRiskedAmountPerUnit * pointValue;
    
    if (customContract) {
      calculationExplanation += `Using custom contract settings: $${pointValue} point value. `;
    } else if (trade.contractDetails?.tickValue) {
      calculationExplanation += `Using contract details with point value: $${pointValue}. `;
    }
  }
  
  // Calculate actual risked amount (per unit * quantity)
  const quantity = safeParseFloat(trade.quantity);
  riskedAmount = riskedAmountPerUnit * quantity;
  initialRiskedAmount = initialRiskedAmountPerUnit * quantity;

  // Handle take profit calculations - CRITICAL FOR SHORT POSITIONS
  if (trade.takeProfit) {
    const takeProfitValue = safeParseFloat(trade.takeProfit);
    
    let maxGainPerUnit = 0;
    
    if (isLong) {
      // For long: gain = takeProfit - entry (if takeProfit > entry)
      if (takeProfitValue > entryValue) {
        maxGainPerUnit = takeProfitValue - entryValue;
      } else {
        maxGainPerUnit = 0;
        calculationExplanation += `Warning: Take profit (${takeProfitValue}) is below entry price (${entryValue}) for a long position. `;
      }
    } else {
      // For short: gain = entry - takeProfit (if takeProfit < entry)
      if (takeProfitValue < entryValue) {
        maxGainPerUnit = entryValue - takeProfitValue;
      } else {
        maxGainPerUnit = 0;
        calculationExplanation += `Warning: Take profit (${takeProfitValue}) is above entry price (${entryValue}) for a short position. `;
      }
    }
    
    // Apply contract multiplier for futures
    if (trade.type === 'futures') {
      maxGainPerUnit = maxGainPerUnit * pointValue;
    }
    
    maxPotentialGain = maxGainPerUnit * quantity;
    
    // Use initial risked amount for R:R calculations 
    if (initialRiskedAmount > 0 && maxPotentialGain > 0) {
      riskRewardRatio = maxPotentialGain / initialRiskedAmount;
    }
  }

  // Calculate the maximum favorable and adverse excursions if they exist - CRITICAL FOR SHORT POSITIONS
  if (trade.maxFavorablePrice && trade.entryPrice) {
    const maxFavPrice = safeParseFloat(trade.maxFavorablePrice);
    
    // Calculate direction multiplier considering long vs short
    let favorableMove = 0;
    
    if (isLong) {
      // For long: maxFavPrice > entryPrice is good
      if (maxFavPrice > entryValue) {
        favorableMove = maxFavPrice - entryValue;
      }
    } else {
      // For short: maxFavPrice < entryPrice is good
      if (maxFavPrice < entryValue) {
        favorableMove = entryValue - maxFavPrice;
      }
    }
    
    // Apply contract multiplier for futures
    if (trade.type === 'futures') {
      favorableMove = favorableMove * pointValue;
    }
    
    // Ensure max favorable excursion is positive (it's the maximum price movement in your favor)
    maxFavorableExcursion = favorableMove * quantity;
    
    // Calculate the percentage of max move captured if trade is closed
    if (trade.status === 'closed' && weightedExitPrice && maxFavorableExcursion > 0) {
      let actualMove = 0;
      
      if (isLong) {
        actualMove = weightedExitPrice > entryValue ? weightedExitPrice - entryValue : 0;
      } else {
        actualMove = weightedExitPrice < entryValue ? entryValue - weightedExitPrice : 0;
      }
      
      const actualPL = actualMove * (trade.type === 'futures' ? pointValue : 1) * quantity;
      
      if (actualPL > 0 && maxFavorableExcursion > 0) {
        capturedProfitPercent = (actualPL / maxFavorableExcursion) * 100;
        
        // Ensure percentage is between 0 and 100
        capturedProfitPercent = Math.max(0, Math.min(100, capturedProfitPercent));
      }
    }
  }
  
  if (trade.maxAdversePrice && trade.entryPrice) {
    const maxAdvPrice = safeParseFloat(trade.maxAdversePrice);
    
    let adverseMove = 0;
    
    if (isLong) {
      // For long: price drop is adverse
      if (maxAdvPrice < entryValue) {
        adverseMove = entryValue - maxAdvPrice;
      }
    } else {
      // For short: price rise is adverse
      if (maxAdvPrice > entryValue) {
        adverseMove = maxAdvPrice - entryValue;
      }
    }
    
    // Apply contract multiplier for futures
    if (trade.type === 'futures') {
      adverseMove = adverseMove * pointValue;
    }
    
    // Ensure max adverse excursion is positive (it's the maximum adverse movement against your position)
    maxAdverseExcursion = adverseMove * quantity;
  }

  // For open trades, calculate the rMultiple based on current price or last close
  if (trade.status === 'open') {
    // If we have partial exits, we can calculate a partial r-multiple
    if (profitLoss !== 0 && initialRiskedAmount > 0) {
      rMultiple = profitLoss / initialRiskedAmount;
    }
    
    calculationExplanation += 'Trade is still open. ';
  } else if (initialRiskedAmount > 0) {
    // IMPORTANT CHANGE: Always use initialRiskedAmount for R-multiple calculations
    // This ensures P&L calculations work even without an updated stop loss
    rMultiple = profitLoss / initialRiskedAmount;
  }

  // Calculate percentage based on initial investment for stocks
  // For futures, use the risked amount as the baseline
  if (trade.type === 'futures') {
    if (initialRiskedAmount > 0) {
      profitLossPercentage = (profitLoss / initialRiskedAmount) * 100;
    } else {
      calculationExplanation += 'Cannot calculate percentage: risked amount is zero. ';
    }
  } else if (entryValue !== 0) {
    profitLossPercentage = (profitLoss / (entryValue * quantity)) * 100;
  } else {
    calculationExplanation += 'Entry price is zero. Cannot calculate profit/loss percentage. ';
  }

  // Always include calculation details for clarity
  if (calculationExplanation === '') {
    // If no issues found, add basic calculation info
    calculationExplanation = `Entry: ${trade.entryPrice}, `;
    calculationExplanation += trade.status === 'open' ? 
      `StopLoss: ${trade.stopLoss}, TakeProfit: ${trade.takeProfit || 'Not Set'}. ` :
      `Exit: ${weightedExitPrice?.toFixed(5) || trade.exitPrice}, Stop: ${trade.stopLoss}. `;
    
    if (trade.initialStopLoss && trade.initialStopLoss !== trade.stopLoss) {
      calculationExplanation += `Initial Stop: ${trade.initialStopLoss}, `;
    }
    
    // Add position direction info
    calculationExplanation += `Direction: ${direction}, `;
    
    calculationExplanation += `Current Risk: $${riskedAmount.toFixed(2)}`;
    
    if (initialRiskedAmount !== riskedAmount) {
      calculationExplanation += `, Initial Risk: $${initialRiskedAmount.toFixed(2)}`;
    }
    
    if (trade.type === 'futures' && pointValue !== 1) {
      if (customContract) {
        calculationExplanation += `, Custom Contract Value: $${pointValue.toLocaleString()}`;
      } else {
        calculationExplanation += `, Contract Value: $${pointValue.toLocaleString()}`;
      }
    }
    
    if (maxPotentialGain > 0) {
      calculationExplanation += `, Potential Gain: $${maxPotentialGain.toFixed(2)}`;
    }
    
    if (riskRewardRatio > 0) {
      calculationExplanation += `, R:R Ratio: ${riskRewardRatio.toFixed(2)}:1`;
    }
    
    if (trade.status !== 'open' || profitLoss !== 0) {
      calculationExplanation += `, P&L: $${profitLoss.toFixed(2)}`;
      if (rMultiple !== 0) {
        calculationExplanation += `, R-Multiple: ${rMultiple.toFixed(2)}`;
      }
    }
    
    if (maxFavorableExcursion > 0) {
      calculationExplanation += `, Max Favorable: $${maxFavorableExcursion.toFixed(2)}`;
      
      if (capturedProfitPercent > 0) {
        calculationExplanation += `, Captured: ${capturedProfitPercent.toFixed(0)}%`;
      }
    }
    
    if (maxAdverseExcursion > 0) {
      calculationExplanation += `, Max Heat: $${maxAdverseExcursion.toFixed(2)}`;
    }
  }

  // Return the calculated metrics
  return {
    profitLoss,
    riskRewardRatio,
    rMultiple,
    profitLossPercentage,
    riskedAmount,
    initialRiskedAmount,
    maxPotentialGain,
    calculationExplanation,
    weightedExitPrice,
    latestExitDate,
    maxFavorableExcursion,
    maxAdverseExcursion,
    capturedProfitPercent
  };
};

// Export as calculateTradeMetrics as well for backward compatibility
export const calculateTradeMetrics = getTradeMetrics;
