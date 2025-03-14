
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMetrics, TradeWithMetrics } from '@/types';
import { calculatePerformanceMetrics, formatCurrency, formatPercentage } from '@/utils/tradeCalculations';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface TradeMetricsProps {
  trades: TradeWithMetrics[];
}

export function TradeMetrics({ trades }: TradeMetricsProps) {
  const metrics = calculatePerformanceMetrics(trades);
  
  // Prepare data for win/loss ratio pie chart
  const winLossData = [
    { name: 'Win', value: metrics.winningTrades, color: 'hsl(142, 76%, 36%)' },
    { name: 'Loss', value: metrics.losingTrades, color: 'hsl(0, 84%, 60%)' },
  ];
  
  // Prepare data for PnL by trade type
  const pnlByType = trades.reduce((acc, trade) => {
    if (trade.status !== 'closed') return acc;
    
    const type = trade.type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += trade.metrics.profitLoss;
    return acc;
  }, {} as Record<string, number>);
  
  const pnlByTypeData = Object.entries(pnlByType).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value,
    color: value >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'
  }));

  // Calculate daily performance over time (last 30 days)
  const last30Days = getPerformanceByDay(trades, 30);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} />
        <MetricCard title="Profit Factor" value={metrics.profitFactor.toFixed(2)} />
        <MetricCard 
          title="Net Profit/Loss" 
          value={formatCurrency(metrics.netProfit)} 
          className={metrics.netProfit >= 0 ? "text-profit" : "text-loss"}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-subtle border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Win/Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} trades`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-subtle border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">P&L by Instrument Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                  />
                  <Bar dataKey="value">
                    {pnlByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-subtle border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Performance History (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => value.substring(5)} // Show only MM-DD
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('$', '')} 
                />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: number) => [formatCurrency(value), 'P&L']}
                />
                <Bar dataKey="pnl">
                  {last30Days.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pnl >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Trades" value={metrics.totalTrades.toString()} />
        <MetricCard title="Average Win" value={formatCurrency(metrics.averageWin)} />
        <MetricCard title="Average Loss" value={formatCurrency(Math.abs(metrics.averageLoss))} />
        <MetricCard title="Expectancy" value={formatCurrency(metrics.expectancy)} />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  className?: string;
}

function MetricCard({ title, value, className }: MetricCardProps) {
  return (
    <Card className="shadow-subtle border">
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold mt-1 ${className}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

// Helper to group trades by date and calculate daily P&L
function getPerformanceByDay(trades: TradeWithMetrics[], days: number = 30): { date: string; pnl: number }[] {
  const result: { date: string; pnl: number }[] = [];
  
  // Create a map for dates with closed trades in the last N days
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  
  // Initialize the date array with the past N days
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    result.push({ date: dateString, pnl: 0 });
  }
  
  // Sum P&L for trades on each day
  trades.forEach(trade => {
    if (trade.status !== 'closed' || !trade.exitDate) return;
    
    const exitDate = trade.exitDate.split('T')[0];
    
    // Only include dates within our range
    const itemIndex = result.findIndex(item => item.date === exitDate);
    if (itemIndex !== -1) {
      result[itemIndex].pnl += trade.metrics.profitLoss;
    }
  });
  
  return result;
}
