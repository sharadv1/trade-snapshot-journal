
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

  console.log('Analytics - Available timeframes:', timeframeCount);
  console.log('Analytics - Has 15m trades:', has15mTrades);
  console.log('Analytics - Has 1h trades:', has1hTrades);
  console.log('Analytics - Trades with timeframes:', trades.map(t => ({ 
    symbol: t.symbol, 
    timeframe: t.timeframe,
    status: t.status
  })));

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
          {/* Key Trading Stats - Moved to the top */}
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Key Trading Stats
            </h2>
            <TradeMetrics trades={trades} showOnlyKeyMetrics={true} key={`key-metrics-${refreshKey}`} />
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
