
import React, { useEffect, useState } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeWithMetrics } from '@/types';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardMetrics } from './dashboard/DashboardMetrics';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { restoreServerConnection } from '@/utils/storage/serverSync';
import { TradeList } from '@/components/trade-list/TradeList';
import { CumulativePnLChart } from '@/components/CumulativePnLChart';
import { TradeMetrics } from '@/components/TradeMetrics';

export default function Dashboard() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  
  // Use the reflection generator to auto-create reflections for trades
  useReflectionGenerator();
  
  // Initialize app and server connection
  useEffect(() => {
    console.log("Dashboard: Initializing app and server connection");
    restoreServerConnection();
  }, []);
  
  // Load trades
  useEffect(() => {
    const loadTrades = () => {
      console.log("Dashboard: Loading trades");
      const loadedTrades = getTradesWithMetrics();
      console.log("Dashboard: Loaded", loadedTrades.length, "trades");
      setTrades(loadedTrades);
    };
    
    loadTrades();
    
    // Setup event listener for trade updates
    window.addEventListener('trades-updated', loadTrades);
    
    // Cleanup
    return () => {
      window.removeEventListener('trades-updated', loadTrades);
    };
  }, []);
  
  // Handler for when data import is completed
  const handleImportComplete = () => {
    console.log("Dashboard: Data import completed, refreshing trades");
    const refreshedTrades = getTradesWithMetrics();
    setTrades(refreshedTrades);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <DashboardHeader onImportComplete={handleImportComplete} />
      <DashboardMetrics trades={trades} />
      
      {/* Add the missing Dashboard components */}
      <div className="mt-8">
        <CumulativePnLChart trades={trades} />
      </div>
      
      <div className="mt-8">
        <TradeMetrics trades={trades} />
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Trades</h2>
        <TradeList 
          trades={trades.slice(0, 10)} 
          showPagination={false}
          hideFilters={true}
        />
      </div>
    </div>
  );
}
