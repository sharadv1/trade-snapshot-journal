
import { useState } from 'react';
import { CumulativePnLChart } from '@/components/CumulativePnLChart';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { Button } from '@/components/ui/button';
import { addDummyTrades } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';

export default function Analytics() {
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
          Trading Analytics
        </h1>
        {trades.length === 0 && (
          <Button variant="outline" onClick={handleAddDummyTrades}>
            Load Sample Data
          </Button>
        )}
      </div>
      
      {trades.length > 0 ? (
        <div className="space-y-8">
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Cumulative Profit & Loss
            </h2>
            <CumulativePnLChart trades={trades} key={refreshKey} />
          </div>
          
          {/* More analytics components can be added here */}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No trade data available. Add trades to see analytics.
        </div>
      )}
    </div>
  );
}
