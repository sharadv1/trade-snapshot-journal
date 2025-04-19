
import { useState, useEffect, useMemo } from 'react';
import { CumulativePnLChart } from '@/components/CumulativePnLChart';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { Button } from '@/components/ui/button';
import { addDummyTrades } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';
import { TradeMetrics } from '@/components/TradeMetrics';
import { DataTransferControls } from '@/components/DataTransferControls';
import { DayOfWeekPerformanceTable } from '@/components/DayOfWeekPerformanceTable';
import { AccountPerformanceTable } from '@/components/AccountPerformanceTable';
import { StrategyPerformanceTable } from '@/components/StrategyPerformanceTable';
import { AccountFilter } from '@/components/analytics/AccountFilter';

export default function Analytics() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [allTrades, setAllTrades] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      // Get trades and set defaults if not returned
      const loadedTrades = getTradesWithMetrics();
      // Safely handle the loaded trades by ensuring it's an array
      const safeTrades = Array.isArray(loadedTrades) ? loadedTrades : [];
      setAllTrades(safeTrades);
      
      // Extract accounts with multiple safety checks
      const accountSet = new Set<string>();
      
      // Only iterate if we have valid trades
      if (safeTrades.length > 0) {
        safeTrades.forEach(trade => {
          // Only add if trade and trade.account are valid
          if (trade && typeof trade === 'object' && trade.account && typeof trade.account === 'string') {
            accountSet.add(trade.account);
          }
        });
      }
      
      // Convert to array and sort
      const accountArray = Array.from(accountSet);
      setAccounts(accountArray.sort());
      
      // Log for debugging
      console.log(`Loaded ${safeTrades.length} trades with ${accountArray.length} unique accounts`);
    } catch (error) {
      console.error('Error loading trades:', error);
      // Set safe defaults in case of error
      setAllTrades([]);
      setAccounts([]);
    }
  }, [refreshKey]);
  
  // Filter trades by selected accounts
  const trades = useMemo(() => {
    if (!Array.isArray(allTrades)) return [];
    if (!Array.isArray(selectedAccounts) || selectedAccounts.length === 0) return allTrades;
    
    return allTrades.filter(trade => 
      trade && 
      typeof trade === 'object' && 
      trade.account && 
      typeof trade.account === 'string' &&
      selectedAccounts.includes(trade.account)
    );
  }, [allTrades, selectedAccounts]);

  // Calculate timeframe statistics
  const timeframeCount = useMemo(() => {
    if (!Array.isArray(trades)) return {};
    
    return trades.reduce((acc, trade) => {
      if (trade && trade.timeframe && typeof trade.timeframe === 'string') {
        const tf = trade.timeframe.toLowerCase();
        acc[tf] = (acc[tf] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [trades]);

  const timeframeFormats = {
    '15m': ['15m', 'm15'],
    '1h': ['1h', 'h1']
  };
  
  // Check for specific timeframe trades
  const has15mTrades = useMemo(() => {
    if (!Array.isArray(trades)) return false;
    
    return trades.some(trade => 
      trade && 
      trade.timeframe && 
      typeof trade.timeframe === 'string' &&
      timeframeFormats['15m'].some(format => 
        trade.timeframe?.toLowerCase() === format
      )
    );
  }, [trades]);
  
  const has1hTrades = useMemo(() => {
    if (!Array.isArray(trades)) return false;
    
    return trades.some(trade => 
      trade && 
      trade.timeframe && 
      typeof trade.timeframe === 'string' &&
      timeframeFormats['1h'].some(format => 
        trade.timeframe?.toLowerCase() === format
      )
    );
  }, [trades]);

  const handleAddDummyTrades = () => {
    addDummyTrades();
    setRefreshKey(prev => prev + 1);
    toast.success('Added 10 sample trades for testing');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Debug output to help troubleshooting
  useEffect(() => {
    console.log('Current state:', {
      allTradesCount: Array.isArray(allTrades) ? allTrades.length : 'not an array',
      accountsCount: Array.isArray(accounts) ? accounts.length : 'not an array',
      selectedAccountsCount: Array.isArray(selectedAccounts) ? selectedAccounts.length : 'not an array',
      filteredTradesCount: Array.isArray(trades) ? trades.length : 'not an array'
    });
  }, [allTrades, accounts, selectedAccounts, trades]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-screen-2xl">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold tracking-tight">
          Trading Analytics
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Only render account filter if there are accounts */}
          {Array.isArray(accounts) && accounts.length > 0 ? (
            <AccountFilter
              accounts={accounts}
              selectedAccounts={selectedAccounts}
              onChange={setSelectedAccounts}
            />
          ) : null}
          <DataTransferControls onImportComplete={handleRefresh} />
          {Array.isArray(trades) && trades.length === 0 && (
            <Button variant="outline" onClick={handleAddDummyTrades}>
              Load Sample Data
            </Button>
          )}
        </div>
      </div>
      
      {Array.isArray(trades) && trades.length > 0 ? (
        <div className="space-y-8">          
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
              Account Performance
            </h2>
            <AccountPerformanceTable trades={trades} key={`accounts-${refreshKey}`} />
          </div>
          
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Strategy Performance
            </h2>
            <StrategyPerformanceTable trades={trades} key={`strategy-${refreshKey}`} />
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
            <DayOfWeekPerformanceTable 
              trades={trades} 
              timeframes={['15m', '1h', 'm15', 'h1', 'M15', 'H1']} 
              key={`day-${refreshKey}`} 
            />
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
