
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { MetricCard } from './MetricCard';
import { 
  calculateWinRate, 
  calculateTotalPnL, 
  calculateTotalR, 
  calculateAverageWin,
  calculateAverageLoss,
  calculateExpectancy,
  calculateSortinoRatio
} from './dashboardUtils';

interface DashboardMetricsProps {
  trades: TradeWithMetrics[];
}

export function DashboardMetrics({ trades }: DashboardMetricsProps) {
  // Calculate key metrics for the dashboard
  const keyMetrics = {
    winRate: calculateWinRate(trades) || 0,
    totalTrades: trades.filter(trade => trade.status === 'closed').length,
    totalWins: trades.filter(trade => trade.status === 'closed' && (trade.metrics.profitLoss || 0) > 0).length,
    totalLosses: trades.filter(trade => trade.status === 'closed' && (trade.metrics.profitLoss || 0) <= 0).length,
    netPnL: calculateTotalPnL(trades) || 0,
    expectancy: calculateExpectancy(trades) || 0,
    sortinoRatio: calculateSortinoRatio(trades) || 0,
    avgWin: calculateAverageWin(trades) || 0,
    avgLoss: calculateAverageLoss(trades) || 0,
    totalR: calculateTotalR(trades) || 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard 
        title="Expectancy" 
        value={keyMetrics.expectancy > 0 ? `${(keyMetrics.expectancy || 0).toFixed(2)}R` : (keyMetrics.expectancy || 0).toFixed(2)}
        subStats={[
          {
            label: "Win Rate",
            value: `${(keyMetrics.winRate || 0).toFixed(1)}%`
          },
          {
            label: "Total Trades",
            value: keyMetrics.totalTrades.toString()
          },
          {
            label: "Wins / Losses",
            value: `${keyMetrics.totalWins} / ${keyMetrics.totalLosses}`
          },
          {
            label: "Avg Win",
            value: formatCurrency(keyMetrics.avgWin),
            className: "text-profit"
          },
          {
            label: "Avg Loss",
            value: formatCurrency(Math.abs(keyMetrics.avgLoss)),
            className: "text-loss"
          }
        ]}
      />
      <MetricCard 
        title="Net Profit/Loss" 
        value={formatCurrency(keyMetrics.netPnL)} 
        subValue={`${keyMetrics.totalR > 0 ? '+' : ''}${(keyMetrics.totalR || 0).toFixed(2)}R`}
        className={keyMetrics.netPnL >= 0 ? "text-profit" : "text-loss"}
      />
      <MetricCard 
        title="Sortino Ratio" 
        value={(keyMetrics.sortinoRatio || 0).toFixed(2)} 
      />
    </div>
  );
}
