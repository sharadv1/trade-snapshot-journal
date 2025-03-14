
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, Search, Plus, AlertTriangle, Target, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeList } from '@/components/TradeList';
import { TradeMetrics } from '@/components/TradeMetrics';
import { getTradesWithMetrics, addDummyTrades } from '@/utils/tradeStorage';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';
import { toast } from '@/utils/toast';

export default function Dashboard() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [openTrades, setOpenTrades] = useState<TradeWithMetrics[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [totalRisk, setTotalRisk] = useState(0);
  const [totalPotentialGain, setTotalPotentialGain] = useState(0);
  
  // Load trades
  const loadTrades = () => {
    const allTrades = getTradesWithMetrics();
    setTrades(allTrades);
    const openPositions = allTrades.filter(trade => trade.status === 'open');
    setOpenTrades(openPositions);
    
    // Calculate total risk and potential gain
    let risk = 0;
    let potentialGain = 0;
    
    openPositions.forEach(trade => {
      if (trade.metrics.riskedAmount) {
        risk += trade.metrics.riskedAmount;
      }
      
      if (trade.metrics.maxPotentialGain) {
        potentialGain += trade.metrics.maxPotentialGain;
      }
    });
    
    setTotalRisk(risk);
    setTotalPotentialGain(potentialGain);
  };
  
  useEffect(() => {
    loadTrades();
    
    // Set up localStorage change listener (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trade-journal-trades') {
        loadTrades();
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
  
  const handleLoadDummyData = () => {
    addDummyTrades();
    loadTrades();
    toast.success("Loaded 10 sample trades");
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
            <CardContent className="flex justify-start gap-3">
              <Button asChild>
                <Link to="/trade/new">
                  <Plus className="mr-1 h-4 w-4" />
                  Record Your First Trade
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLoadDummyData}>
                <Database className="mr-1 h-4 w-4" />
                Load Sample Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <TradeMetrics trades={trades} />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleLoadDummyData}>
                <Database className="mr-1 h-4 w-4" />
                Replace with Sample Data
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {openTrades.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Open Positions</h2>
          
          {(totalRisk > 0 || totalPotentialGain > 0) && (
            <Card className="shadow-subtle border mb-4">
              <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Position Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Summary of your current market exposure
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {totalRisk > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-md">
                      <AlertTriangle className="h-4 w-4" />
                      <div>
                        <div className="text-xs font-medium">Total Risk</div>
                        <div className="font-mono">{formatCurrency(totalRisk)}</div>
                      </div>
                    </div>
                  )}
                  
                  {totalPotentialGain > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-md">
                      <Target className="h-4 w-4" />
                      <div>
                        <div className="text-xs font-medium">Potential Gain</div>
                        <div className="font-mono">{formatCurrency(totalPotentialGain)}</div>
                      </div>
                    </div>
                  )}
                  
                  {totalRisk > 0 && totalPotentialGain > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-md">
                      <div>
                        <div className="text-xs font-medium">Risk/Reward Ratio</div>
                        <div className="font-mono">{(totalPotentialGain / totalRisk).toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
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
