
import React, { useState, useEffect } from 'react';
import { TradeList } from '@/components/trade-list/TradeList';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeWithMetrics } from '@/types';

export default function AllTrades() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all trades
    const loadTrades = () => {
      console.log("AllTrades: Loading all trades");
      setIsLoading(true);
      const loadedTrades = getTradesWithMetrics();
      console.log("AllTrades: Loaded", loadedTrades.length, "trades");
      setTrades(loadedTrades);
      setIsLoading(false);
    };
    
    loadTrades();
    
    // Setup event listener for trade updates
    const handleTradesUpdated = () => {
      console.log("AllTrades: Trades updated event received");
      loadTrades();
    };
    
    window.addEventListener('trades-updated', handleTradesUpdated);
    window.addEventListener('storage', (event) => {
      if (event.key === 'trade-journal-trades') {
        console.log("AllTrades: Storage event for trades detected");
        loadTrades();
      }
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('trades-updated', handleTradesUpdated);
      window.removeEventListener('storage', handleTradesUpdated);
    };
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">All Trades</h1>
      {isLoading ? (
        <div className="text-center py-4">Loading trades...</div>
      ) : (
        <TradeList initialTrades={trades} itemsPerPage={50} />
      )}
    </div>
  );
}
