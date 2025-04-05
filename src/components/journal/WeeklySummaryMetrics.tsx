
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';

interface WeeklySummaryMetricsProps {
  trades: TradeWithMetrics[];
}

export function WeeklySummaryMetrics({ trades = [] }: WeeklySummaryMetricsProps) {
  // Calculate summary metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => (trade.metrics.profitLoss || 0) > 0).length;
  const losingTrades = trades.filter(trade => (trade.metrics.profitLoss || 0) < 0).length;
  
  // Avoid division by zero
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  // Calculate P&L
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
  
  // Calculate average R
  const tradesWithR = trades.filter(trade => trade.metrics.riskRewardRatio !== undefined);
  const totalR = tradesWithR.reduce((sum, trade) => sum + (trade.metrics.riskRewardRatio || 0), 0);
  const avgR = tradesWithR.length > 0 ? totalR / tradesWithR.length : 0;
  
  // Define background colors based on P&L
  const getBgColor = () => {
    if (totalPnL > 0) return 'bg-green-50 dark:bg-green-950/30';
    if (totalPnL < 0) return 'bg-red-50 dark:bg-red-950/30';
    return 'bg-gray-50 dark:bg-gray-800/30';
  };

  return (
    <Card className={`${getBgColor()} border-0 shadow-sm`}>
      <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
        <div className="text-center p-3">
          <p className="text-sm text-muted-foreground">Total Trades</p>
          <p className="text-2xl font-bold">{totalTrades}</p>
        </div>
        
        <div className="text-center p-3">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
        </div>
        
        <div className="text-center p-3">
          <p className="text-sm text-muted-foreground">Total P&L</p>
          <p className={`text-2xl font-bold ${totalPnL > 0 ? 'text-green-600' : totalPnL < 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(totalPnL)}
          </p>
        </div>
        
        <div className="text-center p-3">
          <p className="text-sm text-muted-foreground">W/L Ratio</p>
          <p className="text-2xl font-bold">
            {losingTrades > 0 
              ? (winningTrades / losingTrades).toFixed(2) 
              : winningTrades > 0 
                ? "∞" 
                : "0.00"}
          </p>
        </div>
        
        <div className="text-center p-3">
          <p className="text-sm text-muted-foreground">Avg R</p>
          <p className={`text-2xl font-bold ${avgR > 0 ? 'text-green-600' : avgR < 0 ? 'text-red-600' : ''}`}>
            {avgR.toFixed(2)}R
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
