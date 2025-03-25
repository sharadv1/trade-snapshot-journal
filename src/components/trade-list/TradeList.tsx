
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { TradeListHeader } from './TradeListHeader';
import { TradeListTable } from './TradeListTable';
import { DateFilterBanner } from './DateFilterBanner';
import { useTradeList } from './useTradeList';

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
    resultFilter,
    setResultFilter,
    availableStrategies,
    totalOpenRisk,
    hasFilters,
    resetFilters
  } = useTradeList({
    statusFilter,
    initialTrades: trades,
    limit,
    dateParam
  });
  
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
          resultFilter={resultFilter}
          setResultFilter={setResultFilter}
        />
      </CardHeader>
      
      <CardContent>
        <DateFilterBanner dateParam={dateParam} />
        
        <TradeListTable 
          trades={limitedTrades}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />
        
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
