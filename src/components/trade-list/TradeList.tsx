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
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from '@/components/ui/pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = limit || 10;
  
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
  
  // Calculate pagination values
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  
  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrades, currentPage, itemsPerPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tradeStatus, strategyFilter, accountFilter, resultFilter, dateRangeFilter, sortField, sortDirection]);
  
  const handleRefresh = () => {
    console.log('Manual refresh requested in TradeList');
    setRefreshKey(prev => prev + 1);
  };
  
  const combinedAccounts = useMemo(() => {
    const combinedSet = new Set([...accounts, ...tradeDerivedAccounts]);
    return Array.from(combinedSet).sort();
  }, [accounts, tradeDerivedAccounts]);
  
  // Create an array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Show at most 5 page numbers
    
    if (totalPages <= maxVisiblePages) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include page 1
      pageNumbers.push(1);
      
      if (currentPage <= 3) {
        // If we're on pages 1-3, show 1-5
        for (let i = 2; i <= 5; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // If we're near the end, show the last 5 pages
        for (let i = totalPages - 4; i <= totalPages; i++) {
          if (i > 1) pageNumbers.push(i);
        }
      } else {
        // Otherwise show current page and 2 pages on either side
        if (currentPage - 2 > 1) pageNumbers.push(null); // ellipsis
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
          pageNumbers.push(i);
        }
        if (currentPage + 2 < totalPages) pageNumbers.push(null); // ellipsis
      }
      
      // Always include the last page if it's not already added
      if (!pageNumbers.includes(totalPages)) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
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
          <>
            <TradeListTable 
              trades={currentItems}
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
            
            {/* Show pagination if we have multiple pages */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                          className="cursor-pointer" 
                        />
                      </PaginationItem>
                    )}
                    
                    {getPageNumbers().map((page, index) => (
                      page === null ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <span className="px-4 py-2">...</span>
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={`page-${page}`}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page as number)}
                            className={currentPage === page ? 'pointer-events-none' : 'cursor-pointer'}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    ))}
                    
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                          className="cursor-pointer" 
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
        
        {/* For Dashboard: Show the "View All" button below pagination if we have limited view */}
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
