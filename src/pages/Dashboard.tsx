import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TradeList } from '@/components/TradeList';
import { Button } from '@/components/ui/button';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradePnLCalendar } from '@/components/TradePnLCalendar';
import { TradeWithMetrics } from '@/types';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardMetrics } from './dashboard/DashboardMetrics';

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  
  useEffect(() => {
    // Load trades when component mounts or refreshKey changes
    const loadTrades = () => {
      console.log('Dashboard: Loading trades');
      const fetchedTrades = getTradesWithMetrics();
      console.log(`Dashboard: Loaded ${fetchedTrades.length} trades`);
      setTrades(fetchedTrades);
    };
    
    loadTrades();
    
    // Add event listeners for storage changes
    const handleStorageChange = (event: StorageEvent | Event) => {
      // Only reload if it's a storage event with the right key or a trades-updated event
      if (
        (event instanceof StorageEvent && event.key === 'trade-journal-trades') || 
        event.type === 'trades-updated'
      ) {
        console.log('Dashboard: Detected storage change, refreshing trades');
        loadTrades();
      }
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
  
  return (
    <div className="space-y-8 pb-10">
      <DashboardHeader onImportComplete={handleRefresh} />
      
      <div className="animate-in fade-in">
        {/* Key Metrics */}
        <DashboardMetrics trades={trades} />
        
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
              onTradeDeleted={handleRefresh}
              limit={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
