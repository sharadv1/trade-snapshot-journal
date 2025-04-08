
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeDollarSign, Filter, RefreshCw, X } from "lucide-react";
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

interface TradeListHeaderProps {
  totalOpenRisk: number;
  tradeStatus: 'open' | 'closed' | 'all';
  setTradeStatus: (status: 'open' | 'closed' | 'all') => void;
  hasFilters: boolean;
  resetFilters: () => void;
  availableStrategies: string[];
  strategyFilter: string;
  setStrategyFilter: (strategy: string) => void;
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
                    filterByDate={filterByDate}
                    filterByWeek={filterByWeek}
                    filterByMonth={filterByMonth}
                    filterByDateRange={filterByDateRange}
                    clearDateFilter={clearDateFilter}
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
      
      <Tabs value={tradeStatus} onValueChange={(v) => setTradeStatus(v as 'open' | 'closed' | 'all')}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">All Trades</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
