import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeWithMetrics } from '@/types';
import { calculateTradeMetrics, formatCurrency, formatPercentage } from '@/utils/calculations';
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

interface TradeMetricsProps {
  trades: TradeWithMetrics[];
  showOnlyKeyMetrics?: boolean;
}

// Helper function to calculate performance metrics from trade data
const calculatePerformanceMetrics = (trades: TradeWithMetrics[]) => {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss <= 0);
  
  const totalTrades = closedTrades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0));
  
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  const netProfit = totalProfit - totalLoss;
  
  const averageWin = winningTrades.length > 0 
    ? totalProfit / winningTrades.length 
    : 0;
    
  const averageLoss = losingTrades.length > 0 
    ? -totalLoss / losingTrades.length 
    : 0;
  
  // Updated Expectancy calculation
  let expectancy;
  // Get trades with valid risk values
  const tradesWithRisk = closedTrades.filter(trade => 
    trade.metrics.riskedAmount && trade.metrics.riskedAmount > 0
  );
  
  if (tradesWithRisk.length === 0) {
    expectancy = (winRate / 100) * averageWin - (1 - winRate / 100) * Math.abs(averageLoss);
  } else {
    // Calculate using R multiples
    let totalRMultiple = 0;
    for (const trade of tradesWithRisk) {
      const rMultiple = trade.metrics.profitLoss / trade.metrics.riskedAmount;
      totalRMultiple += rMultiple;
    }
    expectancy = tradesWithRisk.length > 0 ? totalRMultiple / tradesWithRisk.length : 0;
  }
  
  // Calculate Sortino ratio (using 0% as risk-free rate and considering only downside deviation)
  const returns = closedTrades.map(trade => trade.metrics.profitLossPercentage / 100);
  const negativeReturns = returns.filter(r => r < 0);
  const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
  const downsideDeviation = negativeReturns.length > 0
    ? Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length)
    : 0.0001; // Avoid division by zero
  const sortinoRatio = downsideDeviation > 0 ? avgReturn / downsideDeviation : 0;
  
  return {
    totalTrades,
    winRate,
    profitFactor,
    netProfit,
    averageWin,
    averageLoss,
    expectancy,
    sortinoRatio
  };
};

export function TradeMetrics({ trades, showOnlyKeyMetrics = false }: TradeMetricsProps) {
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

  // Render only the key metrics cards if showOnlyKeyMetrics is true
  if (showOnlyKeyMetrics) {
    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} />
          <MetricCard 
            title="Net Profit/Loss" 
            value={formatCurrency(metrics.netProfit)} 
            className={metrics.netProfit >= 0 ? "text-profit" : "text-loss"}
          />
          <MetricCard 
            title="Expectancy" 
            value={metrics.expectancy > 0 ? `${metrics.expectancy.toFixed(2)}R` : metrics.expectancy.toFixed(2)} 
          />
          <MetricCard title="Sortino Ratio" value={metrics.sortinoRatio.toFixed(2)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} />
        <MetricCard 
          title="Net Profit/Loss" 
          value={formatCurrency(metrics.netProfit)} 
          className={metrics.netProfit >= 0 ? "text-profit" : "text-loss"}
        />
        <MetricCard 
          title="Expectancy" 
          value={metrics.expectancy > 0 ? `${metrics.expectancy.toFixed(2)}R` : metrics.expectancy.toFixed(2)} 
        />
        <MetricCard title="Sortino Ratio" value={metrics.sortinoRatio.toFixed(2)} />
      </div>
      
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
        <MetricCard title="Profit Factor" value={metrics.profitFactor.toFixed(2)} />
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
