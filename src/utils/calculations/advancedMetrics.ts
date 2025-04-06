
import { TradeWithMetrics } from '@/types';
import { calculateTotalPnL } from '@/pages/dashboard/dashboardUtils';

/**
 * Calculate the Profit Factor
 * Profit Factor = Gross Profit / Gross Loss
 */
export function calculateProfitFactor(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
  
  const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0));
  
  // Avoid division by zero
  if (grossLoss === 0) {
    return grossProfit > 0 ? Number.POSITIVE_INFINITY : 0;
  }
  
  return grossProfit / grossLoss;
}

/**
 * Calculate the Calmar Ratio
 * Calmar Ratio = Annualized Return / Maximum Drawdown
 * Note: Simplified version using available trade data
 */
export function calculateCalmarRatio(trades: TradeWithMetrics[]): number {
  if (trades.length === 0) return 0;
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  // Sort trades by date
  const sortedTrades = [...closedTrades].sort((a, b) => {
    const dateA = a.exitDate ? new Date(a.exitDate).getTime() : 0;
    const dateB = b.exitDate ? new Date(b.exitDate).getTime() : 0;
    return dateA - dateB;
  });
  
  // Get first and last trade dates for time period
  const firstTradeDate = sortedTrades[0].entryDate ? new Date(sortedTrades[0].entryDate) : new Date();
  const lastTradeDate = sortedTrades[sortedTrades.length - 1].exitDate ? 
    new Date(sortedTrades[sortedTrades.length - 1].exitDate) : new Date();
  
  // Calculate trading period in years
  const tradingPeriodMs = lastTradeDate.getTime() - firstTradeDate.getTime();
  const tradingPeriodYears = tradingPeriodMs / (1000 * 60 * 60 * 24 * 365);
  
  // If period is too short, return 0
  if (tradingPeriodYears < 0.1) return 0;
  
  // Calculate annualized return
  const totalPnL = calculateTotalPnL(trades);
  const annualizedReturn = totalPnL / tradingPeriodYears;
  
  // Calculate maximum drawdown
  const maxDrawdown = calculateMaxDrawdown(sortedTrades);
  
  // Avoid division by zero
  if (maxDrawdown === 0) return 0;
  
  return annualizedReturn / maxDrawdown;
}

/**
 * Calculate Maximum Drawdown
 */
function calculateMaxDrawdown(trades: TradeWithMetrics[]): number {
  if (trades.length === 0) return 0;
  
  let cumulativePnL = 0;
  let peak = 0;
  let maxDrawdown = 0;
  
  trades.forEach(trade => {
    cumulativePnL += trade.metrics.profitLoss;
    
    // Update peak if we have a new high
    if (cumulativePnL > peak) {
      peak = cumulativePnL;
    }
    
    // Calculate current drawdown and update max if needed
    const currentDrawdown = peak - cumulativePnL;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  });
  
  return maxDrawdown;
}

/**
 * Calculate Pareto Index (80/20 rule analysis)
 * Measures what percentage of profits come from the top 20% of trades
 */
export function calculateParetoIndex(trades: TradeWithMetrics[]): number {
  const profitableTrades = trades
    .filter(trade => trade.status === 'closed' && trade.metrics.profitLoss > 0)
    .sort((a, b) => b.metrics.profitLoss - a.metrics.profitLoss);
  
  if (profitableTrades.length === 0) return 0;
  
  const totalProfit = profitableTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  
  // If no profit, return 0
  if (totalProfit <= 0) return 0;
  
  // Calculate the number of trades that make up the top 20%
  const top20PercentCount = Math.max(1, Math.ceil(profitableTrades.length * 0.2));
  
  // Sum the profits from the top 20% of trades
  const top20PercentProfit = profitableTrades
    .slice(0, top20PercentCount)
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  
  // Calculate what percentage of total profit comes from top 20% of trades
  return (top20PercentProfit / totalProfit) * 100;
}

/**
 * Calculate Expected Value
 * Expected Value = (Win Rate × Average Win) - (Loss Rate × Average Loss)
 */
export function calculateExpectedValue(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
  
  const winRate = winningTrades.length / closedTrades.length;
  const lossRate = losingTrades.length / closedTrades.length;
  
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0) / winningTrades.length
    : 0;
    
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0)) / losingTrades.length
    : 0;
  
  return (winRate * avgWin) - (lossRate * avgLoss);
}
