
import { Button } from '@/components/ui/button';
import { DateRangeFilterComponent } from './DateRangeFilter';
import { DateRangeFilter } from './useTradeList';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradeListHeaderProps {
  totalOpenRisk: number;
  tradeStatus: 'open' | 'closed' | 'all';
  setTradeStatus: (status: 'open' | 'closed' | 'all') => void;
  strategyFilter: string;
  setStrategyFilter: (strategy: string) => void;
  resultFilter: 'all' | 'win' | 'loss';
  setResultFilter: (result: 'all' | 'win' | 'loss') => void;
  dateRangeFilter: DateRangeFilter;
  filterByDate: (date: Date) => void;
  filterByWeek: (date: Date) => void;
  filterByMonth: (date: Date) => void;
  filterByDateRange: (startDate: Date, endDate: Date) => void;
  clearDateFilter: () => void;
  availableStrategies: string[];
  hasFilters: boolean;
  resetFilters: () => void;
}

export function TradeListHeader({
  totalOpenRisk,
  tradeStatus,
  setTradeStatus,
  strategyFilter,
  setStrategyFilter,
  resultFilter,
  setResultFilter,
  dateRangeFilter,
  filterByDate,
  filterByWeek,
  filterByMonth,
  filterByDateRange,
  clearDateFilter,
  availableStrategies,
  hasFilters,
  resetFilters
}: TradeListHeaderProps) {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          {tradeStatus === 'all' ? 'All Trades' : 
           tradeStatus === 'open' ? 'Open Trades' : 'Closed Trades'}
        </h2>
        {tradeStatus === 'open' && totalOpenRisk > 0 && (
          <p className="text-sm text-muted-foreground">
            Total Open Risk: ${totalOpenRisk.toFixed(2)}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        {/* Trade Status Filter */}
        <Select value={tradeStatus} onValueChange={(value) => setTradeStatus(value as 'open' | 'closed' | 'all')}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            <SelectItem value="open">Open Trades</SelectItem>
            <SelectItem value="closed">Closed Trades</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Strategy Filter */}
        <Select value={strategyFilter} onValueChange={setStrategyFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Strategies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategies</SelectItem>
            {availableStrategies.map((strategy) => (
              <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Result Filter */}
        <Select value={resultFilter} onValueChange={(value) => setResultFilter(value as 'all' | 'win' | 'loss')}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="win">Win</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Date Range Filter */}
        <DateRangeFilterComponent
          dateRangeFilter={dateRangeFilter}
          onFilterByDate={filterByDate}
          onFilterByWeek={filterByWeek}
          onFilterByMonth={filterByMonth}
          onFilterByDateRange={filterByDateRange}
          onClearFilter={clearDateFilter}
        />
        
        {/* Reset Button - only show if filters are applied */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
