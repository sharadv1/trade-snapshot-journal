
import { Trade } from '@/types';
import { getContractPointValue } from './contractUtils';

export const getTradeMetrics = (trade: Trade) => {
  let profitLoss = 0;
  let riskRewardRatio = 0;
  let rMultiple = 0;
  let profitLossPercentage = 0;
  let riskedAmount = 0;
  let maxPotentialGain = 0;
  let calculationExplanation = '';
  let weightedExitPrice: number | undefined = undefined;
  let latestExitDate: string | undefined = undefined;

  if (!trade.entryPrice) {
    calculationExplanation += 'Entry price is missing. ';
    return {
      profitLoss,
      riskRewardRatio,
      rMultiple,
      profitLossPercentage,
      riskedAmount,
      maxPotentialGain,
      calculationExplanation,
      weightedExitPrice,
      latestExitDate
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
      maxPotentialGain,
      calculationExplanation,
      weightedExitPrice,
      latestExitDate
    };
  }

  // Get point value for futures contract - do this early to ensure consistent usage
  let pointValue = 1;
  
  if (trade.type === 'futures') {
    const normalizedSymbol = trade.symbol?.toUpperCase().trim();
    
    // Detect full-sized Silver (SI) vs micro Silver (SIL) contracts
    const isFullSilver = normalizedSymbol === 'SI' || 
                         (normalizedSymbol?.includes('SI') && 
                          !normalizedSymbol?.includes('SIL') && 
                          !normalizedSymbol?.includes('MSFT'));
                          
    const isMicroSilver = normalizedSymbol === 'SIL' || 
                          normalizedSymbol?.includes('SIL');
    
    if (isFullSilver) {
      // Full-sized Silver
      pointValue = 5000;
      console.log(`Metrics calculation for ${trade.symbol}: using full-sized Silver point value $${pointValue}`);
    } else if (isMicroSilver) {
      // Micro Silver
      pointValue = 1000;
      console.log(`Metrics calculation for ${trade.symbol}: using micro Silver point value $${pointValue}`);
    } else if (trade.contractDetails?.tickValue && Number(trade.contractDetails.tickValue) > 0) {
      pointValue = Number(trade.contractDetails.tickValue);
      console.log(`Metrics calculation for ${trade.symbol}: using stored point value ${pointValue}`);
    } else {
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
        const quantity = parseFloat(exit.quantity.toString());
        const exitPrice = parseFloat(exit.exitPrice.toString());
        const entryPrice = parseFloat(trade.entryPrice!.toString());

        const tradeDirectionMultiplier = trade.direction === 'long' ? 1 : -1;
        
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
    const quantity = parseFloat(trade.quantity.toString());
    const entryPrice = parseFloat(trade.entryPrice.toString());
    const exitPrice = parseFloat(trade.exitPrice.toString());

    const tradeDirectionMultiplier = trade.direction === 'long' ? 1 : -1;
    
    // Calculate P&L with point value for futures
    let exitProfitLoss = (exitPrice - entryPrice) * quantity * tradeDirectionMultiplier;
    if (trade.type === 'futures') {
      exitProfitLoss = exitProfitLoss * pointValue;
    }
    
    profitLoss = exitProfitLoss;
    weightedExitPrice = exitPrice;
    latestExitDate = trade.exitDate;
  }

  // Calculate risk per share/contract based on entry and stop loss
  let riskedAmountPerUnit = Math.abs(parseFloat(trade.entryPrice.toString()) - parseFloat(trade.stopLoss.toString()));
  
  // Apply contract multiplier for futures
  if (trade.type === 'futures') {
    riskedAmountPerUnit = riskedAmountPerUnit * pointValue;
    
    if (trade.symbol?.toUpperCase().includes('SI')) {
      if (trade.symbol?.toUpperCase().includes('SIL')) {
        calculationExplanation += `Micro Silver futures (SIL) with point value: $${pointValue}. `;
      } else {
        calculationExplanation += `Silver futures (SI) with point value: $${pointValue}. `;
      }
    } else {
      calculationExplanation += `Futures contract with point value: $${pointValue}. `;
    }
  }
  
  // Calculate actual risked amount (per unit * quantity)
  const quantity = parseFloat(trade.quantity.toString());
  riskedAmount = riskedAmountPerUnit * quantity;

  if (trade.takeProfit) {
    const takeProfitValue = parseFloat(trade.takeProfit.toString());
    const entryPrice = parseFloat(trade.entryPrice.toString());
    let maxGainPerUnit = Math.abs(takeProfitValue - entryPrice);
    
    // Apply contract multiplier for futures
    if (trade.type === 'futures') {
      maxGainPerUnit = maxGainPerUnit * pointValue;
    }
    
    maxPotentialGain = maxGainPerUnit * quantity;
    
    if (riskedAmount > 0 && maxPotentialGain > 0) {
      riskRewardRatio = maxPotentialGain / riskedAmount;
    }
  }

  // For open trades, calculate the rMultiple based on current price or last close
  if (trade.status === 'open') {
    // If we have partial exits, we can calculate a partial r-multiple
    if (profitLoss !== 0 && riskedAmount > 0) {
      rMultiple = profitLoss / riskedAmount;
    }
    
    calculationExplanation += 'Trade is still open. ';
  } else if (riskedAmount > 0) {
    rMultiple = profitLoss / riskedAmount;
  }

  // Calculate percentage based on initial investment for stocks
  // For futures, use the risked amount as the baseline
  if (trade.type === 'futures') {
    if (riskedAmount > 0) {
      profitLossPercentage = (profitLoss / riskedAmount) * 100;
    } else {
      calculationExplanation += 'Cannot calculate percentage: risked amount is zero. ';
    }
  } else if (trade.entryPrice !== 0) {
    profitLossPercentage = (profitLoss / (parseFloat(trade.entryPrice.toString()) * quantity)) * 100;
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
    
    calculationExplanation += `Risk: $${riskedAmount.toFixed(2)}`;
    
    if (trade.type === 'futures' && pointValue !== 1) {
      calculationExplanation += `, Contract Value: $${pointValue.toLocaleString()}`;
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
  }

  return {
    profitLoss,
    riskRewardRatio,
    rMultiple,
    profitLossPercentage,
    riskedAmount,
    maxPotentialGain,
    calculationExplanation,
    weightedExitPrice,
    latestExitDate
  };
};

// Export as calculateTradeMetrics as well for backward compatibility
export const calculateTradeMetrics = getTradeMetrics;
