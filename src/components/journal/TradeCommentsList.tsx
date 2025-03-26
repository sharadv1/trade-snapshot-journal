
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/calculations/formatters';
import { TradeWithMetrics } from '@/types';

interface TradeCommentsListProps {
  trades: TradeWithMetrics[];
}

export function TradeCommentsList({ trades }: TradeCommentsListProps) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trades This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No trades found for this week.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trades This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {trades.map(trade => (
              <div key={trade.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {trade.symbol} {trade.direction === 'long' ? 'Long' : 'Short'}
                    </h3>
                    <Badge variant="outline">
                      {trade.strategy || 'No Strategy'}
                    </Badge>
                  </div>
                  <div className={`font-medium ${trade.metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trade.metrics.profitLoss)}
                    {trade.metrics.riskRewardRatio !== undefined && (
                      <span className="ml-2">
                        ({trade.metrics.riskRewardRatio > 0 ? '+' : ''}{trade.metrics.riskRewardRatio.toFixed(1)}R)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    {trade.entryDate && format(parseISO(trade.entryDate), 'MMM d, yyyy')} → {trade.exitDate && format(parseISO(trade.exitDate), 'MMM d, yyyy')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entry: </span>
                    {formatCurrency(trade.entryPrice)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exit: </span>
                    {formatCurrency(trade.exitPrice || 0)}
                  </div>
                </div>
                
                {trade.notes && trade.notes.trim() !== '' && (
                  <div className="bg-accent/50 p-3 rounded-md whitespace-pre-wrap text-sm mt-2">
                    {trade.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
