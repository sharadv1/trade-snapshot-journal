
import React from 'react';
import { formatCurrency } from '@/utils/calculations/formatters';
import { calculateExpectedValue } from '@/utils/calculations/advancedMetrics';

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
  // Calculate expected value using the formula from dashboard:
  // (Win Rate * Average Win) - (Loss Rate * Average Loss)
  // Rather than passing an incomplete trade object, we'll calculate it directly
  
  const lossRate = tradeCount > 0 ? lossCount / tradeCount : 0;
  
  const avgWin = winCount > 0 
    ? totalPnL > 0 ? totalPnL / winCount : 0
    : 0;
    
  const avgLoss = lossCount > 0 
    ? totalPnL < 0 ? Math.abs(totalPnL) / lossCount : 0
    : 0;
  
  const expectedValue = (winRate / 100 * avgWin) - (lossRate * avgLoss);

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
        <div className={`font-semibold ${expectedValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(expectedValue)}
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
