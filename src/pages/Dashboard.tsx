
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TradeMetrics } from '@/components/TradeMetrics';
import { TradeList } from '@/components/TradeList';
import { Button } from '@/components/ui/button';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { TradePnLCalendar } from '@/components/TradePnLCalendar';
import { DataTransferControls } from '@/components/DataTransferControls';
import { ServerSyncConfig } from '@/components/ServerSyncConfig'; 

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
          <DataTransferControls onImportComplete={handleRefresh} />
          <Button asChild>
            <Link to="/trade/new">
              <Plus className="mr-1 h-4 w-4" />
              New Trade
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
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
      </div>
    </div>
  );
}
