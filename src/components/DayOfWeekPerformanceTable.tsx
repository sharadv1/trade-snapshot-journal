
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';

interface DayOfWeekPerformanceTableProps {
  trades: TradeWithMetrics[];
  timeframes?: string[];
}

interface DayPerformance {
  pnl: number;
  count: number;
  winCount: number;
  winRate?: number; // Add winRate as an optional property
}

export function DayOfWeekPerformanceTable({ trades, timeframes = ['15m', '1h'] }: DayOfWeekPerformanceTableProps) {
  // Filter trades by timeframe if specified
  const filteredTrades = timeframes 
    ? trades.filter(trade => {
        if (!trade.timeframe) return false;
        
        // Normalize timeframes for comparison
        const normalizedTradeTimeframe = trade.timeframe.toLowerCase();
        
        // Check multiple possible formats (m15/15m, h1/1h, etc.)
        return timeframes.some(tf => {
          const normalizedTf = tf.toLowerCase();
          
          // Check for direct match
          if (normalizedTradeTimeframe === normalizedTf) return true;
          
          // Check for reversed format (m15 vs 15m, h1 vs 1h)
          if (normalizedTf.startsWith('m') && normalizedTradeTimeframe.endsWith('m')) {
            const minutes = normalizedTf.substring(1);
            if (normalizedTradeTimeframe.startsWith(minutes)) return true;
          } else if (normalizedTf.endsWith('m') && normalizedTradeTimeframe.startsWith('m')) {
            const minutes = normalizedTf.substring(0, normalizedTf.length - 1);
            if (normalizedTradeTimeframe.endsWith(minutes)) return true;
          } else if (normalizedTf.startsWith('h') && normalizedTradeTimeframe.endsWith('h')) {
            const hours = normalizedTf.substring(1);
            if (normalizedTradeTimeframe.startsWith(hours)) return true;
          } else if (normalizedTf.endsWith('h') && normalizedTradeTimeframe.startsWith('h')) {
            const hours = normalizedTf.substring(0, normalizedTf.length - 1);
            if (normalizedTradeTimeframe.endsWith(hours)) return true;
          }
          
          return false;
        });
      })
    : trades;
  
  // Get only closed trades
  const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
  
  // Initialize data for each day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPnL: Record<string, DayPerformance> = {}; // Use the DayPerformance interface
  
  daysOfWeek.forEach(day => {
    dayPnL[day] = { pnl: 0, count: 0, winCount: 0 };
  });
  
  // Calculate P&L for each day of week
  closedTrades.forEach(trade => {
    if (trade.entryDate) {
      const entryDate = new Date(trade.entryDate);
      const dayName = daysOfWeek[entryDate.getDay()];
      
      dayPnL[dayName].pnl += trade.metrics.profitLoss;
      dayPnL[dayName].count += 1;
      
      if (trade.metrics.profitLoss > 0) {
        dayPnL[dayName].winCount += 1;
      }
    }
  });
  
  // Calculate win rates
  Object.keys(dayPnL).forEach(day => {
    if (dayPnL[day].count === 0) {
      dayPnL[day].winRate = 0;
    } else {
      dayPnL[day].winRate = (dayPnL[day].winCount / dayPnL[day].count) * 100;
    }
  });
  
  return (
    <Card className="shadow-subtle border mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Performance by Day of Week {timeframes ? `(${timeframes.join(', ')} Timeframes)` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Avg per Trade</TableHead>
              <TableHead className="text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daysOfWeek.map(day => (
              <TableRow key={day}>
                <TableCell className="font-medium">{day}</TableCell>
                <TableCell className="text-right">{dayPnL[day].count}</TableCell>
                <TableCell className="text-right">
                  {dayPnL[day].count > 0 ? `${dayPnL[day].winRate?.toFixed(1)}%` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {dayPnL[day].count > 0 ? (
                    <span className={dayPnL[day].pnl / dayPnL[day].count >= 0 ? 'text-profit' : 'text-loss'}>
                      {formatCurrency(dayPnL[day].pnl / dayPnL[day].count)}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className={`text-right font-medium ${dayPnL[day].pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {dayPnL[day].count > 0 ? formatCurrency(dayPnL[day].pnl) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
