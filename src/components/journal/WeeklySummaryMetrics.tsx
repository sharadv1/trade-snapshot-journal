
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/calculations/formatters';
import { TradeWithMetrics } from '@/types';

interface WeeklySummaryMetricsProps {
  trades: TradeWithMetrics[];
}

export function WeeklySummaryMetrics({ trades }: WeeklySummaryMetricsProps) {
  const totalPnL = trades.reduce((total, trade) => total + (trade.metrics.profitLoss || 0), 0);
  
  const totalR = trades.reduce((total, trade) => total + (trade.metrics.rMultiple || 0), 0);
  
  const winCount = trades.filter(trade => (trade.metrics.profitLoss || 0) > 0).length;
  const lossCount = trades.filter(trade => (trade.metrics.profitLoss || 0) < 0).length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;
  
  const avgWin = winCount > 0 
    ? trades.filter(trade => (trade.metrics.profitLoss || 0) > 0)
      .reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0) / winCount 
    : 0;
    
  const avgLoss = lossCount > 0 
    ? trades.filter(trade => (trade.metrics.profitLoss || 0) < 0)
      .reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0) / lossCount 
    : 0;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
            <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total R</p>
            <p className={`text-xl font-bold ${totalR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalR.toFixed(2)}R
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Trades</p>
            <p className="text-xl font-bold">{trades.length}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
            <p className="text-xl font-bold">{winRate.toFixed(1)}%</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Win/Loss</p>
            <p className="text-xl font-bold">{winCount}/{lossCount}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Avg Win</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(avgWin)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Avg Loss</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(avgLoss)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
