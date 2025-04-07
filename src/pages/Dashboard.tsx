
import React, { useEffect, useState } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeWithMetrics } from '@/types';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { restoreServerConnection } from '@/utils/storage/serverSync';
import { TradeList } from '@/components/trade-list/TradeList';
import { TradePnLCalendar } from '@/components/TradePnLCalendar';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/calculations/formatters';
import { 
  calculateProfitFactor, 
  calculateCalmarRatio, 
  calculateParetoIndex,
  calculateExpectedValue
} from '@/utils/calculations/advancedMetrics';
import { calculateTotalPnL } from './dashboard/dashboardUtils';
import { MetricCard } from './dashboard/MetricCard';

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

  // Calculate metrics
  const netPnL = calculateTotalPnL(trades);
  const profitFactor = calculateProfitFactor(trades);
  const expectedValue = calculateExpectedValue(trades);
  const calmarRatio = calculateCalmarRatio(trades);
  const paretoIndex = calculateParetoIndex(trades);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <DashboardHeader onImportComplete={handleImportComplete} />
      
      {/* Key Metrics */}
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
