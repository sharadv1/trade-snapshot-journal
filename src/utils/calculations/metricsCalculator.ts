
/**
 * Core function for calculating trade metrics
 */
import { Trade, PartialExit, TradeWithMetrics } from '@/types';
import { getContractPointValue } from './contractUtils';

export function calculateTradeMetrics(trade: Trade): TradeWithMetrics['metrics'] {
  const direction = trade.direction === 'long' ? 1 : -1;
  let totalPL = 0;
  let totalExitValue = 0;
  let totalEntryValue = 0;
  let totalExitedQuantity = 0;
  let weightedExitPrice = 0;
  let latestExitDate: string | undefined = undefined;

  // Get contract point value for futures contracts
  const pointValue = trade.type === 'futures' ? getContractPointValue(trade) : 1;

  // Calculate P&L from partial exits
  if (trade.partialExits && trade.partialExits.length > 0) {
    // Sort partial exits by date (newest first) to find the latest exit date
    const sortedExits = [...trade.partialExits].sort((a, b) => 
      new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
    );
    
    latestExitDate = sortedExits[0].exitDate;
    
    trade.partialExits.forEach(exit => {
      let partialPL;
      
      if (trade.type === 'futures') {
        // For futures, calculate P&L based on point difference × point value
        const pointDifference = (exit.exitPrice - trade.entryPrice) * direction;
        partialPL = pointDifference * pointValue * exit.quantity - (exit.fees || 0);
      } else {
        // For other instruments, calculate P&L based on price difference
        const exitValue = exit.exitPrice * exit.quantity;
        const entryValue = trade.entryPrice * exit.quantity;
        partialPL = (exitValue - entryValue) * direction - (exit.fees || 0);
      }
      
      totalPL += partialPL;
      totalExitValue += exit.exitPrice * exit.quantity;
      totalEntryValue += trade.entryPrice * exit.quantity;
      totalExitedQuantity += exit.quantity;
      weightedExitPrice += exit.exitPrice * exit.quantity; // For weighted average calculation
    });
  }
  
  // Add any remaining P&L if the trade is fully closed
  if (trade.status === 'closed' && trade.exitPrice) {
    const remainingQuantity = trade.quantity - totalExitedQuantity;
    if (remainingQuantity > 0) {
      let finalPL;
      
      if (trade.type === 'futures') {
        // For futures, calculate P&L based on point difference × point value
        const pointDifference = (trade.exitPrice - trade.entryPrice) * direction;
        finalPL = pointDifference * pointValue * remainingQuantity - (trade.fees || 0);
      } else {
        // For other instruments, calculate P&L based on price difference
        const exitValue = trade.exitPrice * remainingQuantity;
        const entryValue = trade.entryPrice * remainingQuantity;
        finalPL = (exitValue - entryValue) * direction - (trade.fees || 0);
      }
      
      totalPL += finalPL;
      totalExitValue += trade.exitPrice * remainingQuantity;
      totalEntryValue += trade.entryPrice * remainingQuantity;
      totalExitedQuantity += remainingQuantity;
      weightedExitPrice += trade.exitPrice * remainingQuantity; // Add to weighted average
      
      // Use the trade's exitDate if we don't have a later partial exit date
      if (!latestExitDate || (trade.exitDate && new Date(trade.exitDate) > new Date(latestExitDate))) {
        latestExitDate = trade.exitDate;
      }
    }
  }
  
  // Calculate the weighted average exit price
  const finalWeightedExitPrice = totalExitedQuantity > 0 ? weightedExitPrice / totalExitedQuantity : undefined;
  
  // Calculate profit/loss percentage
  const profitLossPercentage = totalEntryValue !== 0 
    ? (totalPL / totalEntryValue) * 100 
    : 0;
  
  // Calculate risk/reward metrics if stop loss and/or take profit are defined
  let riskedAmount = 0;
  let maxPotentialGain = 0;
  let riskRewardRatio = 0;
  let calculationExplanation = '';
  
  if (trade.stopLoss) {
    const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
    
    if (trade.type === 'futures') {
      riskedAmount = riskPerUnit * pointValue * trade.quantity;
    } else {
      riskedAmount = riskPerUnit * trade.quantity;
    }
    
    calculationExplanation += `Risk calculation:\n`;
    calculationExplanation += `Entry price: ${trade.entryPrice}\n`;
    calculationExplanation += `Stop loss: ${trade.stopLoss}\n`;
    calculationExplanation += `Risk per unit: ${riskPerUnit.toFixed(2)}\n`;
    
    if (trade.type === 'futures') {
      calculationExplanation += `Point value: ${pointValue}\n`;
      calculationExplanation += `Total risk: ${riskPerUnit} × ${pointValue} × ${trade.quantity} = $${riskedAmount.toFixed(2)}\n\n`;
    } else {
      calculationExplanation += `Total risk: ${riskPerUnit} × ${trade.quantity} = $${riskedAmount.toFixed(2)}\n\n`;
    }
    
    // For open trades, calculate potential R:R based on take profit
    if (trade.status === 'open' && trade.takeProfit) {
      const rewardPerUnit = Math.abs(trade.takeProfit - trade.entryPrice);
      
      if (trade.type === 'futures') {
        maxPotentialGain = rewardPerUnit * pointValue * trade.quantity;
      } else {
        maxPotentialGain = rewardPerUnit * trade.quantity;
      }
      
      riskRewardRatio = riskedAmount > 0 ? maxPotentialGain / riskedAmount : 0;
      
      calculationExplanation += `Potential Reward calculation:\n`;
      calculationExplanation += `Take profit: ${trade.takeProfit}\n`;
      calculationExplanation += `Reward per unit: ${rewardPerUnit.toFixed(2)}\n`;
      
      if (trade.type === 'futures') {
        calculationExplanation += `Point value: ${pointValue}\n`;
        calculationExplanation += `Max potential gain: ${rewardPerUnit} × ${pointValue} × ${trade.quantity} = $${maxPotentialGain.toFixed(2)}\n\n`;
      } else {
        calculationExplanation += `Max potential gain: ${rewardPerUnit} × ${trade.quantity} = $${maxPotentialGain.toFixed(2)}\n\n`;
      }
      
      calculationExplanation += `Risk-reward ratio: ${riskRewardRatio.toFixed(2)}:1`;
    } 
    // For closed trades, calculate actual R:R based on exit price
    else if ((trade.status === 'closed' || totalExitedQuantity > 0) && finalWeightedExitPrice !== undefined) {
      // Use actual PnL to calculate R value when we have exits
      if (totalPL > 0) {
        // For winners, calculate R based on actual profit vs. risked amount
        riskRewardRatio = riskedAmount > 0 ? totalPL / riskedAmount : 0;
        maxPotentialGain = totalPL;
        
        calculationExplanation += `Actual Reward calculation:\n`;
        calculationExplanation += `Exit price (weighted avg): ${finalWeightedExitPrice.toFixed(2)}\n`;
        calculationExplanation += `Actual profit: $${totalPL.toFixed(2)}\n\n`;
        calculationExplanation += `Risk-reward ratio: ${riskRewardRatio.toFixed(2)}:1`;
      } else {
        // For losers, if we hit stop or exited with a loss
        // FIX: Handle NaN by ensuring we have valid exit price
        if (!isNaN(finalWeightedExitPrice)) {
          const actualRewardPerUnit = Math.abs(finalWeightedExitPrice - trade.entryPrice);
          
          if (trade.type === 'futures') {
            maxPotentialGain = actualRewardPerUnit * pointValue * trade.quantity;
          } else {
            maxPotentialGain = actualRewardPerUnit * trade.quantity;
          }
          
          riskRewardRatio = riskedAmount > 0 ? maxPotentialGain / riskedAmount : 0;
          // For losses, R is negative
          if (totalPL < 0) {
            riskRewardRatio = -riskRewardRatio;
          }
          
          calculationExplanation += `Actual Reward calculation:\n`;
          calculationExplanation += `Exit price (weighted avg): ${finalWeightedExitPrice.toFixed(2)}\n`;
          calculationExplanation += `Reward per unit: ${actualRewardPerUnit.toFixed(2)}\n`;
          
          if (trade.type === 'futures') {
            calculationExplanation += `Point value: ${pointValue}\n`;
            calculationExplanation += `Actual gain: ${actualRewardPerUnit} × ${pointValue} × ${trade.quantity} = $${maxPotentialGain.toFixed(2)}\n\n`;
          } else {
            calculationExplanation += `Actual gain: ${actualRewardPerUnit} × ${trade.quantity} = $${maxPotentialGain.toFixed(2)}\n\n`;
          }
          
          calculationExplanation += `Risk-reward ratio: ${riskRewardRatio.toFixed(2)}:1`;
        } else {
          // FIX: Handle the case where weightedExitPrice is NaN
          calculationExplanation += `Actual Reward calculation:\n`;
          calculationExplanation += `Error: Could not calculate weighted exit price\n`;
          calculationExplanation += `Risk-reward ratio: 0:1`;
          riskRewardRatio = 0;
        }
      }
    }
  }
  
  return {
    profitLoss: totalPL || 0,
    profitLossPercentage: profitLossPercentage || 0,
    riskedAmount: riskedAmount || 0,
    maxPotentialGain: maxPotentialGain || 0,
    riskRewardRatio: riskRewardRatio || 0,
    calculationExplanation,
    weightedExitPrice: finalWeightedExitPrice || 0, // FIX: Provide a default value when undefined
    latestExitDate
  };
}
