
import { Trade } from '@/types';
import { getContractPointValue } from './contractUtils';

// Constants
const FUTURES_CONTRACTS_KEY = 'futures_contracts';

export const getTradeMetrics = (trade: Trade) => {
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

  if (!trade.stopLoss) {
    calculationExplanation += 'Stop loss is missing. ';
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

  const calculatePartialExits = () => {
    if (!trade.partialExits || trade.partialExits.length === 0) {
      return;
    }

    let totalQuantityExited = 0;
    let weightedSum = 0;
    let runningProfitLoss = 0;

    trade.partialExits.forEach(exit => {
      if (exit.exitPrice && exit.quantity) {
        const quantity = parseFloat(String(exit.quantity));
        const exitPrice = parseFloat(String(exit.exitPrice));
        const entryPrice = parseFloat(String(trade.entryPrice));

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
    const quantity = parseFloat(String(trade.quantity));
    const entryPrice = parseFloat(String(trade.entryPrice));
    const exitPrice = parseFloat(String(trade.exitPrice));

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

  // For short positions, risk calculation needs to be inverted
  // Calculate CURRENT risk per share/contract based on entry and stop loss
  const stopLossValue = parseFloat(String(trade.stopLoss));
  const entryValue = parseFloat(String(trade.entryPrice));
  
  // For long positions, stop < entry; for short positions, stop > entry
  let riskedAmountPerUnit = Math.abs(entryValue - stopLossValue);
  
  // Calculate INITIAL risk per share/contract if available
  let initialRiskedAmountPerUnit = 0;
  if (trade.initialStopLoss) {
    const initialStopValue = parseFloat(String(trade.initialStopLoss));
    initialRiskedAmountPerUnit = Math.abs(entryValue - initialStopValue);
  } else {
    // If initialStopLoss is not available, use current stopLoss
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
  const quantity = trade.quantity ? parseFloat(String(trade.quantity)) : 0;
  riskedAmount = riskedAmountPerUnit * quantity;
  initialRiskedAmount = initialRiskedAmountPerUnit * quantity;

  if (trade.takeProfit) {
    const takeProfitValue = parseFloat(String(trade.takeProfit));
    
    // For long positions, TP > entry; for short positions, TP < entry
    // Calculate the absolute difference regardless of direction
    let maxGainPerUnit = Math.abs(takeProfitValue - entryValue);
    
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

  // Calculate the maximum favorable and adverse excursions if they exist
  if (trade.maxFavorablePrice && trade.entryPrice) {
    const maxFavPrice = parseFloat(String(trade.maxFavorablePrice));
    
    // Calculate direction multiplier considering long vs short
    // For long: maxFavPrice > entryPrice is good
    // For short: maxFavPrice < entryPrice is good
    const directionMultiplier = direction === 'long' ? 1 : -1;
    
    // Calculate how much the price moved in your favor at its best point
    let favorableMove = (maxFavPrice - entryValue) * directionMultiplier;
    
    // Apply contract multiplier for futures
    if (trade.type === 'futures') {
      favorableMove = favorableMove * pointValue;
    }
    
    // Ensure max favorable excursion is positive (it's the maximum price movement in your favor)
    maxFavorableExcursion = Math.max(0, favorableMove * quantity);
    
    // Calculate the percentage of max move captured if trade is closed
    if (trade.status === 'closed' && weightedExitPrice && maxFavorableExcursion > 0) {
      const actualMove = (weightedExitPrice - entryValue) * directionMultiplier;
      const actualPL = actualMove * (trade.type === 'futures' ? pointValue : 1) * quantity;
      capturedProfitPercent = (actualPL / maxFavorableExcursion) * 100;
    }
  }
  
  if (trade.maxAdversePrice && trade.entryPrice) {
    const maxAdvPrice = parseFloat(String(trade.maxAdversePrice));
    
    // Inverse of favorable - for long: price drop is adverse, for short: price rise is adverse
    const directionMultiplier = direction === 'long' ? -1 : 1;
    
    // Calculate how much the price moved against you at its worst point
    let adverseMove = (maxAdvPrice - entryValue) * directionMultiplier;
    
    // Apply contract multiplier for futures
    if (trade.type === 'futures') {
      adverseMove = adverseMove * pointValue;
    }
    
    // Ensure max adverse excursion is positive (it's the maximum adverse movement against your position)
    maxAdverseExcursion = Math.max(0, adverseMove * quantity);
  }

  // For open trades, calculate the rMultiple based on current price or last close
  if (trade.status === 'open') {
    // If we have partial exits, we can calculate a partial r-multiple
    if (profitLoss !== 0 && initialRiskedAmount > 0) {
      rMultiple = profitLoss / initialRiskedAmount;
    }
    
    calculationExplanation += 'Trade is still open. ';
  } else if (initialRiskedAmount > 0) {
    // For closed trades, use initial risk for R-multiple calculation
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
