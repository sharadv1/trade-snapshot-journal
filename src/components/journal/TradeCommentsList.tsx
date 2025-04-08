
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/utils/calculations/formatters';
import { TradeWithMetrics } from '@/types';
import { useNavigate } from 'react-router-dom';

interface TradeCommentsListProps {
  trades: TradeWithMetrics[];
  groupByStrategy?: boolean;
  listTitle?: string;
}

export function TradeCommentsList({ 
  trades, 
  groupByStrategy = false,
  listTitle = "Trades This Week"
}: TradeCommentsListProps) {
  const navigate = useNavigate();
  
  const groupedTrades = useMemo(() => {
    if (!groupByStrategy) return { 'All Trades': trades };
    
    const groups: Record<string, TradeWithMetrics[]> = {};
    
    trades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy';
      if (!groups[strategy]) {
        groups[strategy] = [];
      }
      groups[strategy].push(trade);
    });
    
    // Sort strategies alphabetically
    return Object.keys(groups)
      .sort()
      .reduce((acc, strategy) => {
        acc[strategy] = groups[strategy];
        return acc;
      }, {} as Record<string, TradeWithMetrics[]>);
  }, [trades, groupByStrategy]);
  
  const handleTradeClick = (tradeId: string) => {
    // Store the current journal tab in session storage before navigating
    const currentTab = document.querySelector('[data-state="active"][data-radix-collection-item]')?.getAttribute('value');
    if (currentTab) {
      sessionStorage.setItem('journal-active-tab', currentTab);
    }
    
    navigate(`/trade/${tradeId}`);
  };
  
  if (trades.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{listTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No trades found for this period.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{listTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedTrades).map(([strategy, strategyTrades]) => (
              <div key={strategy} className="space-y-4">
                {groupByStrategy && (
                  <div className="border-b pb-1 mb-2">
                    <h3 className="font-medium text-lg">
                      {strategy}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({strategyTrades.length} {strategyTrades.length === 1 ? 'trade' : 'trades'})
                      </span>
                    </h3>
                  </div>
                )}
                
                {strategyTrades.map(trade => {
                  // Calculate days held
                  const daysHeld = trade.entryDate && trade.exitDate 
                    ? differenceInDays(parseISO(trade.exitDate), parseISO(trade.entryDate)) 
                    : 0;
                    
                  return (
                    <div 
                      key={trade.id} 
                      className="border-b pb-4 last:border-b-0 hover:bg-accent/30 rounded-md p-3 cursor-pointer transition-colors"
                      onClick={() => handleTradeClick(trade.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {trade.symbol} {trade.direction === 'long' ? 'Long' : 'Short'}
                          </h3>
                          {!groupByStrategy && (
                            <Badge variant="outline">
                              {trade.strategy || 'No Strategy'}
                            </Badge>
                          )}
                        </div>
                        <div className={`font-medium ${trade.metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(trade.metrics.profitLoss)}
                          {trade.metrics.rMultiple !== undefined && (
                            <span className="ml-2">
                              ({trade.metrics.rMultiple > 0 ? '+' : ''}{trade.metrics.rMultiple.toFixed(2)}R)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Held: </span>
                          {daysHeld} {daysHeld === 1 ? 'day' : 'days'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entry: </span>
                          {formatCurrency(trade.entryPrice)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exit: </span>
                          {formatCurrency(trade.exitPrice || 0)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">R:R setup: </span>
                          {trade.metrics.riskRewardRatio !== undefined ? `1:${trade.metrics.riskRewardRatio.toFixed(2)}` : "N/A"}
                        </div>
                      </div>
                      
                      {trade.notes && trade.notes.trim() !== '' && (
                        <div className="bg-accent/50 p-3 rounded-md whitespace-pre-wrap text-sm mt-2">
                          {trade.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
