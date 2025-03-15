
import { Trade, PartialExit, TradeWithMetrics } from '@/types';
import { COMMON_FUTURES_CONTRACTS } from '@/types';

// Helper to get the point value for a futures contract
function getContractPointValue(trade: Trade): number {
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
  if (totalExitedQuantity > 0) {
    weightedExitPrice = weightedExitPrice / totalExitedQuantity;
  } else {
    weightedExitPrice = undefined;
  }
  
  // Calculate profit/loss percentage
  const profitLossPercentage = totalEntryValue !== 0 
    ? (totalPL / totalEntryValue) * 100 
    : 0;
  
  // Calculate risk/reward metrics if stop loss and/or take profit are defined
  let riskedAmount, maxPotentialGain, riskRewardRatio;
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
    
    if (trade.takeProfit) {
      const rewardPerUnit = Math.abs(trade.takeProfit - trade.entryPrice);
      
      if (trade.type === 'futures') {
        maxPotentialGain = rewardPerUnit * pointValue * trade.quantity;
      } else {
        maxPotentialGain = rewardPerUnit * trade.quantity;
      }
      
      riskRewardRatio = riskedAmount > 0 ? maxPotentialGain / riskedAmount : 0;
      
      calculationExplanation += `Reward calculation:\n`;
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
  }
  
  return {
    profitLoss: totalPL,
    profitLossPercentage: profitLossPercentage,
    riskedAmount,
    maxPotentialGain,
    riskRewardRatio,
    calculationExplanation,
    weightedExitPrice,
    latestExitDate
  };
}

export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return '';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + '%';
}

// Helper function to check if a trade is fully exited through partial exits
export function isTradeFullyExited(trade: Trade): boolean {
  if (!trade.partialExits || trade.partialExits.length === 0) {
    return false;
  }
  
  const totalExitedQuantity = trade.partialExits.reduce(
    (total, exit) => total + exit.quantity, 0
  );
  
  return totalExitedQuantity >= trade.quantity;
}
