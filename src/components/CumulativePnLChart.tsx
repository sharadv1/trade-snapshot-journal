
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeWithMetrics } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/tradeCalculations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  ChartContainer,
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';

interface CumulativePnLChartProps {
  trades: TradeWithMetrics[];
}

interface ChartDataPoint {
  date: string;
  pnl: number;
  daily: number;
  symbol: string;
}

export function CumulativePnLChart({ trades }: CumulativePnLChartProps) {
  // Sort and prepare data for chart (only closed trades)
  const chartData = useMemo(() => {
    // Filter by closed trades and sort by exit date
    const closedTrades = trades
      .filter(trade => trade.status === 'closed' && trade.exitDate)
      .sort((a, b) => {
        const dateA = new Date(a.exitDate || 0).getTime();
        const dateB = new Date(b.exitDate || 0).getTime();
        return dateA - dateB;
      });
    
    // Calculate cumulative P&L over time
    let cumulative = 0;
    return closedTrades.map(trade => {
      cumulative += trade.metrics.profitLoss;
      return {
        date: format(new Date(trade.exitDate!), 'MMM d, yyyy'),
        pnl: cumulative,
        daily: trade.metrics.profitLoss,
        symbol: trade.symbol
      };
    });
  }, [trades]);

  // Determine chart colors
  const isPositive = chartData.length > 0 && chartData[chartData.length - 1]?.pnl >= 0;
  const lineColor = isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';

  const chartConfig = {
    pnl: {
      label: "Cumulative P&L",
      color: lineColor
    }
  };

  return (
    <Card className="shadow-subtle border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Cumulative Profit & Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No closed trades to display
            </div>
          ) : (
            <ChartContainer config={chartConfig}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  tickFormatter={(value) => value.split(' ')[1]} // Show only the day part
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(Number(value)).replace('$', '')}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip 
                  content={({active, payload, label}) => {
                    if (active && payload && payload.length) {
                      const pnlValue = Number(payload[0].value);
                      const dailyValue = Number(payload[0].payload.daily);
                      
                      return (
                        <div className="bg-background p-3 border rounded shadow-md">
                          <div className="font-medium mb-1">{label}</div>
                          <div className="flex justify-between gap-4 text-sm">
                            <span>Cumulative:</span>
                            <span className={pnlValue >= 0 ? 'text-profit' : 'text-loss'}>
                              {formatCurrency(pnlValue)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 text-sm">
                            <span>Daily P&L:</span>
                            <span className={dailyValue >= 0 ? 'text-profit' : 'text-loss'}>
                              {formatCurrency(dailyValue)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {payload[0].payload.symbol}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke={lineColor} 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5, strokeWidth: 1 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
