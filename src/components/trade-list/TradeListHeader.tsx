
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Filter, RefreshCw, X, BadgeDollarSign } from "lucide-react";
import { formatCurrency } from '@/utils/calculations/formatters';
import { DateRangeFilterComponent } from './DateRangeFilterComponent';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from './useTradeList';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { getStrategyById } from '@/utils/strategyStorage';

interface TradeListHeaderProps {
  totalOpenRisk: number;
  tradeStatus: 'open' | 'closed' | 'all';
  setTradeStatus: (status: 'open' | 'closed' | 'all') => void;
  hasFilters: boolean;
  resetFilters: () => void;
  availableStrategies: string[];
  strategyFilter: string[];
  setStrategyFilter: (strategy: string[]) => void;
  availableAccounts?: string[];
  accountFilter?: string;
  setAccountFilter?: (account: string) => void;
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
  availableAccounts = [],
  accountFilter = 'all',
  setAccountFilter = () => {},
  resultFilter,
  setResultFilter,
  dateRangeFilter,
  filterByDate,
  filterByWeek,
  filterByMonth,
  filterByDateRange,
  clearDateFilter
}: TradeListHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [strategyPopoverOpen, setStrategyPopoverOpen] = useState(false);

  // Helper function to get strategy name from ID
  const getStrategyName = (strategyId: string): string => {
    if (strategyId === 'all') return 'All Strategies';
    const strategy = getStrategyById(strategyId);
    return strategy ? strategy.name : strategyId;
  };

  // Toggle a strategy in the multi-select filter
  const toggleStrategy = (strategyId: string) => {
    if (strategyFilter.includes(strategyId)) {
      setStrategyFilter(strategyFilter.filter(id => id !== strategyId));
    } else {
      setStrategyFilter([...strategyFilter, strategyId]);
    }
  };

  // Clear all selected strategies
  const clearStrategies = () => {
    setStrategyFilter([]);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h3 className="text-lg font-semibold">Trades</h3>
        <div className="flex items-center gap-2">
          {tradeStatus === 'open' && totalOpenRisk > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-sm">
              <BadgeDollarSign className="h-4 w-4 text-primary" />
              <span>Risk: {formatCurrency(totalOpenRisk)}</span>
            </div>
          )}
          
          <Select
            value={tradeStatus}
            onValueChange={(value) => setTradeStatus(value as 'open' | 'closed' | 'all')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Trades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {hasFilters && <span className="ml-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">!</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Strategy</h4>
                  <Popover open={strategyPopoverOpen} onOpenChange={setStrategyPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        role="combobox"
                      >
                        {strategyFilter.length === 0 
                          ? "All Strategies" 
                          : strategyFilter.length === 1 
                            ? getStrategyName(strategyFilter[0])
                            : `${strategyFilter.length} strategies selected`
                        }
                        {strategyFilter.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {strategyFilter.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandEmpty>No strategies found.</CommandEmpty>
                        <CommandGroup>
                          {availableStrategies.map((strategyId) => {
                            const strategyName = getStrategyName(strategyId);
                            return (
                              <CommandItem
                                key={strategyId}
                                onSelect={() => toggleStrategy(strategyId)}
                                className="cursor-pointer"
                              >
                                <div className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  strategyFilter.includes(strategyId) ? "bg-primary text-primary-foreground" : "opacity-50"
                                )}>
                                  {strategyFilter.includes(strategyId) && (
                                    <Check className={cn("h-4 w-4")} />
                                  )}
                                </div>
                                {strategyName}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </Command>
                      {strategyFilter.length > 0 && (
                        <div className="p-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearStrategies}
                            className="w-full text-xs"
                          >
                            Clear selection
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                
                {availableAccounts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Account</h4>
                    <Select
                      value={accountFilter}
                      onValueChange={setAccountFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {availableAccounts.map((account) => (
                          <SelectItem key={account} value={account}>
                            {account}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Result</h4>
                  <Select
                    value={resultFilter}
                    onValueChange={(value) => setResultFilter(value as 'all' | 'win' | 'loss')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Results" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Results</SelectItem>
                      <SelectItem value="win">Wins</SelectItem>
                      <SelectItem value="loss">Losses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Date Range</h4>
                  <DateRangeFilterComponent
                    dateRangeFilter={dateRangeFilter}
                    onFilterByDate={filterByDate}
                    onFilterByWeek={filterByWeek}
                    onFilterByMonth={filterByMonth}
                    onFilterByDateRange={filterByDateRange}
                    onClearFilter={clearDateFilter}
                  />
                </div>
                
                {hasFilters && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      resetFilters();
                      setIsFilterOpen(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
