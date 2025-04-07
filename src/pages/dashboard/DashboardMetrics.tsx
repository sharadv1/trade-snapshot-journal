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
} from './dashboardUtils';
import {
  calculateProfitFactor,
  calculateCalmarRatio,
  calculateParetoIndex,
  calculateExpectedValue
} from '@/utils/calculations/advancedMetrics';

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
    avgWin: calculateAverageWin(trades) || 0,
    avgLoss: calculateAverageLoss(trades) || 0,
    totalR: calculateTotalR(trades) || 0,
    // Advanced metrics
    profitFactor: calculateProfitFactor(trades) || 0,
    calmarRatio: calculateCalmarRatio(trades) || 0,
    paretoIndex: calculateParetoIndex(trades) || 0,
    expectedValue: calculateExpectedValue(trades) || 0
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* First row of metrics - vertical layout on the left */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Net P&L card - moved to the top */}
        <div className="md:col-span-1">
          <MetricCard 
            title="Net P&L" 
            value={formatCurrency(keyMetrics.netPnL)} 
            subValue={`${keyMetrics.totalR > 0 ? '+' : ''}${(keyMetrics.totalR || 0).toFixed(2)}R`}
            className={keyMetrics.netPnL >= 0 ? "text-profit" : "text-loss"}
          />
        </div>

        {/* Key Trading Stats card - now positioned after Net P&L */}
        <div className="md:col-span-2">
          <MetricCard 
            title="Key Trading Stats" 
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
        </div>

        {/* Other metrics in a more compact layout */}
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard 
              title="Profit Factor" 
              value={isFinite(keyMetrics.profitFactor) ? (keyMetrics.profitFactor || 0).toFixed(2) : "∞"} 
              tooltip="Gross Profit / Gross Loss"
            />
            <MetricCard 
              title="Expected Value" 
              value={formatCurrency(keyMetrics.expectedValue)}
              className={keyMetrics.expectedValue >= 0 ? "text-profit" : "text-loss"}
              tooltip="(Win Rate × Avg Win) - (Loss Rate × Avg Loss)"
            />
            <MetricCard 
              title="Calmar Ratio" 
              value={(keyMetrics.calmarRatio || 0).toFixed(2)}
              tooltip="Annualized Return / Maximum Drawdown"
            />
            <MetricCard 
              title="Pareto Index" 
              value={`${(keyMetrics.paretoIndex || 0).toFixed(1)}%`}
              tooltip="% of profits from top 20% of trades"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
