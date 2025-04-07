
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
  
  // Calculate average win/loss
  const avgWin = winningTrades > 0 
    ? trades.filter(trade => (trade.metrics.profitLoss || 0) > 0)
        .reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0) / winningTrades 
    : 0;
    
  const avgLoss = losingTrades > 0
    ? Math.abs(trades.filter(trade => (trade.metrics.profitLoss || 0) < 0)
        .reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0)) / losingTrades
    : 0;
  
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
    <Card className={`${getBgColor()} border shadow-sm w-full`}>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-lg text-muted-foreground">Win Rate:</span>
            <span className="text-lg font-semibold">{winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-muted-foreground">Total Trades:</span>
            <span className="text-lg font-semibold">{totalTrades}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-muted-foreground">Wins / Losses:</span>
            <span className="text-lg font-semibold">{winningTrades} / {losingTrades}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-muted-foreground">Avg Win:</span>
            <span className="text-lg font-semibold text-green-600">{formatCurrency(avgWin)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-muted-foreground">Avg Loss:</span>
            <span className="text-lg font-semibold text-red-500">{formatCurrency(avgLoss)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg text-muted-foreground">Total P&L:</span>
            <span className={`text-lg font-semibold ${totalPnL > 0 ? 'text-green-600' : totalPnL < 0 ? 'text-red-500' : ''}`}>
              {formatCurrency(totalPnL)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
