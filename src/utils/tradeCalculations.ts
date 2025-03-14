
import { Trade, TradeMetrics, PerformanceMetrics, TradeWithMetrics, PartialExit, FuturesContractDetails, COMMON_FUTURES_CONTRACTS } from '@/types';

// Calculate metrics for a single trade
export const calculateTradeMetrics = (trade: Trade): TradeMetrics => {
  const metrics: TradeMetrics = {
    profitLoss: 0,
    profitLossPercentage: 0,
    riskRewardRatio: undefined,
    riskedAmount: undefined,
    maxPotentialGain: undefined
  };

  const direction = trade.direction === 'long' ? 1 : -1;
  let totalPL = 0;
  let totalExitValue = 0;
  let totalEntryValue = 0;
  let totalExitedQuantity = 0;

  // Calculate P&L from partial exits
  if (trade.partialExits && trade.partialExits.length > 0) {
    trade.partialExits.forEach(exit => {
      const exitValue = exit.exitPrice * exit.quantity;
      const entryValue = trade.entryPrice * exit.quantity;
      const partialPL = (exitValue - entryValue) * direction - (exit.fees || 0);
      
      totalPL += partialPL;
      totalExitValue += exitValue;
      totalEntryValue += entryValue;
      totalExitedQuantity += exit.quantity;
    });
  }

  // Add P&L from final exit if trade is closed
  if (trade.status === 'closed' && trade.exitPrice) {
    const remainingQuantity = trade.quantity - totalExitedQuantity;
    const exitValue = trade.exitPrice * remainingQuantity;
    const entryValue = trade.entryPrice * remainingQuantity;
    const finalPL = (exitValue - entryValue) * direction - (trade.fees || 0);
    
    totalPL += finalPL;
    totalExitValue += exitValue;
    totalEntryValue += entryValue;
  }

  // Set the calculated P&L
  metrics.profitLoss = totalPL;
  
  // Calculate P&L percentage if we have any exits
  if (totalEntryValue > 0 && (totalExitedQuantity > 0 || trade.status === 'closed')) {
    metrics.profitLossPercentage = (totalPL / totalEntryValue) * 100;
  }

  // Calculate risk metrics differently based on trade type
  if (trade.stopLoss) {
    if (trade.type === 'futures' && trade.contractDetails) {
      // Get contract info
      const pointValue = getContractPointValue(trade);
      
      // Calculate risk in points
      const riskInPoints = Math.abs(trade.entryPrice - trade.stopLoss);
      // Convert points to money based on contract value
      metrics.riskedAmount = riskInPoints * pointValue * trade.quantity;
      
      // Calculate R:R ratio if take profit is defined
      if (trade.takeProfit) {
        const rewardInPoints = Math.abs(trade.takeProfit - trade.entryPrice);
        metrics.maxPotentialGain = rewardInPoints * pointValue * trade.quantity;
        metrics.riskRewardRatio = rewardInPoints / riskInPoints;
      }
    } else {
      // Standard calculation for non-futures
      const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
      metrics.riskedAmount = riskPerUnit * trade.quantity;
      
      if (trade.takeProfit) {
        const rewardPerUnit = Math.abs(trade.takeProfit - trade.entryPrice);
        metrics.maxPotentialGain = rewardPerUnit * trade.quantity;
        metrics.riskRewardRatio = rewardPerUnit / riskPerUnit;
      }
    }
  }

  return metrics;
};

// Helper function to get contract point value 
export const getContractPointValue = (trade: Trade): number => {
  // For futures contracts, get the contract details
  if (trade.type === 'futures' && trade.contractDetails) {
    // If tick size and value are defined, calculate point value
    if (trade.contractDetails.tickSize && trade.contractDetails.tickValue) {
      return trade.contractDetails.tickValue / trade.contractDetails.tickSize;
    }
    
    // If not defined in contractDetails, look up from common contracts
    const commonContract = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === trade.symbol);
    if (commonContract) {
      return commonContract.tickValue / commonContract.tickSize;
    }
  }
  
  // Default value if we can't determine
  return 1;
};

// Calculate overall performance metrics from a list of trades
export const calculatePerformanceMetrics = (trades: TradeWithMetrics[]): PerformanceMetrics => {
  // Filter to only closed trades
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      largestWin: 0,
      largestLoss: 0,
      netProfit: 0
    };
  }

  // Categorize trades
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
  const breakEvenTrades = closedTrades.filter(trade => trade.metrics.profitLoss === 0);
  
  // Calculate metrics
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0));
  
  const largestWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(trade => trade.metrics.profitLoss))
    : 0;
    
  const largestLoss = losingTrades.length > 0 
    ? Math.min(...losingTrades.map(trade => trade.metrics.profitLoss))
    : 0;
  
  const winRate = (winningTrades.length / closedTrades.length) * 100;
  const averageWin = winningTrades.length > 0 
    ? totalProfit / winningTrades.length 
    : 0;
    
  const averageLoss = losingTrades.length > 0 
    ? totalLoss / losingTrades.length 
    : 0;
    
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  
  // Calculate expectancy: (Win% * Average Win) - (Loss% * Average Loss)
  const expectancy = (winRate / 100 * averageWin) - ((100 - winRate) / 100 * averageLoss);
  
  return {
    totalTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakEvenTrades: breakEvenTrades.length,
    winRate,
    averageWin,
    averageLoss,
    profitFactor,
    expectancy,
    largestWin,
    largestLoss,
    netProfit: totalProfit - totalLoss
  };
};

// Format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};
