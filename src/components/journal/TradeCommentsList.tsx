
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
  // Filter only trades with notes
  const tradesWithNotes = trades.filter(trade => trade.notes && trade.notes.trim() !== '');
  
  if (tradesWithNotes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No comments found for trades this week.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {tradesWithNotes.map(trade => (
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
                
                <div className="text-xs text-muted-foreground mb-2">
                  {trade.entryDate && format(parseISO(trade.entryDate), 'MMM d, yyyy')} → {trade.exitDate && format(parseISO(trade.exitDate), 'MMM d, yyyy')}
                </div>
                
                <div className="bg-accent/50 p-3 rounded-md whitespace-pre-wrap text-sm">
                  {trade.notes}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
