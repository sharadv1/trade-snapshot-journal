
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMetrics, TradeWithMetrics } from '@/types';
import { calculatePerformanceMetrics, formatCurrency, formatPercentage } from '@/utils/tradeCalculations';
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
import { TradePnLCalendar } from './TradePnLCalendar';
import { CumulativePnLChart } from './CumulativePnLChart';

interface TradeMetricsProps {
  trades: TradeWithMetrics[];
}

export function TradeMetrics({ trades }: TradeMetricsProps) {
  const metrics = calculatePerformanceMetrics(trades);
  
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

  // Prepare data for P&L by strategy
  const pnlByStrategy = trades.reduce((acc, trade) => {
    if (trade.status !== 'closed' || !trade.strategy) return acc;
    
    const strategy = trade.strategy;
    if (!acc[strategy]) acc[strategy] = { pnl: 0, count: 0 };
    acc[strategy].pnl += trade.metrics.profitLoss;
    acc[strategy].count += 1;
    return acc;
  }, {} as Record<string, { pnl: number, count: number }>);
  
  const pnlByStrategyData = Object.entries(pnlByStrategy)
    .map(([strategy, data]) => ({
      name: strategy,
      value: data.pnl,
      count: data.count,
      color: data.pnl >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)); // Sort by absolute P&L value

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} />
        <MetricCard title="Profit Factor" value={metrics.profitFactor.toFixed(2)} />
        <MetricCard title="Sortino Ratio" value={metrics.sortinoRatio.toFixed(2)} />
        <MetricCard 
          title="Net Profit/Loss" 
          value={formatCurrency(metrics.netProfit)} 
          className={metrics.netProfit >= 0 ? "text-profit" : "text-loss"}
        />
      </div>
      
      <CumulativePnLChart trades={trades} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-subtle border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">P&L by Instrument Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                    labelFormatter={(label) => `Type: ${label}`}
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
        
        <Card className="shadow-subtle border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">P&L by Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlByStrategyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                    labelFormatter={(label) => `Strategy: ${label}`}
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
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value">
                    {pnlByStrategyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <TradePnLCalendar />
      
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
