
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';

interface WeeklySummaryMetricsProps {
  trades: TradeWithMetrics[];
}

export function WeeklySummaryMetrics({ trades }: WeeklySummaryMetricsProps) {
  const metrics = useMemo(() => {
    let totalPnL = 0;
    let winCount = 0;
    let lossCount = 0;
    let totalRValue = 0;
    const strategies = new Map<string, { count: number, pnl: number }>();
    
    trades.forEach(trade => {
      if (trade.metrics.profitLoss !== undefined) {
        totalPnL += trade.metrics.profitLoss;
        
        if (trade.metrics.profitLoss >= 0) {
          winCount++;
        } else {
          lossCount++;
        }
        
        if (trade.metrics.riskRewardRatio !== undefined) {
          totalRValue += trade.metrics.riskRewardRatio;
        }
        
        // Track strategy performance
        if (trade.strategy) {
          const strategyStats = strategies.get(trade.strategy) || { count: 0, pnl: 0 };
          strategyStats.count++;
          strategyStats.pnl += trade.metrics.profitLoss;
          strategies.set(trade.strategy, strategyStats);
        }
      }
    });
    
    // Calculate win rate
    const totalTrades = winCount + lossCount;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    
    // Calculate average R
    const averageR = totalTrades > 0 ? totalRValue / totalTrades : 0;
    
    // Sort strategies by performance
    const sortedStrategies = Array.from(strategies.entries())
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .slice(0, 3); // Top 3 strategies
    
    return {
      totalPnL,
      winCount,
      lossCount,
      totalTrades,
      winRate,
      averageR,
      topStrategies: sortedStrategies
    };
  }, [trades]);
  
  if (metrics.totalTrades === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No trades recorded for this week</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total P&L:</span>
              <span className={`text-xl font-bold ${metrics.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatCurrency(metrics.totalPnL)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Trades:</span>
              <span className="text-lg">{metrics.totalTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Win Rate:</span>
              <span className="text-lg">{metrics.winRate.toFixed(2)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Wins:</span>
              <span className="text-lg text-profit">{metrics.winCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Losses:</span>
              <span className="text-lg text-loss">{metrics.lossCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average R:</span>
              <span className="text-lg">{metrics.averageR.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-2">Top Strategies:</h3>
            {metrics.topStrategies.length > 0 ? (
              metrics.topStrategies.map(([strategy, stats]) => (
                <div key={strategy} className="flex justify-between items-center">
                  <span className="text-sm truncate">{strategy}</span>
                  <span className={`${stats.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(stats.pnl)} ({stats.count})
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No strategies recorded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
