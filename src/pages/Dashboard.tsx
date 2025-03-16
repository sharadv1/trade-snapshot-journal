import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListChecks, FileBarChart2, Calendar, BarChart, ChevronRight, CheckCircle2, Clock, PieChart } from 'lucide-react';
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
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
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
        
        <TabsContent value="journal" className="animate-in fade-in">
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
        
        <TabsContent value="dashboard" className="animate-in fade-in">
          <div className="space-y-6">
            <div className="mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Trading Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
                <h1 className="text-3xl font-bold">Trading Dashboard</h1>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/analytics">
                      <PieChart className="h-4 w-4 mr-2" />
                      Analytics
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/strategies">
                      <ListChecks className="h-4 w-4 mr-2" />
                      Strategies
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/trade/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Trade
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Total P&L" 
                value={formatCurrency(calculateTotalPnL(trades))}
                change="+12.5% from last month"
                positive={calculateTotalPnL(trades) > 0}
                icon={<BarChart className="h-4 w-4" />}
              />
              <StatsCard 
                title="Win Rate" 
                value={`${calculateWinRate(trades).toFixed(1)}%`}
                change="-2.1% from last month"
                positive={calculateWinRate(trades) > 50}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <StatsCard 
                title="Open Positions" 
                value={trades.filter(t => t.status === 'open').length.toString()}
                change="+3 from last week"
                positive={true}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatsCard 
                title="Profit Factor" 
                value={calculateProfitFactor(trades).toFixed(2)}
                change="+0.3 from last month"
                positive={calculateProfitFactor(trades) > 2}
                icon={<PieChart className="h-4 w-4" />}
              />
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
                    <p className="text-sm text-muted-foreground">Monthly cumulative P&L</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">1W</Button>
                    <Button variant="outline" size="sm">1M</Button>
                    <Button variant="default" size="sm">3M</Button>
                    <Button variant="outline" size="sm">YTD</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>P&L Chart would be displayed here</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Sidebar widgets */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-3">
                    <ul className="space-y-4">
                      {trades.slice(0, 3).map(trade => (
                        <li key={trade.id} className="flex items-start px-2 py-1 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <div className={`rounded-full p-1.5 mr-3 ${trade.metrics.profitLoss >= 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                            {trade.metrics.profitLoss >= 0 ? 
                              <CheckCircle2 className="h-5 w-5" /> : 
                              <XIcon className="h-5 w-5" />
                            }
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium">{trade.symbol} {trade.direction}</p>
                              <p className={`text-sm font-medium ${trade.metrics.profitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {formatCurrency(trade.metrics.profitLoss)}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Closed on {format(new Date(trade.exitDate || trade.entryDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-primary" asChild>
                      <Link to="/">
                        View all trades
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Quick Entry */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Quick Trade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuickTradeEntry 
                      onTradeAdded={handleRefresh}
                      compact={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strategy Performance */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Strategy Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generateStrategyPerformance(trades).map((strategy, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{strategy.name}</p>
                            <p className="text-xs text-muted-foreground">{strategy.tradeCount} trades</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${strategy.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {formatCurrency(strategy.pnl)}
                          </p>
                          <div className="flex items-center justify-end">
                            <span className={`text-xs ${strategy.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                              {strategy.winRate}% win rate
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* We remove the compact prop from TradePnLCalendar since it doesn't exist in the component */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Trade Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <TradePnLCalendar />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// XIcon component for consistency
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Define the missing PerformanceCard component
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
  // Determine text color based on status
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

// Fix the TypeScript issues in the generateStrategyPerformance and related functions
interface StrategyPerformance {
  name: string;
  pnl: number;
  tradeCount: number;
  winCount: number;
  winRate: number;
}

// Helper function to generate sample strategy performance data with proper typing
function generateStrategyPerformance(trades: TradeWithMetrics[]): StrategyPerformance[] {
  const strategies = trades.reduce<Record<string, StrategyPerformance>>((acc, trade) => {
    if (!trade.strategy) return acc;
    
    if (!acc[trade.strategy]) {
      acc[trade.strategy] = {
        name: trade.strategy,
        pnl: 0,
        tradeCount: 0,
        winCount: 0,
        winRate: 0
      };
    }
    
    acc[trade.strategy].tradeCount += 1;
    
    if (trade.status === 'closed') {
      acc[trade.strategy].pnl += trade.metrics.profitLoss;
      if (trade.metrics.profitLoss > 0) {
        acc[trade.strategy].winCount += 1;
      }
    }
    
    return acc;
  }, {});
  
  return Object.values(strategies)
    .map(strategy => ({
      ...strategy,
      winRate: strategy.tradeCount > 0 
        ? Math.round((strategy.winCount / strategy.tradeCount) * 100) 
        : 0
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 5);
}

// Helper functions for calculating dashboard metrics
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

function calculateProfitFactor(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  
  const grossProfit = closedTrades
    .filter(trade => trade.metrics.profitLoss > 0)
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
    
  const grossLoss = Math.abs(closedTrades
    .filter(trade => trade.metrics.profitLoss < 0)
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0));
    
  if (grossLoss === 0) return grossProfit > 0 ? 999 : 0;
  return grossProfit / grossLoss;
}

function calculateExpectancy(trades: TradeWithMetrics[]): number {
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

function calculateSortinoRatio(trades: TradeWithMetrics[]): number {
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

function StatsCard({ 
  title, 
  value, 
  change, 
  positive, 
  icon 
}: { 
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            {icon}
          </div>
        </div>
        <div className={`text-xs mt-2 ${positive ? 'text-profit' : 'text-loss'}`}>
          {change}
        </div>
      </CardContent>
    </Card>
  );
}
