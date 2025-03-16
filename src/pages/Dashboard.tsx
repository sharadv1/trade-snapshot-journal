
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListChecks, FileBarChart2, Calendar, BarChart } from 'lucide-react';
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

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const trades = getTradesWithMetrics();
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="grid gap-6 animate-in fade-in">
          <TradeMetrics trades={trades} showOnlyKeyMetrics={true} />
          
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
        
        <TabsContent value="dashboard" className="animate-in fade-in">
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
                  value={calculateWinRate(trades)}
                  suffix="%"
                  status={calculateWinRate(trades) > 50 ? "good" : "neutral"}
                  description="Based on last 30 days of trading"
                />
                
                <PerformanceCard 
                  title="Profit/Loss" 
                  value={calculateTotalPnL(trades)}
                  prefix="$"
                  status={calculateTotalPnL(trades) > 0 ? "profit" : "loss"}
                  description="Month-to-date performance"
                />
                
                <PerformanceCard 
                  title="Expectancy" 
                  value={calculateExpectancy(trades)}
                  suffix="R"
                  status={calculateExpectancy(trades) > 1 ? "positive" : "neutral"}
                  description="Average R multiple per trade"
                />
                
                <PerformanceCard 
                  title="Sortino Ratio" 
                  value={calculateSortinoRatio(trades)}
                  status={calculateSortinoRatio(trades) > 2 ? "good" : "neutral"}
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
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p>PnL Chart would be displayed here</p>
                    </div>
                    <div className="text-right text-sm">
                      Total P&L: <span className="font-medium text-profit">
                        {formatCurrency(calculateTotalPnL(trades))}
                      </span>
                    </div>
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

function PerformanceCard({ 
  title, 
  value, 
  prefix = '', 
  suffix = '', 
  status = 'neutral',
  description 
}: { 
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  status?: 'good' | 'profit' | 'loss' | 'positive' | 'negative' | 'neutral';
  description: string;
}) {
  const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
  
  let statusIcon = null;
  let statusClass = '';
  
  switch (status) {
    case 'good':
      statusIcon = <span className="text-green-500">↑ Good</span>;
      statusClass = 'text-green-600';
      break;
    case 'profit':
      statusIcon = <span className="text-green-500">↑ Profit</span>;
      statusClass = 'text-green-600';
      break;
    case 'positive':
      statusIcon = <span className="text-green-500">↗️ Positive</span>;
      statusClass = 'text-green-600';
      break;
    case 'loss':
      statusIcon = <span className="text-red-500">↓ Loss</span>;
      statusClass = 'text-red-500';
      break;
    case 'negative':
      statusIcon = <span className="text-red-500">↘️ Negative</span>;
      statusClass = 'text-red-500';
      break;
  }
  
  return (
    <Card className="border shadow-sm">
      <CardContent className="pt-6">
        <div className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </div>
        <div className={`text-2xl font-bold flex items-center gap-1 ${statusClass}`}>
          {prefix}{formattedValue}{suffix}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-muted-foreground">
            {description}
          </div>
          <div className="text-xs font-medium">
            {statusIcon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions for calculating dashboard metrics
function calculateWinRate(trades: any[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  return (winningTrades.length / closedTrades.length) * 100;
}

function calculateTotalPnL(trades: any[]): number {
  return trades
    .filter(trade => trade.status === 'closed')
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
}

function calculateExpectancy(trades: any[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
  
  const winRate = winningTrades.length / closedTrades.length;
  
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0) / winningTrades.length
    : 0;
    
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0)) / losingTrades.length
    : 0;
    
  if (avgLoss === 0) return 0;
  
  // Calculate expectancy as R-multiple
  const rMultiple = avgWin / avgLoss;
  return winRate * rMultiple - (1 - winRate);
}

function calculateSortinoRatio(trades: any[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  // Calculate daily returns
  const returns = closedTrades.map(trade => trade.metrics.profitLossPercentage / 100);
  
  // Calculate average return
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Calculate downside deviation (only negative returns)
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return avgReturn > 0 ? 999 : 0; // No downside
  
  const downsideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
  );
  
  if (downsideDeviation === 0) return 0;
  
  // Sortino ratio = (Average Return - Risk Free Rate) / Downside Deviation
  // Assuming risk free rate is 0 for simplicity
  return avgReturn / downsideDeviation;
}
