
import { useState, useEffect, useMemo } from 'react';
import { TradeWithMetrics } from '@/types';
import { format, parse, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface UseTradeListProps {
  statusFilter?: 'open' | 'closed' | 'all';
  initialTrades?: TradeWithMetrics[];
  limit?: number;
  dateParam: string | null;
}

export type DateRangeFilter = {
  type: 'date' | 'week' | 'month' | 'range' | 'none';
  startDate?: Date | null;
  endDate?: Date | null;
};

export function useTradeList({ 
  statusFilter = 'all', 
  initialTrades = [],
  limit,
  dateParam
}: UseTradeListProps) {
  // State for internal trade data
  const [trades, setTrades] = useState<TradeWithMetrics[]>(initialTrades);
  
  // State for filters and sorting
  const [sortField, setSortField] = useState<string>('entryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [strategyFilter, setStrategyFilter] = useState<string[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [tradeStatus, setTradeStatus] = useState<'open' | 'closed' | 'all'>(statusFilter);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({
    type: 'none'
  });
  
  // Update trades when initialTrades changes
  useEffect(() => {
    console.log(`useTradeList: initialTrades updated with ${initialTrades.length} trades`);
    setTrades(initialTrades);
  }, [initialTrades]);
  
  // Update tradeStatus if statusFilter prop changes
  useEffect(() => {
    setTradeStatus(statusFilter);
  }, [statusFilter]);

  // Initialize date filter from URL param if provided
  useEffect(() => {
    if (dateParam) {
      const filterDate = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (isValid(filterDate)) {
        setDateRangeFilter({
          type: 'date',
          startDate: filterDate,
          endDate: filterDate,
        });
      }
    }
  }, [dateParam]);
  
  // Filter by week
  const filterByWeek = (date: Date) => {
    setDateRangeFilter({
      type: 'week',
      startDate: startOfWeek(date, { weekStartsOn: 0 }), // 0 = Sunday
      endDate: endOfWeek(date, { weekStartsOn: 0 })
    });
  };
  
  // Filter by month
  const filterByMonth = (date: Date) => {
    setDateRangeFilter({
      type: 'month',
      startDate: startOfMonth(date),
      endDate: endOfMonth(date)
    });
  };
  
  // Filter by date range
  const filterByDateRange = (startDate: Date, endDate: Date) => {
    setDateRangeFilter({
      type: 'range',
      startDate,
      endDate
    });
  };
  
  // Filter by single date
  const filterByDate = (date: Date) => {
    setDateRangeFilter({
      type: 'date',
      startDate: date,
      endDate: date
    });
  };
  
  // Clear date filter
  const clearDateFilter = () => {
    setDateRangeFilter({
      type: 'none'
    });
  };
  
  // Get available strategies from trades
  const availableStrategies = useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach(trade => {
      if (trade.strategy) {
        strategies.add(trade.strategy);
      }
    });
    return Array.from(strategies).sort();
  }, [trades]);

  // Get available accounts from trades
  const availableAccounts = useMemo(() => {
    const accounts = new Set<string>();
    trades.forEach(trade => {
      if (trade.account) {
        accounts.add(trade.account);
      }
    });
    return Array.from(accounts).sort();
  }, [trades]);
  
  // Calculate total open risk
  const totalOpenRisk = useMemo(() => {
    const openTrades = trades.filter(trade => trade.status === 'open');
    return openTrades.reduce((total, trade) => {
      if (trade.metrics?.riskedAmount) {
        return total + trade.metrics.riskedAmount;
      }
      return total;
    }, 0);
  }, [trades]);
  
  // Apply filters and sorting
  const filteredTrades = useMemo(() => {
    console.log(`Filtering ${trades.length} trades with status: ${tradeStatus}, strategies: ${strategyFilter.join(',')}, account: ${accountFilter}, result: ${resultFilter}`);
    
    let filteredResults = [...trades];
    
    // Filter by trade status
    if (tradeStatus === 'open') {
      filteredResults = filteredResults.filter(trade => trade.status === 'open');
    } else if (tradeStatus === 'closed') {
      filteredResults = filteredResults.filter(trade => trade.status === 'closed');
    }
    
    // Apply date range filter if active
    if (dateRangeFilter.type !== 'none' && dateRangeFilter.startDate && dateRangeFilter.endDate) {
      filteredResults = filteredResults.filter(trade => {
        // Use exitDate for closed trades, entryDate for open trades
        const tradeDate = trade.status === 'closed' && trade.exitDate 
          ? new Date(trade.exitDate) 
          : new Date(trade.entryDate);
        
        if (dateRangeFilter.type === 'date') {
          // Single date: compare year, month, and day
          const filterDate = dateRangeFilter.startDate;
          return (
            tradeDate.getFullYear() === filterDate.getFullYear() &&
            tradeDate.getMonth() === filterDate.getMonth() &&
            tradeDate.getDate() === filterDate.getDate()
          );
        } else {
          // Date range: check if within interval
          return isWithinInterval(tradeDate, {
            start: dateRangeFilter.startDate,
            end: dateRangeFilter.endDate
          });
        }
      });
    }
    
    // Legacy date parameter filter (URL parameter)
    else if (dateParam) {
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
    
    // Filter by multiple strategies
    if (strategyFilter.length > 0) {
      filteredResults = filteredResults.filter(trade => 
        trade.strategy && strategyFilter.includes(trade.strategy)
      );
    }

    // Filter by account
    if (accountFilter !== 'all') {
      filteredResults = filteredResults.filter(trade => trade.account === accountFilter);
    }
    
    // Filter by result (win/loss)
    if (resultFilter !== 'all') {
      filteredResults = filteredResults.filter(trade => {
        if (trade.status !== 'closed') return false;
        
        if (resultFilter === 'win') {
          return (trade.metrics?.profitLoss || 0) >= 0;
        } else { // resultFilter === 'loss'
          return (trade.metrics?.profitLoss || 0) < 0;
        }
      });
    }
    
    // Apply sorting
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
          aValue = a.status === 'closed' ? (a.metrics?.profitLoss || 0) : 0;
          bValue = b.status === 'closed' ? (b.metrics?.profitLoss || 0) : 0;
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
    
    console.log(`Filtered to ${filteredResults.length} trades`);
    return filteredResults;
  }, [trades, sortField, sortDirection, strategyFilter, accountFilter, resultFilter, dateParam, tradeStatus, dateRangeFilter]);
  
  // Apply limit to filtered trades if specified
  const limitedTrades = useMemo(() => {
    if (limit && filteredTrades.length > limit) {
      return filteredTrades.slice(0, limit);
    }
    return filteredTrades;
  }, [filteredTrades, limit]);
  
  // Handler for sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Check if any filters are applied
  const hasFilters = strategyFilter.length > 0 || 
    accountFilter !== 'all' ||
    resultFilter !== 'all' || 
    dateParam !== null ||
    dateRangeFilter.type !== 'none';
  
  // Reset filters
  const resetFilters = () => {
    setStrategyFilter([]);
    setAccountFilter('all');
    setResultFilter('all');
    clearDateFilter();
  };
  
  return {
    trades,
    filteredTrades,
    limitedTrades,
    sortField,
    sortDirection,
    handleSort,
    tradeStatus,
    setTradeStatus,
    strategyFilter,
    setStrategyFilter,
    accountFilter,
    setAccountFilter,
    resultFilter,
    setResultFilter,
    dateRangeFilter,
    filterByDate,
    filterByWeek,
    filterByMonth,
    filterByDateRange,
    clearDateFilter,
    availableStrategies,
    availableAccounts,
    totalOpenRisk,
    hasFilters,
    resetFilters
  };
}
