
import { Trade, TradeMetrics, PerformanceMetrics, TradeWithMetrics } from '@/types';

// Calculate metrics for a single trade
export const calculateTradeMetrics = (trade: Trade): TradeMetrics => {
  const metrics: TradeMetrics = {
    profitLoss: 0,
    profitLossPercentage: 0,
    riskRewardRatio: undefined,
    riskedAmount: undefined,
    maxPotentialGain: undefined
  };

  // Calculate P&L if we have exit price
  if (trade.exitPrice) {
    const direction = trade.direction === 'long' ? 1 : -1;
    const priceDifference = (trade.exitPrice - trade.entryPrice) * direction;
    metrics.profitLoss = priceDifference * trade.quantity - (trade.fees || 0);
    metrics.profitLossPercentage = (priceDifference / trade.entryPrice) * 100;
  }

  // Calculate risk metrics if stop loss is defined
  if (trade.stopLoss) {
    const direction = trade.direction === 'long' ? 1 : -1;
    const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
    metrics.riskedAmount = riskPerUnit * trade.quantity;
    
    // Calculate R:R ratio if take profit is defined
    if (trade.takeProfit) {
      const rewardPerUnit = Math.abs(trade.takeProfit - trade.entryPrice);
      metrics.maxPotentialGain = rewardPerUnit * trade.quantity;
      metrics.riskRewardRatio = rewardPerUnit / riskPerUnit;
    }
  }

  return metrics;
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
