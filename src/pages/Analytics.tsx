
import { useState } from 'react';
import { CumulativePnLChart } from '@/components/CumulativePnLChart';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { Button } from '@/components/ui/button';
import { addDummyTrades } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';
import { TradeMetrics } from '@/components/TradeMetrics';
import { MonthlyPerformanceTable } from '@/components/MonthlyPerformanceTable';
import { DataTransferControls } from '@/components/DataTransferControls';
import { DayOfWeekPerformance } from '@/components/DayOfWeekPerformance';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/calculations/formatters';
import { 
  calculateProfitFactor, 
  calculateCalmarRatio, 
  calculateParetoIndex,
  calculateExpectedValue
} from '@/utils/calculations/advancedMetrics';
import { 
  calculateWinRate, 
  calculateTotalPnL, 
  calculateTotalR, 
  calculateAverageWin, 
  calculateAverageLoss 
} from './dashboard/dashboardUtils';
import { MetricCard } from './dashboard/MetricCard';

export default function Analytics() {
  const [refreshKey, setRefreshKey] = useState(0);
  const trades = getTradesWithMetrics();

  // Count trades by timeframe for display purposes
  const timeframeCount = trades.reduce((acc, trade) => {
    if (trade.timeframe) {
      const tf = trade.timeframe.toLowerCase();
      acc[tf] = (acc[tf] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Check for timeframes in various formats
  const timeframeFormats = {
    '15m': ['15m', 'm15'],
    '1h': ['1h', 'h1']
  };
  
  const has15mTrades = trades.some(trade => 
    trade.timeframe && 
    timeframeFormats['15m'].some(format => 
      trade.timeframe?.toLowerCase() === format
    )
  );
  
  const has1hTrades = trades.some(trade => 
    trade.timeframe && 
    timeframeFormats['1h'].some(format => 
      trade.timeframe?.toLowerCase() === format
    )
  );

  // Calculate metrics
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);

  const totalTrades = closedTrades.length;
  const winRate = calculateWinRate(trades);
  const totalWins = winningTrades.length;
  const totalLosses = losingTrades.length;
  const avgWin = calculateAverageWin(trades);
  const avgLoss = calculateAverageLoss(trades);
  
  // Advanced metrics
  const netPnL = calculateTotalPnL(trades);
  const profitFactor = calculateProfitFactor(trades);
  const expectedValue = calculateExpectedValue(trades);
  const calmarRatio = calculateCalmarRatio(trades);
  const paretoIndex = calculateParetoIndex(trades);

  const handleAddDummyTrades = () => {
    addDummyTrades();
    setRefreshKey(prev => prev + 1);
    toast.success('Added 10 sample trades for testing');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      <div className="flex items-center justify-between mb-2 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Trading Analytics
        </h1>
        <div className="flex items-center gap-2">
          <DataTransferControls onImportComplete={handleRefresh} />
          {trades.length === 0 && (
            <Button variant="outline" onClick={handleAddDummyTrades}>
              Load Sample Data
            </Button>
          )}
        </div>
      </div>
      
      {trades.length > 0 ? (
        <div className="space-y-8">
          {/* Key Trading Stats */}
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Key Trading Stats
            </h2>
            
            {/* Basic Trading Stats Card - Similar to the image */}
            <Card className="shadow-sm mb-6 border">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-lg text-muted-foreground">Win Rate:</span>
                    <span className="text-lg font-semibold">{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg text-muted-foreground">Total Trades:</span>
                    <span className="text-lg font-semibold">{totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg text-muted-foreground">Wins / Losses:</span>
                    <span className="text-lg font-semibold">{totalWins} / {totalLosses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg text-muted-foreground">Avg Win:</span>
                    <span className="text-lg font-semibold text-green-600">{formatCurrency(avgWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg text-muted-foreground">Avg Loss:</span>
                    <span className="text-lg font-semibold text-red-500">{formatCurrency(Math.abs(avgLoss))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Advanced Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <MetricCard 
                title="Net P&L" 
                value={formatCurrency(netPnL)}
                className={netPnL >= 0 ? "text-profit" : "text-loss"}
              />
              <MetricCard 
                title="Profit Factor" 
                value={isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞"} 
                tooltip="Gross Profit / Gross Loss"
              />
              <MetricCard 
                title="Expected Value" 
                value={formatCurrency(expectedValue)}
                className={expectedValue >= 0 ? "text-profit" : "text-loss"}
                tooltip="(Win Rate × Avg Win) - (Loss Rate × Avg Loss)"
              />
              <MetricCard 
                title="Calmar Ratio" 
                value={calmarRatio.toFixed(2)}
                tooltip="Annualized Return / Maximum Drawdown"
              />
              <MetricCard 
                title="Pareto Index" 
                value={`${paretoIndex.toFixed(1)}%`}
                tooltip="% of profits from top 20% of trades"
              />
            </div>
          </div>
          
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Cumulative Profit & Loss
            </h2>
            <div className="h-[500px]">
              <CumulativePnLChart trades={trades} key={refreshKey} />
            </div>
          </div>
          
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Day of Week Performance (15m & 1h Timeframes)
              {(!has15mTrades && !has1hTrades) && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  No trades with 15m or 1h timeframes. Add trades with these timeframes to see data.
                </span>
              )}
            </h2>
            <DayOfWeekPerformance 
              trades={trades} 
              timeframes={['15m', '1h', 'm15', 'h1', 'M15', 'H1']} 
              key={`day-${refreshKey}`} 
            />
          </div>
          
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Monthly Performance by Strategy & Instrument
            </h2>
            <MonthlyPerformanceTable trades={trades} key={refreshKey} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No trade data available. Add trades to see analytics.
        </div>
      )}
    </div>
  );
}
