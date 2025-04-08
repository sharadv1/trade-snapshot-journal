
import { Trade } from '@/types';

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
        const exitProfitLoss = (exitPrice - entryPrice) * quantity * tradeDirectionMultiplier;

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
    profitLoss = (exitPrice - entryPrice) * quantity * tradeDirectionMultiplier;
    weightedExitPrice = exitPrice;
    latestExitDate = trade.exitDate;
  } else {
    calculationExplanation += 'No exit price or partial exits found. ';
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

  // Calculate risk per share based on entry and stop loss
  let riskedAmountPerShare = Math.abs(parseFloat(trade.entryPrice.toString()) - parseFloat(trade.stopLoss.toString()));
  
  // Calculate actual risked amount (per share * quantity)
  riskedAmount = riskedAmountPerShare * parseFloat(trade.quantity.toString());

  if (trade.takeProfit) {
    maxPotentialGain = Math.abs(parseFloat(trade.takeProfit.toString()) - parseFloat(trade.entryPrice.toString())) * parseFloat(trade.quantity.toString());
  }

  if (riskedAmount !== 0) {
    rMultiple = profitLoss / riskedAmount;

    // No capping of R-multiple values

    if (maxPotentialGain) {
      riskRewardRatio = maxPotentialGain / riskedAmount;
      // Cap risk-reward ratio as well
      if (riskRewardRatio > 20) {
        riskRewardRatio = 20;
        calculationExplanation += 'Extremely high risk-reward ratio was capped to 20. ';
      }
    }
  } else {
    calculationExplanation += 'Risked amount is zero. Cannot calculate R-multiple or risk-reward ratio. ';
  }

  if (trade.entryPrice !== 0) {
    profitLossPercentage = (profitLoss / (parseFloat(trade.entryPrice.toString()) * parseFloat(trade.quantity.toString()))) * 100;
  } else {
    calculationExplanation += 'Entry price is zero. Cannot calculate profit/loss percentage. ';
  }

  // Always include calculation details for clarity
  if (calculationExplanation === '') {
    // If no issues found, add basic calculation info
    calculationExplanation = `Entry: ${trade.entryPrice}, Exit: ${weightedExitPrice?.toFixed(4) || trade.exitPrice}, Stop: ${trade.stopLoss}. `;
    calculationExplanation += `P&L: $${profitLoss.toFixed(2)}, Risk: $${riskedAmount.toFixed(2)}, R-Multiple: ${rMultiple.toFixed(4)}`;
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
