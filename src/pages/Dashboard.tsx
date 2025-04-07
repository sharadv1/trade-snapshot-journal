
import React, { useEffect, useState } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeWithMetrics } from '@/types';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { restoreServerConnection } from '@/utils/storage/serverSync';
import { TradeList } from '@/components/trade-list/TradeList';
import { TradePnLCalendar } from '@/components/TradePnLCalendar';
import { Card, CardContent } from '@/components/ui/card';
import { WeeklyPnLSummary } from '@/components/WeeklyPnLSummary';
import { formatCurrency } from '@/utils/calculations/formatters';
import { 
  calculateProfitFactor, 
  calculateCalmarRatio, 
  calculateParetoIndex,
  calculateExpectedValue
} from '@/utils/calculations/advancedMetrics';
import { calculateTotalPnL } from './dashboard/dashboardUtils';
import { DashboardMetrics } from './dashboard/DashboardMetrics';

export default function Dashboard() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  
  // Use the reflection generator to auto-create reflections
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
      
      {/* Weekly Risk Summary */}
      <div className="mt-4">
        <WeeklyPnLSummary trades={trades} />
      </div>
      
      {/* Key Metrics */}
      <div className="mt-6">
        <DashboardMetrics trades={trades} />
      </div>
      
      {/* Calendar */}
      <div className="mt-8">
        <TradePnLCalendar />
      </div>
      
      {/* Recent Trades */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Trades</h2>
        <TradeList 
          initialTrades={trades.slice(0, 10)} 
          limit={10}
        />
      </div>
    </div>
  );
}
