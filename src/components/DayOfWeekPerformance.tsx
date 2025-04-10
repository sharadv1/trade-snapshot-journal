
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
import { calculateExpectedValue } from '@/utils/calculations/advancedMetrics';

interface DayOfWeekPerformanceProps {
  trades: TradeWithMetrics[];
  timeframes?: string[];
}

export function DayOfWeekPerformance({ trades, timeframes = ['15m', '1h'] }: DayOfWeekPerformanceProps) {
  console.log('DayOfWeek - All trades:', trades.length);
  console.log('DayOfWeek - Looking for timeframes:', timeframes);
  
  // Filter trades by timeframe if specified
  const filteredTrades = timeframes 
    ? trades.filter(trade => {
        // Log each trade's timeframe for debugging
        console.log('Trade timeframe:', trade.timeframe);
        
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
            // m15 vs 15m
            const minutes = normalizedTf.substring(1);
            if (normalizedTradeTimeframe.startsWith(minutes)) return true;
          } else if (normalizedTf.endsWith('m') && normalizedTradeTimeframe.startsWith('m')) {
            // 15m vs m15
            const minutes = normalizedTf.substring(0, normalizedTf.length - 1);
            if (normalizedTradeTimeframe.endsWith(minutes)) return true;
          } else if (normalizedTf.startsWith('h') && normalizedTradeTimeframe.endsWith('h')) {
            // h1 vs 1h
            const hours = normalizedTf.substring(1);
            if (normalizedTradeTimeframe.startsWith(hours)) return true;
          } else if (normalizedTf.endsWith('h') && normalizedTradeTimeframe.startsWith('h')) {
            // 1h vs h1
            const hours = normalizedTf.substring(0, normalizedTf.length - 1);
            if (normalizedTradeTimeframe.endsWith(hours)) return true;
          }
          
          return false;
        });
      })
    : trades;
  
  console.log('DayOfWeek - Filtered by timeframe:', filteredTrades.length, filteredTrades.map(t => t.timeframe));
  
  // Get only closed trades
  const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
  console.log('DayOfWeek - Closed trades:', closedTrades.length);
  
  // Initialize data for each day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData: Record<string, { pnl: number, count: number, trades: TradeWithMetrics[] }> = {};
  
  daysOfWeek.forEach(day => {
    dayData[day] = { pnl: 0, count: 0, trades: [] };
  });
  
  // Calculate P&L for each day of week
  closedTrades.forEach(trade => {
    if (trade.entryDate) {
      const entryDate = new Date(trade.entryDate);
      const dayName = daysOfWeek[entryDate.getDay()];
      console.log(`Trade assigned to ${dayName}:`, trade.symbol, trade.timeframe);
      
      dayData[dayName].pnl += trade.metrics.profitLoss;
      dayData[dayName].count += 1;
      dayData[dayName].trades.push(trade);
    }
  });
  
  console.log('DayOfWeek - PnL data:', dayData);
  
  // Prepare data for chart and calculate expected value for each day
  const chartData = Object.entries(dayData)
    .map(([day, data]) => {
      // Calculate expected value for this day's trades
      const expectedValue = data.count > 0 ? calculateExpectedValue(data.trades) : 0;
      
      return {
        name: day,
        value: data.pnl,
        count: data.count,
        expectedValue: expectedValue,
        color: data.pnl >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'
      };
    });
  
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
                            <span>Expected Value:</span>
                            <span className={data.expectedValue >= 0 ? 'text-profit' : 'text-loss'}>
                              {formatCurrency(data.expectedValue)}
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
