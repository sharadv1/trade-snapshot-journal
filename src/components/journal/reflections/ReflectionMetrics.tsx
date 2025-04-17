
import React from 'react';
import { formatCurrency } from '@/utils/calculations/formatters';

interface ReflectionMetricsProps {
  tradeCount: number;
  totalPnL: number;
  totalR: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgRPerTrade: number;
}

export const ReflectionMetrics = ({ 
  tradeCount, 
  totalPnL, 
  totalR, 
  winCount, 
  lossCount, 
  winRate,
  avgRPerTrade 
}: ReflectionMetricsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
      <div className="bg-accent/10 rounded-lg p-3 text-center w-[140px]">
        <div className="text-sm text-muted-foreground mb-1">Trades</div>
        <div className="font-semibold">{tradeCount}</div>
      </div>
      
      <div className="bg-accent/10 rounded-lg p-3 text-center w-[140px]">
        <div className="text-sm text-muted-foreground mb-1">Total R</div>
        <div className={`font-semibold ${totalR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {totalR > 0 ? '+' : ''}{totalR.toFixed(2)}R
        </div>
      </div>
      
      <div className="bg-accent/10 rounded-lg p-3 text-center w-[140px]">
        <div className="text-sm text-muted-foreground mb-1">Expected Value</div>
        <div className={`font-semibold ${avgRPerTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {avgRPerTrade > 0 ? '+' : ''}{avgRPerTrade.toFixed(2)}R
        </div>
      </div>
      
      <div className="bg-accent/10 rounded-lg p-3 text-center w-[140px]">
        <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
        <div className="font-semibold">{winRate.toFixed(1)}%</div>
      </div>
      
      <div className="bg-accent/10 rounded-lg p-3 text-center w-[140px]">
        <div className="text-sm text-muted-foreground mb-1">P&L</div>
        <div className={`font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalPnL)}
        </div>
      </div>
    </div>
  );
};
