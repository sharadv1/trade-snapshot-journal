
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { getCurrentMaxLoss } from '@/utils/maxLossStorage';
import { getCurrentMaxRisk } from '@/utils/maxRiskStorage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WeeklyPnLSummaryProps {
  trades: TradeWithMetrics[];
}

export function WeeklyPnLSummary({ trades }: WeeklyPnLSummaryProps) {
  const { weeklyPnL, isOverMaxLoss, maxLoss, openRisk, maxRisk, isOverMaxRisk } = useMemo(() => {
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
    
    // Get max risk setting
    const currentMaxRisk = getCurrentMaxRisk();
    const isExceedingMaxRisk = currentMaxRisk !== null && openPositionsRisk > currentMaxRisk;
    
    return {
      weeklyPnL: pnl,
      isOverMaxLoss: isExceedingMaxLoss,
      maxLoss: currentMaxLoss,
      openRisk: openPositionsRisk,
      maxRisk: currentMaxRisk,
      isOverMaxRisk: isExceedingMaxRisk
    };
  }, [trades]);

  return (
    <Card className={isOverMaxLoss || isOverMaxRisk ? 'border-destructive' : ''}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Open Risk Display */}
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-muted-foreground">Open Risk</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 cursor-help text-muted-foreground/70" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="max-w-xs text-xs">Total risked amount in currently open trades.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className={`text-lg font-medium ${isOverMaxRisk ? 'text-destructive' : ''}`}>
                {formatCurrency(openRisk)}
                {maxRisk !== null && (
                  <span className="text-xs text-muted-foreground ml-2">
                    / {formatCurrency(maxRisk)}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Weekly P&L */}
          <div className="border-t pt-3">
            <div className="flex items-center">
              <p className="text-sm font-medium text-muted-foreground">This Week's P&L</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 cursor-help text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="max-w-xs text-xs">Total profit or loss for trades closed this week.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className={`text-2xl font-bold ${weeklyPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrency(weeklyPnL)}
              {maxLoss !== null && (
                <span className="text-sm text-muted-foreground ml-2">
                  / Max Loss: {formatCurrency(maxLoss)}
                </span>
              )}
            </p>
          </div>
          
          {/* Warning for exceeding max risk */}
          {isOverMaxRisk && (
            <Alert variant="destructive" className="mt-2 bg-destructive/10 border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                Warning: You've exceeded your maximum risk threshold.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Warning for exceeding max loss */}
          {isOverMaxLoss && (
            <Alert variant="destructive" className="mt-2 bg-destructive/10 border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                Warning: You've exceeded your weekly maximum loss threshold.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
