
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface DayOfWeekPerformanceProps {
  trades: TradeWithMetrics[];
  timeframes?: string[];
}

export function DayOfWeekPerformance({ trades, timeframes = ['15m', '1h'] }: DayOfWeekPerformanceProps) {
  console.log('DayOfWeek - All trades:', trades.length);
  
  // Filter trades by timeframe if specified
  const filteredTrades = timeframes 
    ? trades.filter(trade => {
        // Log each trade's timeframe for debugging
        console.log('Trade timeframe:', trade.timeframe);
        // Check if the trade has a timeframe, and if it matches one of the specified timeframes
        // Handle both lowercase and uppercase variations of timeframes
        return trade.timeframe && timeframes.some(tf => 
          trade.timeframe?.toLowerCase() === tf.toLowerCase()
        );
      })
    : trades;
  
  console.log('DayOfWeek - Filtered by timeframe:', filteredTrades.length);
  
  // Get only closed trades
  const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
  console.log('DayOfWeek - Closed trades:', closedTrades.length);
  
  // Initialize data for each day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPnL: Record<string, { pnl: number, count: number }> = {};
  
  daysOfWeek.forEach(day => {
    dayPnL[day] = { pnl: 0, count: 0 };
  });
  
  // Calculate P&L for each day of week
  closedTrades.forEach(trade => {
    if (trade.entryDate) {
      const entryDate = new Date(trade.entryDate);
      const dayName = daysOfWeek[entryDate.getDay()];
      console.log(`Trade assigned to ${dayName}:`, trade.symbol, trade.timeframe);
      
      dayPnL[dayName].pnl += trade.metrics.profitLoss;
      dayPnL[dayName].count += 1;
    }
  });
  
  console.log('DayOfWeek - PnL data:', dayPnL);
  
  // Prepare data for chart
  const chartData = Object.entries(dayPnL)
    .map(([day, data]) => ({
      name: day,
      value: data.pnl,
      count: data.count,
      color: data.pnl >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'
    }));
  
  return (
    <Card className="shadow-subtle border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Performance by Day of Week {timeframes ? `(${timeframes.join(', ')} Timeframes)` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'P&L']}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background p-2 border rounded shadow text-sm">
                        <div className="font-medium">{label}</div>
                        <div className="flex justify-between gap-4">
                          <span>P&L:</span>
                          <span className={data.value >= 0 ? 'text-profit' : 'text-loss'}>
                            {formatCurrency(data.value)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Trades:</span>
                          <span>{data.count}</span>
                        </div>
                        {data.count > 0 && (
                          <div className="flex justify-between gap-4">
                            <span>Avg per Trade:</span>
                            <span className={data.value >= 0 ? 'text-profit' : 'text-loss'}>
                              {formatCurrency(data.value / data.count)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
