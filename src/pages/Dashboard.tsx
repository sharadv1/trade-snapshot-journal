
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TradeList } from '@/components/TradeList';
import { Button } from '@/components/ui/button';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradePnLCalendar } from '@/components/TradePnLCalendar';
import { TradeWithMetrics } from '@/types';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardMetrics } from './dashboard/DashboardMetrics';
import { WeeklyPnLSummary } from '@/components/WeeklyPnLSummary';
import { isUsingServerSync, syncWithServer, restoreServerConnection } from '@/utils/storage/serverSync';
import { toast } from '@/utils/toast';

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Initialize server connection on first load
  useEffect(() => {
    if (!isInitialized) {
      const initializeApp = async () => {
        console.log('Dashboard: Initializing app and server connection');
        try {
          // Try to restore server connection first
          await restoreServerConnection();
          
          // Then load trades
          loadTrades();
          setIsInitialized(true);
        } catch (error) {
          console.error('Error during app initialization:', error);
          // Still mark as initialized to prevent infinite retries
          setIsInitialized(true);
          // Load trades anyway as fallback
          loadTrades();
        }
      };
      
      initializeApp();
    }
  }, [isInitialized]);
  
  // Load trades when component mounts or refreshKey changes
  useEffect(() => {
    const loadTrades = () => {
      console.log('Dashboard: Loading trades');
      const fetchedTrades = getTradesWithMetrics();
      console.log(`Dashboard: Loaded ${fetchedTrades.length} trades`);
      setTrades(fetchedTrades);
    };
    
    if (isInitialized) {
      loadTrades();
    }
    
    // Add event listeners for storage changes
    const handleStorageChange = async (event: StorageEvent | Event) => {
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
  }, [refreshKey, isInitialized]);
  
  const loadTrades = async () => {
    console.log('Dashboard: Loading trades');
    setIsSyncing(true);
    
    // Try to refresh from server first if connected
    if (isUsingServerSync()) {
      try {
        console.log('Dashboard: Syncing with server before loading trades');
        const syncSuccess = await syncWithServer(true);
        if (!syncSuccess) {
          // If server sync failed but we're still in "server mode", show a more detailed error
          toast.error('Could not sync with server. Using local data only.', {
            description: 'Check server configuration in settings.'
          });
        }
      } catch (error) {
        console.error('Error syncing with server:', error);
        toast.error('Failed to sync with server. Using local data.');
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
    }
    
    const fetchedTrades = getTradesWithMetrics();
    console.log(`Dashboard: Loaded ${fetchedTrades.length} trades`);
    setTrades(fetchedTrades);
  };
  
  const handleRefresh = () => {
    console.log('Dashboard: Manual refresh requested');
    loadTrades();
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="space-y-8 pb-10">
      <DashboardHeader onImportComplete={handleRefresh} />
      
      <div className="animate-in fade-in">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <DashboardMetrics trades={trades} />
          </div>
          <div>
            <WeeklyPnLSummary trades={trades} />
          </div>
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing...' : 'Refresh'}
                </Button>
                <Link 
                  to="/trade/new" 
                  className="text-sm text-primary hover:underline"
                >
                  Add trade
                </Link>
              </div>
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
