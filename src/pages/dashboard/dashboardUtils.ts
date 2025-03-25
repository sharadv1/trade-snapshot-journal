
import { TradeWithMetrics } from '@/types';

export function calculateWinRate(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  return (winningTrades.length / closedTrades.length) * 100;
}

export function calculateTotalPnL(trades: TradeWithMetrics[]): number {
  return trades
    .filter(trade => trade.status === 'closed')
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
}

export function calculateTotalR(trades: TradeWithMetrics[]): number {
  return trades
    .filter(trade => trade.status === 'closed' && trade.metrics.riskRewardRatio !== undefined)
    .reduce((sum, trade) => sum + (trade.metrics.riskRewardRatio || 0), 0);
}

export function calculateAverageWin(trades: TradeWithMetrics[]): number {
  const winningTrades = trades
    .filter(trade => trade.status === 'closed' && trade.metrics.profitLoss > 0);
  
  if (winningTrades.length === 0) return 0;
  
  const totalWins = winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  return totalWins / winningTrades.length;
}

export function calculateAverageLoss(trades: TradeWithMetrics[]): number {
  const losingTrades = trades
    .filter(trade => trade.status === 'closed' && trade.metrics.profitLoss < 0);
  
  if (losingTrades.length === 0) return 0;
  
  const totalLosses = losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  return totalLosses / losingTrades.length;
}

export function calculateExpectancy(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const tradesWithRisk = closedTrades.filter(trade => 
    trade.metrics.riskedAmount && trade.metrics.riskedAmount > 0
  );
  
  if (tradesWithRisk.length === 0) {
    const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
    const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
    
    const winRate = winningTrades.length / closedTrades.length;
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0) / winningTrades.length
      : 0;
      
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0)) / losingTrades.length
      : 1;
    
    if (avgLoss === 0) return winRate * 2;
    
    const rMultiple = avgWin / avgLoss;
    return (winRate * rMultiple) - (1 - winRate);
  }
  
  let totalRMultiple = 0;
  
  for (const trade of tradesWithRisk) {
    const rMultiple = trade.metrics.profitLoss / trade.metrics.riskedAmount;
    totalRMultiple += rMultiple;
  }
  
  return totalRMultiple / tradesWithRisk.length;
}

export function calculateSortinoRatio(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const returns = closedTrades.map(trade => trade.metrics.profitLossPercentage / 100);
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return avgReturn > 0 ? 3 : 0;
  
  const downsideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
  );
  
  if (downsideDeviation === 0) return 0;
  
  return avgReturn / downsideDeviation;
}
