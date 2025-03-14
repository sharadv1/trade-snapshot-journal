
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Edit, Search, Trash2, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeWithMetrics } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/tradeCalculations';
import { deleteTrade, getTradesWithMetrics } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';

interface TradeListProps {
  trades?: TradeWithMetrics[];
  statusFilter?: string;
  onTradeSelected?: (trade: TradeWithMetrics) => void;
}

export function TradeList({ trades: initialTrades, statusFilter: initialStatusFilter, onTradeSelected }: TradeListProps) {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<TradeWithMetrics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Load trades
  useEffect(() => {
    const loadTrades = () => {
      const allTrades = initialTrades || getTradesWithMetrics();
      setTrades(allTrades);
      applyFilters(allTrades, searchTerm, statusFilter, typeFilter);
    };
    
    loadTrades();
    
    // Reload when localStorage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trade-journal-trades') {
        loadTrades();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialTrades, initialStatusFilter]);
  
  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters(trades, searchTerm, statusFilter, typeFilter);
  }, [searchTerm, statusFilter, typeFilter, trades]);
  
  const applyFilters = (
    allTrades: TradeWithMetrics[], 
    search: string, 
    status: string, 
    type: string
  ) => {
    let result = [...allTrades];
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(trade => 
        trade.symbol.toLowerCase().includes(searchLower) ||
        trade.strategy?.toLowerCase().includes(searchLower) ||
        trade.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by status
    if (status !== 'all') {
      result = result.filter(trade => trade.status === status);
    }
    
    // Filter by type
    if (type !== 'all') {
      result = result.filter(trade => trade.type === type);
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => 
      new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    );
    
    setFilteredTrades(result);
  };
  
  const handleDeleteTrade = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this trade?')) {
      deleteTrade(id);
      setTrades(prev => prev.filter(trade => trade.id !== id));
      toast.success('Trade deleted successfully');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="futures">Futures</SelectItem>
              <SelectItem value="option">Option</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredTrades.length === 0 ? (
        <Card className="shadow-subtle border">
          <CardHeader>
            <CardTitle>No trades found</CardTitle>
            <CardDescription>
              {trades.length === 0 
                ? "You haven't recorded any trades yet." 
                : "No trades match your search filters."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/trade/new">Record your first trade</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade) => (
            <Link 
              key={trade.id} 
              to={`/trade/${trade.id}`}
              onClick={() => onTradeSelected && onTradeSelected(trade)} 
              className="block group"
            >
              <Card className="shadow-subtle border transition-all hover:shadow-glass">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-3 rounded-md",
                      trade.direction === 'long'
                        ? "bg-profit/10 text-profit"
                        : "bg-loss/10 text-loss"
                    )}>
                      {trade.direction === 'long' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{trade.symbol}</h3>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          trade.status === 'open'
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {trade.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>{new Date(trade.entryDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric'
                        })}</span>
                        <span className="mx-1">•</span>
                        <span>{trade.quantity} {trade.type === 'futures' ? 'contracts' : 'shares'} @ {formatCurrency(trade.entryPrice)}</span>
                        {trade.strategy && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{trade.strategy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {trade.status === 'open' && trade.stopLoss && trade.metrics.riskedAmount && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Risk: {formatCurrency(trade.metrics.riskedAmount)}
                          </span>
                        </div>
                        
                        {trade.takeProfit && trade.metrics.maxPotentialGain && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Target className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Target: {formatCurrency(trade.metrics.maxPotentialGain)}
                            </span>
                            {trade.metrics.riskRewardRatio && (
                              <span className="text-xs ml-1">
                                ({trade.metrics.riskRewardRatio.toFixed(1)}R)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {trade.status === 'closed' && (
                      <div className="text-right">
                        <span className={cn(
                          "font-mono text-sm font-medium",
                          trade.metrics.profitLoss >= 0 ? "text-profit" : "text-loss"
                        )}>
                          {formatCurrency(trade.metrics.profitLoss)}
                        </span>
                        <div className={cn(
                          "text-xs",
                          trade.metrics.profitLoss >= 0 ? "text-profit" : "text-loss"
                        )}>
                          {trade.metrics.profitLossPercentage >= 0 ? '+' : ''}
                          {formatPercentage(trade.metrics.profitLossPercentage)}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild>
                        <Link to={`/trade/edit/${trade.id}`} onClick={(e) => e.stopPropagation()}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={(e) => handleDeleteTrade(trade.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper for className merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
