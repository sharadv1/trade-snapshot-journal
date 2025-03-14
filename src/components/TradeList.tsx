
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Edit, Filter, Search, Trash2, Trophy, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
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
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  
  // Get unique list of strategies from trades
  const availableStrategies = useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach(trade => {
      if (trade.strategy) {
        strategies.add(trade.strategy);
      }
    });
    return Array.from(strategies).sort();
  }, [trades]);
  
  useEffect(() => {
    const loadTrades = () => {
      const allTrades = initialTrades || getTradesWithMetrics();
      setTrades(allTrades);
      applyFilters(allTrades, searchTerm, statusFilter, typeFilter, strategyFilter, resultFilter);
    };
    
    loadTrades();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trade-journal-trades') {
        loadTrades();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialTrades, initialStatusFilter]);
  
  useEffect(() => {
    applyFilters(trades, searchTerm, statusFilter, typeFilter, strategyFilter, resultFilter);
  }, [searchTerm, statusFilter, typeFilter, strategyFilter, resultFilter, trades]);
  
  const applyFilters = (
    allTrades: TradeWithMetrics[], 
    search: string, 
    status: string, 
    type: string,
    strategy: string,
    result: 'all' | 'win' | 'loss'
  ) => {
    let result = [...allTrades];
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(trade => 
        trade.symbol.toLowerCase().includes(searchLower) ||
        trade.strategy?.toLowerCase().includes(searchLower) ||
        trade.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    if (status !== 'all') {
      result = result.filter(trade => trade.status === status);
    }
    
    if (type !== 'all') {
      result = result.filter(trade => trade.type === type);
    }
    
    // Filter by strategy
    if (strategy !== 'all') {
      result = result.filter(trade => trade.strategy === strategy);
    }
    
    // Filter by win/loss
    if (result !== 'all') {
      result = result.filter(trade => {
        if (trade.status !== 'closed') return true; // Keep open trades regardless of win/loss filter
        
        if (result === 'win') {
          return trade.metrics.profitLoss >= 0;
        } else if (result === 'loss') {
          return trade.metrics.profitLoss < 0;
        }
        return true;
      });
    }
    
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
      <div className="flex flex-col gap-3">
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  More Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Strategy</h4>
                    <Select 
                      value={strategyFilter} 
                      onValueChange={setStrategyFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Strategies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Strategies</SelectItem>
                        {availableStrategies.map((strategy) => (
                          <SelectItem key={strategy} value={strategy}>
                            {strategy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Result</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant={resultFilter === 'all' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setResultFilter('all')}
                      >
                        All
                      </Button>
                      <Button 
                        variant={resultFilter === 'win' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setResultFilter('win')}
                        className="text-profit"
                      >
                        <Trophy className="h-4 w-4 mr-1" />
                        Wins
                      </Button>
                      <Button 
                        variant={resultFilter === 'loss' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setResultFilter('loss')}
                        className="text-loss"
                      >
                        <XIcon className="h-4 w-4 mr-1" />
                        Losses
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {filteredTrades.length > 0 && (
          <div className="text-sm text-muted-foreground ml-2">
            Showing {filteredTrades.length} of {trades.length} trades
          </div>
        )}
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
                          <span className="text-sm font-medium">
                            Risk: {formatCurrency(trade.metrics.riskedAmount)}
                          </span>
                        </div>
                        
                        {trade.takeProfit && trade.metrics.maxPotentialGain && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
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

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
