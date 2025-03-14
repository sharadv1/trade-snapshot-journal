
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, Search, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeList } from '@/components/TradeList';
import { TradeMetrics } from '@/components/TradeMetrics';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';

export default function Dashboard() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [openTrades, setOpenTrades] = useState<TradeWithMetrics[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Load trades
  useEffect(() => {
    const allTrades = getTradesWithMetrics();
    setTrades(allTrades);
    setOpenTrades(allTrades.filter(trade => trade.status === 'open'));
    
    // Set up localStorage change listener (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trade-journal-trades') {
        const updatedTrades = getTradesWithMetrics();
        setTrades(updatedTrades);
        setOpenTrades(updatedTrades.filter(trade => trade.status === 'open'));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Show "back to top" button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate total P&L
  const totalPnL = trades
    .filter(trade => trade.status === 'closed')
    .reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);

  return (
    <div className="pb-12 animate-fade-in">
      <div className="py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Trade Journal
        </h1>
        <p className="text-muted-foreground">
          Track, analyze, and improve your trading performance
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
        {trades.length === 0 ? (
          <Card className="shadow-subtle border">
            <CardHeader>
              <CardTitle>Welcome to Your Trade Journal</CardTitle>
              <CardDescription>
                Start tracking your trades to see performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-start">
              <Button asChild>
                <Link to="/trade/new">
                  <Plus className="mr-1 h-4 w-4" />
                  Record Your First Trade
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TradeMetrics trades={trades} />
        )}
      </div>
      
      {openTrades.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Open Positions</h2>
          <TradeList trades={openTrades} statusFilter="open" />
        </div>
      )}
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Trade History</h2>
          <Button asChild>
            <Link to="/trade/new">
              <Plus className="mr-1 h-4 w-4" />
              New Trade
            </Link>
          </Button>
        </div>
        <TradeList />
      </div>
      
      {showBackToTop && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-elevated"
          onClick={scrollToTop}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
