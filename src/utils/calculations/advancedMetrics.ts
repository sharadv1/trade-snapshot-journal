
import { TradeWithMetrics } from '@/types';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

/**
 * Calculate the profit factor: Gross Profits / Gross Losses
 */
export const calculateProfitFactor = (trades: TradeWithMetrics[]): number => {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  
  let grossProfit = 0;
  let grossLoss = 0;
  
  closedTrades.forEach(trade => {
    const pnl = trade.metrics.profitLoss;
    if (pnl > 0) {
      grossProfit += pnl;
    } else if (pnl < 0) {
      grossLoss += Math.abs(pnl);
    }
  });
  
  // Prevent division by zero
  if (grossLoss === 0) {
    return grossProfit > 0 ? Infinity : 1; // Return Infinity if there are profits, 1 if no trades
  }
  
  return grossProfit / grossLoss;
};

/**
 * Calculate Calmar Ratio: Annualized Return / Maximum Drawdown
 */
export const calculateCalmarRatio = (trades: TradeWithMetrics[]): number => {
  const closedTrades = trades.filter(trade => 
    trade.status === 'closed' && trade.exitDate
  ).sort((a, b) => 
    new Date(a.exitDate || '').getTime() - new Date(b.exitDate || '').getTime()
  );
  
  if (closedTrades.length < 2) return 0;
  
  // Calculate annualized return
  const firstTradeDate = new Date(closedTrades[0].exitDate || '');
  const lastTradeDate = new Date(closedTrades[closedTrades.length - 1].exitDate || '');
  const tradingPeriodInDays = (lastTradeDate.getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (tradingPeriodInDays < 1) return 0;
  
  const totalReturn = closedTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  const annualizedReturn = (totalReturn / tradingPeriodInDays) * 365;
  
  // Calculate maximum drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;
  
  closedTrades.forEach(trade => {
    runningPnL += trade.metrics.profitLoss;
    
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  // Prevent division by zero or very small drawdowns
  if (maxDrawdown < 0.01) return 0;
  
  return annualizedReturn / maxDrawdown;
};

/**
 * Calculate Pareto Index: Percentage of profit from top 20% of winning trades
 */
export const calculateParetoIndex = (trades: TradeWithMetrics[]): number => {
  const winningTrades = trades
    .filter(trade => trade.status === 'closed' && trade.metrics.profitLoss > 0)
    .sort((a, b) => b.metrics.profitLoss - a.metrics.profitLoss);
  
  if (winningTrades.length === 0) return 0;
  
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  if (totalProfit <= 0) return 0;
  
  const topTradeCount = Math.max(1, Math.ceil(winningTrades.length * 0.2));
  const topTradesProfit = winningTrades
    .slice(0, topTradeCount)
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  
  return (topTradesProfit / totalProfit) * 100;
};

/**
 * Calculate Expected Value: (Win Rate * Average Win) - (Loss Rate * Average Loss)
 */
export const calculateExpectedValue = (trades: TradeWithMetrics[]): number => {
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
};

/**
 * Get monthly performance data for trades
 */
export const getMonthlyPerformanceData = (trades: TradeWithMetrics[]) => {
  const closedTrades = trades.filter(trade => 
    trade.status === 'closed' && trade.exitDate
  );
  
  // Group trades by month
  const tradesByMonth: Record<string, TradeWithMetrics[]> = {};
  
  closedTrades.forEach(trade => {
    if (!trade.exitDate) return;
    
    const exitDate = parseISO(trade.exitDate);
    const monthStart = startOfMonth(exitDate);
    const monthKey = format(monthStart, 'yyyy-MM');
    
    if (!tradesByMonth[monthKey]) {
      tradesByMonth[monthKey] = [];
    }
    
    tradesByMonth[monthKey].push(trade);
  });
  
  // Calculate metrics for each month
  return Object.entries(tradesByMonth).map(([monthKey, monthTrades]) => {
    const month = format(parseISO(`${monthKey}-01`), 'MMM yyyy');
    const totalPnL = monthTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
    const winningTrades = monthTrades.filter(trade => trade.metrics.profitLoss > 0);
    const winRate = (winningTrades.length / monthTrades.length) * 100;
    
    return {
      month,
      monthKey,
      trades: monthTrades.length,
      pnl: totalPnL,
      winRate
    };
  }).sort((a, b) => {
    // Sort by date (latest months first)
    return b.monthKey.localeCompare(a.monthKey);
  });
};
