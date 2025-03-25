
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListChecks } from 'lucide-react';
import { TradeList } from '@/components/TradeList';
import { Button } from '@/components/ui/button';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { TradePnLCalendar } from '@/components/TradePnLCalendar';
import { DataExportImport } from '@/components/DataExportImport';
import { ServerSyncConfig } from '@/components/ServerSyncConfig'; 
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/tradeCalculations';
import { TradeWithMetrics } from '@/types';

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  
  useEffect(() => {
    // Load trades when component mounts or refreshKey changes
    console.log('Dashboard: Loading trades due to refreshKey change');
    setTrades(getTradesWithMetrics());
    
    // Add event listeners for storage changes
    const handleStorageChange = () => {
      console.log('Dashboard: Detected storage change, refreshing trades');
      setTrades(getTradesWithMetrics());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('trades-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trades-updated', handleStorageChange);
    };
  }, [refreshKey]);
  
  const handleRefresh = () => {
    console.log('Dashboard: Manual refresh requested');
    setRefreshKey(prev => prev + 1);
  };
  
  // Calculate key metrics for the dashboard
  const keyMetrics = {
    winRate: calculateWinRate(trades),
    totalTrades: trades.filter(trade => trade.status === 'closed').length,
    totalWins: trades.filter(trade => trade.status === 'closed' && trade.metrics.profitLoss > 0).length,
    totalLosses: trades.filter(trade => trade.status === 'closed' && trade.metrics.profitLoss <= 0).length,
    netPnL: calculateTotalPnL(trades),
    expectancy: calculateExpectancy(trades),
    sortinoRatio: calculateSortinoRatio(trades),
    avgWin: calculateAverageWin(trades),
    avgLoss: calculateAverageLoss(trades),
    totalR: calculateTotalR(trades)
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
      
      <div className="animate-in fade-in">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Expectancy" 
            value={keyMetrics.expectancy > 0 ? `${keyMetrics.expectancy.toFixed(2)}R` : keyMetrics.expectancy.toFixed(2)}
            subStats={[
              {
                label: "Win Rate",
                value: `${keyMetrics.winRate.toFixed(1)}%`
              },
              {
                label: "Total Trades",
                value: keyMetrics.totalTrades.toString()
              },
              {
                label: "Wins / Losses",
                value: `${keyMetrics.totalWins} / ${keyMetrics.totalLosses}`
              },
              {
                label: "Avg Win",
                value: formatCurrency(keyMetrics.avgWin),
                className: "text-profit"
              },
              {
                label: "Avg Loss",
                value: formatCurrency(Math.abs(keyMetrics.avgLoss)),
                className: "text-loss"
              }
            ]}
          />
          <MetricCard 
            title="Net Profit/Loss" 
            value={formatCurrency(keyMetrics.netPnL)} 
            subValue={`${keyMetrics.totalR > 0 ? '+' : ''}${keyMetrics.totalR.toFixed(2)}R`}
            className={keyMetrics.netPnL >= 0 ? "text-profit" : "text-loss"}
          />
          <MetricCard 
            title="Sortino Ratio" 
            value={keyMetrics.sortinoRatio.toFixed(2)} 
          />
        </div>
        
        <div className="grid gap-6 mt-6">
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
      </div>
    </div>
  );
}

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

function calculateTotalR(trades: TradeWithMetrics[]): number {
  return trades
    .filter(trade => trade.status === 'closed' && trade.metrics.riskRewardRatio !== undefined)
    .reduce((sum, trade) => sum + (trade.metrics.riskRewardRatio || 0), 0);
}

function calculateAverageWin(trades: TradeWithMetrics[]): number {
  const winningTrades = trades
    .filter(trade => trade.status === 'closed' && trade.metrics.profitLoss > 0);
  
  if (winningTrades.length === 0) return 0;
  
  const totalWins = winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  return totalWins / winningTrades.length;
}

function calculateAverageLoss(trades: TradeWithMetrics[]): number {
  const losingTrades = trades
    .filter(trade => trade.status === 'closed' && trade.metrics.profitLoss < 0);
  
  if (losingTrades.length === 0) return 0;
  
  const totalLosses = losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  return totalLosses / losingTrades.length;
}

function calculateExpectancy(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const tradesWithRisk = closedTrades.filter(trade => 
    trade.metrics.riskedAmount && trade.metrics.riskedAmount > 0
  );
  
  if (tradesWithRisk.length === 0) {
    const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
    const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
    
    const winRate = winningTrades.length / closedTrades.length;
    
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0) / winningTrades.length
      : 0;
      
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0)) / losingTrades.length
      : 1;
    
    if (avgLoss === 0) return winRate * 2;
    
    const rMultiple = avgWin / avgLoss;
    return (winRate * rMultiple) - (1 - winRate);
  }
  
  let totalRMultiple = 0;
  
  for (const trade of tradesWithRisk) {
    const rMultiple = trade.metrics.profitLoss / trade.metrics.riskedAmount;
    totalRMultiple += rMultiple;
  }
  
  return totalRMultiple / tradesWithRisk.length;
}

function calculateSortinoRatio(trades: TradeWithMetrics[]): number {
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  if (closedTrades.length === 0) return 0;
  
  const returns = closedTrades.map(trade => trade.metrics.profitLossPercentage / 100);
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return avgReturn > 0 ? 3 : 0;
  
  const downsideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
  );
  
  if (downsideDeviation === 0) return 0;
  
  return avgReturn / downsideDeviation;
}

interface SubStat {
  label: string;
  value: string;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  className?: string;
  subStats?: SubStat[];
}

function MetricCard({ title, value, subValue, className, subStats }: MetricCardProps) {
  return (
    <Card className="shadow-subtle border">
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold mt-1 ${className}`}>
          {value}
          {subValue && (
            <div className={`text-sm font-medium mt-0.5 ${className}`}>
              {subValue}
            </div>
          )}
        </div>
        
        {subStats && subStats.length > 0 && (
          <div className="mt-2 space-y-1 text-sm">
            {subStats.map((stat, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-muted-foreground">{stat.label}:</span>
                <span className={stat.className}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
