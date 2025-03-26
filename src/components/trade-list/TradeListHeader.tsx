
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/utils/calculations/formatters";
import { DateRangeFilterComponent } from "./DateRangeFilterComponent";
import { DateRangeFilter } from "./useTradeList";
import { XCircle } from "lucide-react";

interface TradeListHeaderProps {
  totalOpenRisk?: number;
  tradeStatus: 'open' | 'closed' | 'all';
  setTradeStatus: (status: 'open' | 'closed' | 'all') => void;
  hasFilters: boolean;
  resetFilters: () => void;
  availableStrategies: string[];
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
}

export function TradeListHeader({
  totalOpenRisk,
  tradeStatus,
  setTradeStatus,
  hasFilters,
  resetFilters,
  availableStrategies,
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
}: TradeListHeaderProps) {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between gap-2">
      <div className="flex flex-row items-center gap-2">
        <Select
          value={tradeStatus}
          onValueChange={(value) => setTradeStatus(value as 'open' | 'closed' | 'all')}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            <SelectItem value="open">Open Trades</SelectItem>
            <SelectItem value="closed">Closed Trades</SelectItem>
          </SelectContent>
        </Select>
        
        {totalOpenRisk !== undefined && totalOpenRisk > 0 && tradeStatus !== 'closed' && (
          <Badge variant="outline" className="ml-2">
            Open Risk: {formatCurrency(totalOpenRisk)}
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {availableStrategies.length > 0 && (
          <Select
            value={strategyFilter}
            onValueChange={setStrategyFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Strategy" />
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
        )}
        
        <Select
          value={resultFilter}
          onValueChange={(value) => setResultFilter(value as 'all' | 'win' | 'loss')}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="win">Wins</SelectItem>
            <SelectItem value="loss">Losses</SelectItem>
          </SelectContent>
        </Select>
        
        <DateRangeFilterComponent
          dateRangeFilter={dateRangeFilter}
          onFilterByDate={filterByDate}
          onFilterByWeek={filterByWeek}
          onFilterByMonth={filterByMonth}
          onFilterByDateRange={filterByDateRange}
          onClearFilter={clearDateFilter}
        />
        
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={resetFilters}
            title="Clear all filters"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
