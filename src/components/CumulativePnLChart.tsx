import { useMemo } from 'react';
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
  ResponsiveContainer,
  Legend
} from 'recharts';

interface CumulativePnLChartProps {
  trades: TradeWithMetrics[];
}

interface ChartDataPoint {
  date: string;
  formattedDate: string;
  timestamp: number;
  total: number;
  [key: string]: number | string; // For strategy-specific data
}

export function CumulativePnLChart({ trades }: CumulativePnLChartProps) {
  // Sort and prepare data for chart (only closed trades)
  const { chartData, strategies } = useMemo(() => {
    // Filter by closed trades and sort by exit date
    const closedTrades = trades
      .filter(trade => trade.status === 'closed' && trade.exitDate)
      .sort((a, b) => {
        const dateA = new Date(a.exitDate || 0).getTime();
        const dateB = new Date(b.exitDate || 0).getTime();
        return dateA - dateB;
      });
    
    // Get unique strategies
    const uniqueStrategies = Array.from(
      new Set(
        closedTrades
          .filter(trade => trade.strategy)
          .map(trade => trade.strategy as string)
      )
    );
    
    // Prepare data points by date
    const dataByDate = new Map<string, ChartDataPoint>();
    
    // Initialize strategy cumulative values
    const strategyCumulatives: Record<string, number> = {};
    uniqueStrategies.forEach(strategy => {
      strategyCumulatives[strategy] = 0;
    });
    
    let totalCumulative = 0;

    // Process each trade
    closedTrades.forEach(trade => {
      if (!trade.exitDate) return;
      
      const exitDate = new Date(trade.exitDate);
      const dateKey = format(exitDate, 'yyyy-MM-dd');
      const formattedDate = format(exitDate, 'MMM d, yyyy');
      const timestamp = exitDate.getTime();
      
      // Update total cumulative P&L
      totalCumulative += trade.metrics.profitLoss;
      
      // Update strategy-specific cumulative P&L
      if (trade.strategy) {
        strategyCumulatives[trade.strategy] = 
          (strategyCumulatives[trade.strategy] || 0) + trade.metrics.profitLoss;
      }
      
      // Create or update data point
      if (!dataByDate.has(dateKey)) {
        const dataPoint: ChartDataPoint = {
          date: dateKey,
          formattedDate,
          timestamp,
          total: totalCumulative,
        };
        
        // Add strategy-specific values
        uniqueStrategies.forEach(strategy => {
          dataPoint[strategy] = strategyCumulatives[strategy];
        });
        
        dataByDate.set(dateKey, dataPoint);
      } else {
        // Update existing data point
        const dataPoint = dataByDate.get(dateKey)!;
        dataPoint.total = totalCumulative;
        
        // Update strategy values
        uniqueStrategies.forEach(strategy => {
          dataPoint[strategy] = strategyCumulatives[strategy];
        });
      }
    });
    
    // Convert map to array and sort by timestamp
    const chartData = Array.from(dataByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return { chartData, strategies: uniqueStrategies };
  }, [trades]);

  // Define strategy colors
  const strategyColors = [
    '#2563eb', // Blue
    '#059669', // Green
    '#d946ef', // Purple
    '#f59e0b', // Amber
    '#dc2626', // Red
    '#6366f1', // Indigo
    '#0891b2', // Cyan
  ];

  // Determine chart colors for the total line
  const isPositive = chartData.length > 0 && chartData[chartData.length - 1]?.total >= 0;
  const totalLineColor = isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';

  if (chartData.length === 0) {
    return (
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle className="text-base font-medium">Cumulative Profit & Loss</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
          No closed trades to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle className="text-base font-medium">Cumulative Profit & Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
                tickFormatter={(value) => {
                  // Format the date to show month and day only
                  const parts = value.split(',')[0].split(' ');
                  return `${parts[0]} ${parts[1]}`;
                }}
                height={50}
                minTickGap={30}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(Number(value)).replace('$', '')}
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip 
                content={({active, payload, label}) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background p-3 border rounded shadow-md">
                        <div className="font-medium mb-1">{label}</div>
                        {payload.map((entry, index) => {
                          const value = Number(entry.value);
                          const name = entry.name === 'total' ? 'Overall P&L' : entry.name;
                          return (
                            <div key={`tooltip-${index}`} className="flex justify-between gap-4 text-sm">
                              <span className="flex items-center">
                                <span 
                                  className="inline-block w-3 h-3 mr-2 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                ></span>
                                {name}:
                              </span>
                              <span className={value >= 0 ? 'text-profit' : 'text-loss'}>
                                {formatCurrency(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value) => value === 'total' ? 'Overall P&L' : value}
              />
              
              {/* Line for overall P&L */}
              <Line 
                type="monotone" 
                dataKey="total" 
                name="total"
                stroke={totalLineColor} 
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1 }}
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
              
              {/* Lines for each strategy */}
              {strategies.map((strategy, index) => (
                <Line 
                  key={strategy}
                  type="monotone" 
                  dataKey={strategy} 
                  name={strategy}
                  stroke={strategyColors[index % strategyColors.length]} 
                  strokeWidth={1.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
