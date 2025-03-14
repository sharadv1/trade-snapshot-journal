
import { useState } from 'react';
import { TradeList } from '@/components/TradeList';
import { Button } from '@/components/ui/button';
import { addDummyTrades } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';
import { TradeMetrics } from '@/components/TradeMetrics';
import { getTradesWithMetrics } from '@/utils/tradeStorage';

export default function Index() {
  const [refreshKey, setRefreshKey] = useState(0);
  const trades = getTradesWithMetrics();

  const handleAddDummyTrades = () => {
    addDummyTrades();
    setRefreshKey(prev => prev + 1);
    toast.success('Added 10 sample trades for testing');
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      <div className="flex items-center justify-between mb-2 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Your Trade Journal
        </h1>
        <Button variant="outline" onClick={handleAddDummyTrades}>
          Load Sample Data
        </Button>
      </div>
      
      {trades.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Performance Metrics
          </h2>
          <TradeMetrics trades={trades} key={refreshKey} />
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Recent Trades
        </h2>
        <TradeList key={refreshKey} />
      </div>
    </div>
  );
}
