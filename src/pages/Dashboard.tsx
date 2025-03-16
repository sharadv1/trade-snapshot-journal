
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListChecks, FileBarChart2, Calendar, Clock, ChevronRight, CheckCircle2, PieChart } from 'lucide-react';
import { TradeMetrics } from '@/components/TradeMetrics';
import { TradeList } from '@/components/TradeList';
import { Button } from '@/components/ui/button';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { TradePnLCalendar } from '@/components/TradePnLCalendar';
import { DataExportImport } from '@/components/DataExportImport';
import { ServerSyncConfig } from '@/components/ServerSyncConfig'; 
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { QuickTradeEntry } from '@/components/QuickTradeEntry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { formatCurrency, formatPercentage } from '@/utils/tradeCalculations';
import { CumulativePnLChart } from '@/components/CumulativePnLChart';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { TradeWithMetrics } from '@/types';

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const trades = getTradesWithMetrics();
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Calculate key metrics for consistency across both views
  const keyMetrics = {
    winRate: calculateWinRate(trades),
    netPnL: calculateTotalPnL(trades),
    expectancy: calculateExpectancy(trades),
    sortinoRatio: calculateSortinoRatio(trades)
  };
  
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Trading Journal
          </h1>
          <p className="text-muted-foreground">
            Track, analyze and improve your trading performance
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <ServerSyncConfig />
          <DataExportImport onImportComplete={handleRefresh} />
          <Button variant="outline" asChild>
            <Link to="/strategies">
              <ListChecks className="mr-1 h-4 w-4" />
              Strategies
            </Link>
          </Button>
          <Button asChild>
            <Link to="/trade/new">
              <Plus className="mr-1 h-4 w-4" />
              New Trade
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="view1" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
          <TabsTrigger value="view1">View 1</TabsTrigger>
          <TabsTrigger value="view2">View 2</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view1" className="grid gap-6 animate-in fade-in">
          {/* Key Metrics for View 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard 
              title="Win Rate" 
              value={`${keyMetrics.winRate.toFixed(1)}%`} 
            />
            <MetricCard 
              title="Net Profit/Loss" 
              value={formatCurrency(keyMetrics.netPnL)} 
              className={keyMetrics.netPnL >= 0 ? "text-profit" : "text-loss"}
            />
            <MetricCard 
              title="Expectancy" 
              value={keyMetrics.expectancy > 0 ? `${keyMetrics.expectancy.toFixed(2)}R` : keyMetrics.expectancy.toFixed(2)}
            />
            <MetricCard 
              title="Sortino Ratio" 
              value={keyMetrics.sortinoRatio.toFixed(2)} 
            />
          </div>
          
          <div className="grid gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">PnL Calendar</h2>
              <div className="p-4 border rounded-lg bg-card">
                <TradePnLCalendar />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Trades</h2>
                <Link 
                  to="/trade/new" 
                  className="text-sm text-primary hover:underline"
                >
                  Add trade
                </Link>
              </div>
              
              <TradeList 
                statusFilter="all"
                initialTrades={trades}
                onTradeDeleted={() => setRefreshKey(prev => prev + 1)}
                limit={5}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="view2" className="animate-in fade-in">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Trading Dashboard</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-1 h-4 w-4" />
                  Last 30 Days
                </Button>
                <Button variant="outline" size="sm">
                  <FileBarChart2 className="mr-1 h-4 w-4" />
                  View Reports
                </Button>
                <Button size="sm" asChild>
                  <Link to="/trade/new">
                    <Plus className="mr-1 h-4 w-4" />
                    New Trade
                  </Link>
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PerformanceCard 
                  title="Win Rate" 
                  value={keyMetrics.winRate}
                  suffix="%"
                  status={keyMetrics.winRate > 50 ? "good" : "neutral"}
                  description="Based on last 30 days of trading"
                />
                
                <PerformanceCard 
                  title="Profit/Loss" 
                  value={keyMetrics.netPnL}
                  prefix="$"
                  status={keyMetrics.netPnL > 0 ? "profit" : "loss"}
                  description="Month-to-date performance"
                />
                
                <PerformanceCard 
                  title="Expectancy" 
                  value={keyMetrics.expectancy}
                  suffix="R"
                  status={keyMetrics.expectancy > 1 ? "positive" : "neutral"}
                  description="Average R multiple per trade"
                />
                
                <PerformanceCard 
                  title="Sortino Ratio" 
                  value={keyMetrics.sortinoRatio}
                  status={keyMetrics.sortinoRatio > 2 ? "good" : "neutral"}
                  description="Risk-adjusted return metric"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">Profit/Loss Over Time</CardTitle>
                      <p className="text-sm text-muted-foreground">Track your trading performance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">1 Week</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CumulativePnLChart trades={trades} />
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">Recent Trades</CardTitle>
                    </div>
                    <Link to="/" className="text-xs text-primary hover:underline">
                      View All
                    </Link>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium">Symbol</th>
                            <th className="pb-2 font-medium">P&L</th>
                            <th className="pb-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.slice(0, 5).map(trade => (
                            <tr key={trade.id} className="border-b border-border/40 text-sm">
                              <td className="py-2">{format(new Date(trade.entryDate), 'yyyy-MM-dd')}</td>
                              <td className="py-2">{trade.symbol}</td>
                              <td className={`py-2 ${trade.metrics.profitLoss > 0 ? 'text-profit' : trade.metrics.profitLoss < 0 ? 'text-loss' : ''}`}>
                                {formatCurrency(trade.metrics.profitLoss)}
                              </td>
                              <td className="py-2">
                                {trade.metrics.profitLoss > 0 ? (
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-profit/10 text-profit">Win</span>
                                ) : trade.metrics.profitLoss < 0 ? (
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-loss/10 text-loss">Loss</span>
                                ) : (
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral/10">Breakeven</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-xs text-center text-muted-foreground">
                      A list of your recent trades
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <QuickTradeEntry onTradeAdded={handleRefresh} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PerformanceCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  status?: 'good' | 'neutral' | 'profit' | 'loss' | 'positive';
  description?: string;
}

function PerformanceCard({ 
  title, 
  value, 
  prefix = '', 
  suffix = '', 
  status = 'neutral', 
  description 
}: PerformanceCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
      case 'profit':
      case 'positive':
        return 'text-profit';
      case 'loss':
        return 'text-loss';
      default:
        return '';
    }
  };

  const displayValue = typeof value === 'number' 
    ? value.toFixed(2) 
    : value.toString();

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${getStatusColor()}`}>
            {prefix}{displayValue}{suffix}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Updated to calculate expectancy based on R multiples
function calculateWinRate(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  return (winningTrades.length / closedTrades.length) * 100;
}

function calculateTotalPnL(trades: TradeWithMetrics[]): number {
  return trades
    .filter(trade => trade.status === 'closed')
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
}

// Updated Expectancy calculation to correctly handle R multiples
function calculateExpectancy(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  // Get trades with valid risk values
  const tradesWithRisk = closedTrades.filter(trade => 
    trade.metrics.riskedAmount && trade.metrics.riskedAmount > 0
  );
  
  // If no trades have defined risk, return a simplified calculation
  if (tradesWithRisk.length === 0) {
    const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
    const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
    
    const winRate = winningTrades.length / closedTrades.length;
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0) / winningTrades.length
      : 0;
      
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0)) / losingTrades.length
      : 1; // Avoid division by zero
      
    // If no losing trades, return a positive value based on win rate
    if (avgLoss === 0) return winRate * 2;
    
    const rMultiple = avgWin / avgLoss;
    return (winRate * rMultiple) - (1 - winRate);
  }
  
  // Calculate properly using R multiples for trades with defined risk
  let totalRMultiple = 0;
  
  for (const trade of tradesWithRisk) {
    // R multiple = profit or loss divided by risked amount
    const rMultiple = trade.metrics.profitLoss / trade.metrics.riskedAmount;
    totalRMultiple += rMultiple;
  }
  
  // Expectancy = Average R multiple
  return totalRMultiple / tradesWithRisk.length;
}

function calculateSortinoRatio(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  // Calculate daily returns
  const returns = closedTrades.map(trade => trade.metrics.profitLossPercentage / 100);
  
  // Calculate average return
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Calculate downside deviation (only negative returns)
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return avgReturn > 0 ? 3 : 0;
  
  const downsideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
  );
  
  if (downsideDeviation === 0) return 0;
  
  // Sortino ratio = (Average Return - Risk Free Rate) / Downside Deviation
  // Assuming risk free rate is 0 for simplicity
  return avgReturn / downsideDeviation;
}

function MetricCard({ title, value, className }: { title: string; value: string; className?: string }) {
  return (
    <Card className="shadow-subtle border">
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold mt-1 ${className}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
