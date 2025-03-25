
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { format, parse, isValid } from 'date-fns';
import { formatCurrency, formatPercentage } from '@/utils/tradeCalculations';
import { Filter, ChevronUp, ChevronDown, Clock, CheckCircle, Trophy, X as XIcon, Gauge, Award } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradeListProps {
  statusFilter?: 'open' | 'closed' | 'all';
  initialTrades?: TradeWithMetrics[];
  limit?: number;
  onTradeDeleted?: () => void;
}

export function TradeList({ statusFilter = 'all', initialTrades, limit, onTradeDeleted }: TradeListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const dateParam = queryParams.get('date');
  
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [sortField, setSortField] = useState<string>('entryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [tradeStatus, setTradeStatus] = useState<'open' | 'closed' | 'all'>(statusFilter);
  
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
      console.log('Loading trades in TradeList component');
      const allTrades = initialTrades || getTradesWithMetrics();
      setTrades(allTrades);
    };
    
    loadTrades();
    
    // Listen for both standard storage events and custom trades-updated events
    const handleStorageChange = () => {
      console.log('Storage change detected in TradeList');
      if (!initialTrades) {
        loadTrades();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('trades-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trades-updated', handleStorageChange);
    };
  }, [initialTrades]);
  
  // Update tradeStatus if statusFilter prop changes
  useEffect(() => {
    setTradeStatus(statusFilter);
  }, [statusFilter]);
  
  const filteredTrades = useMemo(() => {
    let filteredResults = [...trades];
    
    if (tradeStatus === 'open') {
      filteredResults = filteredResults.filter(trade => trade.status === 'open');
    } else if (tradeStatus === 'closed') {
      filteredResults = filteredResults.filter(trade => trade.status === 'closed');
    }
    
    if (dateParam) {
      const filterDate = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (isValid(filterDate)) {
        const dateString = format(filterDate, 'yyyy-MM-dd');
        filteredResults = filteredResults.filter(trade => {
          if (trade.exitDate) {
            return format(new Date(trade.exitDate), 'yyyy-MM-dd') === dateString;
          }
          return false;
        });
      }
    }
    
    if (strategyFilter !== 'all') {
      filteredResults = filteredResults.filter(trade => trade.strategy === strategyFilter);
    }
    
    if (resultFilter !== 'all') {
      filteredResults = filteredResults.filter(trade => {
        if (trade.status !== 'closed') return false;
        
        if (resultFilter === 'win') {
          return trade.metrics.profitLoss >= 0;
        } else { // resultFilter === 'loss'
          return trade.metrics.profitLoss < 0;
        }
      });
    }
    
    filteredResults.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'entryDate':
          aValue = new Date(a.entryDate).getTime();
          bValue = new Date(b.entryDate).getTime();
          break;
        case 'exitDate':
          aValue = a.exitDate ? new Date(a.exitDate).getTime() : 0;
          bValue = b.exitDate ? new Date(b.exitDate).getTime() : 0;
          break;
        case 'profitLoss':
          aValue = a.status === 'closed' ? a.metrics.profitLoss : 0;
          bValue = b.status === 'closed' ? b.metrics.profitLoss : 0;
          break;
        default:
          aValue = a[sortField as keyof TradeWithMetrics];
          bValue = b[sortField as keyof TradeWithMetrics];
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filteredResults;
  }, [trades, sortField, sortDirection, strategyFilter, resultFilter, dateParam, tradeStatus]);
  
  // Calculate total open risk for all open trades
  const totalOpenRisk = useMemo(() => {
    const openTrades = trades.filter(trade => trade.status === 'open');
    return openTrades.reduce((total, trade) => {
      if (trade.metrics.riskedAmount) {
        return total + trade.metrics.riskedAmount;
      }
      return total;
    }, 0);
  }, [trades]);
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const resetFilters = () => {
    setStrategyFilter('all');
    setResultFilter('all');
    if (dateParam) {
      navigate('/');
    }
  };
  
  const hasFilters = strategyFilter !== 'all' || resultFilter !== 'all' || dateParam;

  const limitedTrades = useMemo(() => {
    if (limit && filteredTrades.length > limit) {
      return filteredTrades.slice(0, limit);
    }
    return filteredTrades;
  }, [filteredTrades, limit]);
  
  // Helper to render grade badge
  const renderGradeBadge = (grade?: string) => {
    if (!grade) return null;
    
    const gradeColors: Record<string, string> = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${gradeColors[grade] || 'bg-gray-100'}`}>
        <Award className="h-3 w-3 mr-1" /> {grade}
      </div>
    );
  };
  
  return (
    <Card className="shadow-subtle border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Trades</CardTitle>
        
        <div className="flex items-center gap-2">
          {/* Show total open risk when viewing open trades */}
          {tradeStatus === 'open' && totalOpenRisk > 0 && (
            <div className="mr-2 flex items-center">
              <Gauge className="h-4 w-4 mr-1.5 text-orange-500" />
              <span className="font-medium mr-1">Total Risk:</span>
              <span className="text-orange-600">{formatCurrency(totalOpenRisk)}</span>
            </div>
          )}
          
          {/* Quick filter buttons for trade status */}
          <div className="flex mr-2">
            <Button 
              variant={tradeStatus === 'all' ? 'default' : 'outline'} 
              size="sm"
              className="rounded-r-none border-r-0"
              onClick={() => setTradeStatus('all')}
            >
              All
            </Button>
            <Button 
              variant={tradeStatus === 'open' ? 'default' : 'outline'} 
              size="sm"
              className="rounded-none border-x-0"
              onClick={() => setTradeStatus('open')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Open
            </Button>
            <Button 
              variant={tradeStatus === 'closed' ? 'default' : 'outline'} 
              size="sm"
              className="rounded-l-none border-l-0"
              onClick={() => setTradeStatus('closed')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Closed
            </Button>
          </div>
          
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {hasFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
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
      </CardHeader>
      
      <CardContent>
        {dateParam && (
          <div className="mb-4 p-2 bg-muted rounded-md flex justify-between items-center">
            <span>
              Showing trades closed on: <strong>{format(parse(dateParam, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2" onClick={() => handleSort('symbol')}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    Symbol
                    {sortField === 'symbol' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2" onClick={() => handleSort('direction')}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    Direction
                    {sortField === 'direction' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2" onClick={() => handleSort('strategy')}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    Strategy
                    {sortField === 'strategy' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2" onClick={() => handleSort('grade')}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    Grade
                    {sortField === 'grade' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2" onClick={() => handleSort('exitDate')}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    Exit Date
                    {sortField === 'exitDate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2" onClick={() => handleSort('profitLoss')}>
                  <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                    P&L / R
                    {sortField === 'profitLoss' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {limitedTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-muted-foreground">
                    No trades found
                  </td>
                </tr>
              ) : (
                limitedTrades.map(trade => (
                  <tr key={trade.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="font-medium">{trade.symbol}</div>
                      <div className="text-xs text-muted-foreground">{trade.type}</div>
                    </td>
                    <td className="p-2">
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        trade.direction === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.direction.toUpperCase()}
                      </div>
                    </td>
                    <td className="p-2">
                      {trade.strategy || 'Unspecified'}
                    </td>
                    <td className="p-2">
                      {renderGradeBadge(trade.grade)}
                    </td>
                    <td className="p-2">
                      {trade.exitDate 
                        ? format(new Date(trade.exitDate), 'MMM d, yyyy')
                        : '-'
                      }
                    </td>
                    <td className="p-2">
                      {trade.status === 'closed' ? (
                        <div className="flex items-center">
                          <span className={trade.metrics.profitLoss >= 0 ? 'text-profit' : 'text-loss'}>
                            {formatCurrency(trade.metrics.profitLoss)}
                          </span>
                          {trade.metrics.riskRewardRatio && trade.metrics.riskedAmount > 0 && (
                            <span className={`ml-2 ${trade.metrics.profitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                              ({trade.metrics.riskRewardRatio.toFixed(2)}R)
                            </span>
                          )}
                        </div>
                      ) : (
                        trade.metrics.riskedAmount ? formatCurrency(trade.metrics.riskedAmount) : '-'
                      )}
                    </td>
                    <td className="p-2">
                      {trade.status === 'open' ? (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-blue-500 mr-1" />
                          <span>Open</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span>Closed</span>
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <Link to={`/trade/${trade.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {limit && filteredTrades.length > limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link to="/">View All Trades</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
