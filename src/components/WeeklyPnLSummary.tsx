
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { getCurrentMaxLoss } from '@/utils/maxLossStorage';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WeeklyPnLSummaryProps {
  trades: TradeWithMetrics[];
}

export function WeeklyPnLSummary({ trades }: WeeklyPnLSummaryProps) {
  const { weeklyPnL, isOverMaxLoss, maxLoss, openRisk } = useMemo(() => {
    // Get current week's date range
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday as first day
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    // Filter trades for current week
    const thisWeekTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate);
      return isWithinInterval(tradeDate, { start: weekStart, end: weekEnd });
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
    const isExceedingMaxLoss = currentMaxLoss !== null && pnl < 0 && pnl <= currentMaxLoss;
    
    return {
      weeklyPnL: pnl,
      isOverMaxLoss: isExceedingMaxLoss,
      maxLoss: currentMaxLoss,
      openRisk: openPositionsRisk
    };
  }, [trades]);

  return (
    <Card className={isOverMaxLoss ? 'border-destructive' : ''}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Open Risk Display - New */}
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
              <p className="text-lg font-medium">
                {formatCurrency(openRisk)}
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
            </p>
            
            {maxLoss !== null && (
              <div className="text-sm text-muted-foreground mt-1">
                Max Loss: {formatCurrency(maxLoss)}
              </div>
            )}
          </div>
          
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
