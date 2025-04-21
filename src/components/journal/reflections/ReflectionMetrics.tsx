
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
  isFutureWeek?: boolean;
}

export function ReflectionMetrics({ 
  tradeCount, 
  totalPnL, 
  totalR, 
  winCount, 
  lossCount, 
  winRate,
  avgRPerTrade,
  isFutureWeek = false
}: ReflectionMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
        <div className="text-2xl font-semibold">
          {isFutureWeek ? '-' : tradeCount}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground mb-1">P&L</div>
        <div className={`text-2xl font-semibold ${
          !isFutureWeek && totalPnL > 0 ? 'text-green-600' : 
          !isFutureWeek && totalPnL < 0 ? 'text-red-600' : ''
        }`}>
          {isFutureWeek ? '-' : formatCurrency(totalPnL)}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground mb-1">R Multiple</div>
        <div className={`text-2xl font-semibold ${
          !isFutureWeek && totalR > 0 ? 'text-green-600' : 
          !isFutureWeek && totalR < 0 ? 'text-red-600' : ''
        }`}>
          {isFutureWeek ? '-' : `${totalR.toFixed(2)}R`}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
        <div className="text-2xl font-semibold">
          {isFutureWeek ? '-' : tradeCount > 0 ? `${winRate.toFixed(1)}%` : 'N/A'}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground mb-1">Win/Loss</div>
        <div className="text-2xl font-semibold">
          {isFutureWeek ? '-' : `${winCount}/${lossCount}`}
        </div>
      </div>
      
      <div>
        <div className="text-sm text-muted-foreground mb-1">Average R/Trade</div>
        <div className={`text-2xl font-semibold ${
          !isFutureWeek && avgRPerTrade > 0 ? 'text-green-600' : 
          !isFutureWeek && avgRPerTrade < 0 ? 'text-red-600' : ''
        }`}>
          {isFutureWeek ? '-' : tradeCount > 0 ? `${avgRPerTrade.toFixed(2)}R` : 'N/A'}
        </div>
      </div>
      
      {isFutureWeek && (
        <div className="col-span-2 md:col-span-4 bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-700 text-sm">
          This is a future week. Use this space to plan your trading strategy and goals for the upcoming week.
        </div>
      )}
    </div>
  );
}
