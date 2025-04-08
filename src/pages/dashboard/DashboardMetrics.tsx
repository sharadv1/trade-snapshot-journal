
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
import { useMemo } from 'react';
import { getCurrentMaxLoss } from '@/utils/maxLossStorage';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  // Calculate weekly P&L and open risk
  const weeklyData = useMemo(() => {
    // Get current week's date range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday as first day
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Filter trades for current week
    const thisWeekTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate);
      return tradeDate >= weekStart && tradeDate <= weekEnd;
    });
    
    // Calculate PnL for the week
    const pnl = thisWeekTrades.reduce((total, trade) => {
      return total + (trade.metrics?.profitLoss || 0);
    }, 0);
    
    // Calculate open risk (sum of risked amount for open trades)
    const openPositionsRisk = trades
      .filter(trade => trade.status === 'open' && trade.metrics?.riskedAmount)
      .reduce((total, trade) => total + (trade.metrics.riskedAmount || 0), 0);
    
    // Check if loss exceeds max loss
    const currentMaxLoss = getCurrentMaxLoss();
    const isExceedingMaxLoss = currentMaxLoss !== null && pnl < 0 && Math.abs(pnl) >= Math.abs(currentMaxLoss);
    
    return {
      weeklyPnL: pnl,
      isOverMaxLoss: isExceedingMaxLoss,
      maxLoss: currentMaxLoss,
      openRisk: openPositionsRisk
    };
  }, [trades]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Key Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard 
          title="Key Trading Stats" 
          subStats={[
            {
              label: "Net P&L",
              value: formatCurrency(keyMetrics.netPnL),
              className: keyMetrics.netPnL >= 0 ? "text-profit font-bold" : "text-loss font-bold"
            },
            {
              label: "Total R",
              value: `${keyMetrics.totalR > 0 ? '+' : ''}${(keyMetrics.totalR || 0).toFixed(2)}R`,
              className: keyMetrics.totalR >= 0 ? "text-profit" : "text-loss"
            },
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

        {/* Risk and Weekly P&L information */}
        <div className="space-y-4">
          <MetricCard 
            title="Open Risk" 
            value={formatCurrency(weeklyData.openRisk)}
            tooltip="Total risked amount in currently open trades"
          />
          
          <MetricCard 
            title="This Week's P&L" 
            value={formatCurrency(weeklyData.weeklyPnL)}
            className={weeklyData.weeklyPnL >= 0 ? "text-profit" : "text-loss"}
            subValue={weeklyData.maxLoss !== null ? `Max Loss: ${formatCurrency(weeklyData.maxLoss)}` : undefined}
            tooltip="Total profit or loss for trades closed this week"
          >
            {weeklyData.isOverMaxLoss && (
              <Alert variant="destructive" className="mt-2 bg-destructive/10 border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  Warning: You've exceeded your weekly maximum loss threshold.
                </AlertDescription>
              </Alert>
            )}
          </MetricCard>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
  );
}
