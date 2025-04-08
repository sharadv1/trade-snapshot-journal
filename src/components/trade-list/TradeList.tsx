import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeListHeader } from './TradeListHeader';
import { TradeListTable } from './TradeListTable';
import { DateFilterBanner } from './DateFilterBanner';
import { useTradeList } from './useTradeList';
import { getAccounts } from '@/utils/accountStorage';

interface TradeListProps {
  statusFilter?: 'open' | 'closed' | 'all';
  initialTrades?: TradeWithMetrics[];
  limit?: number;
  onTradeDeleted?: () => void;
}

export function TradeList({ statusFilter = 'all', initialTrades, limit, onTradeDeleted }: TradeListProps) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const dateParam = queryParams.get('date');
  
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accounts, setAccounts] = useState<string[]>([]);
  
  useEffect(() => {
    const loadTrades = () => {
      if (!initialTrades) {
        console.log('Loading trades in TradeList component');
        const allTrades = getTradesWithMetrics();
        console.log(`Loaded ${allTrades.length} trades in TradeList`);
        setTrades(allTrades);
      } else {
        setTrades(initialTrades);
      }
      
      const availableAccounts = getAccounts();
      setAccounts(availableAccounts);
    };
    
    loadTrades();
    
    if (!initialTrades) {
      const handleStorageChange = (event: StorageEvent | Event) => {
        if (
          (event instanceof StorageEvent && event.key === 'trade-journal-trades') || 
          event.type === 'trades-updated'
        ) {
          console.log('Storage change detected in TradeList');
          loadTrades();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('trades-updated', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('trades-updated', handleStorageChange);
      };
    }
  }, [initialTrades, refreshKey]);
  
  const {
    limitedTrades,
    filteredTrades,
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
    availableAccounts: tradeDerivedAccounts,
    totalOpenRisk,
    hasFilters,
    resetFilters
  } = useTradeList({
    statusFilter,
    initialTrades: trades,
    limit,
    dateParam
  });
  
  const handleRefresh = () => {
    console.log('Manual refresh requested in TradeList');
    setRefreshKey(prev => prev + 1);
  };
  
  const combinedAccounts = useMemo(() => {
    const combinedSet = new Set([...accounts, ...tradeDerivedAccounts]);
    return Array.from(combinedSet).sort();
  }, [accounts, tradeDerivedAccounts]);
  
  return (
    <Card className="shadow-subtle border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <TradeListHeader 
          totalOpenRisk={totalOpenRisk}
          tradeStatus={tradeStatus}
          setTradeStatus={setTradeStatus}
          hasFilters={hasFilters}
          resetFilters={resetFilters}
          availableStrategies={availableStrategies}
          strategyFilter={strategyFilter}
          setStrategyFilter={setStrategyFilter}
          availableAccounts={combinedAccounts}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          resultFilter={resultFilter}
          setResultFilter={setResultFilter}
          dateRangeFilter={dateRangeFilter}
          filterByDate={filterByDate}
          filterByWeek={filterByWeek}
          filterByMonth={filterByMonth}
          filterByDateRange={filterByDateRange}
          clearDateFilter={clearDateFilter}
        />
      </CardHeader>
      
      <CardContent>
        <DateFilterBanner 
          dateParam={dateParam} 
          dateRangeFilter={dateRangeFilter} 
          onClearFilter={clearDateFilter} 
        />
        
        {filteredTrades.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No trades match your current filters</p>
            {hasFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
            {!hasFilters && (
              <Button variant="outline" asChild>
                <Link to="/trade/new">Add Your First Trade</Link>
              </Button>
            )}
          </div>
        ) : (
          <TradeListTable 
            trades={limitedTrades}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            onTradeDeleted={() => {
              if (onTradeDeleted) {
                onTradeDeleted();
              }
              handleRefresh();
            }}
          />
        )}
        
        {limit && filteredTrades.length > limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link to="/trades">View All Trades</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
