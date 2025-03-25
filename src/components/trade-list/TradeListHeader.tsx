
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Clock, CheckCircle, Gauge } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from '@/utils/calculations/formatters';

interface TradeListHeaderProps {
  title?: string;
  totalOpenRisk: number;
  tradeStatus: 'open' | 'closed' | 'all';
  setTradeStatus: (status: 'open' | 'closed' | 'all') => void;
  hasFilters: boolean;
  resetFilters: () => void;
  availableStrategies: string[];
  strategyFilter: string;
  setStrategyFilter: (strategy: string) => void;
  resultFilter: 'all' | 'win' | 'loss';
  setResultFilter: (result: 'all' | 'win' | 'loss') => void;
}

export function TradeListHeader({
  title = "Trades",
  totalOpenRisk,
  tradeStatus,
  setTradeStatus,
  hasFilters,
  resetFilters,
  availableStrategies,
  strategyFilter,
  setStrategyFilter,
  resultFilter,
  setResultFilter
}: TradeListHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between pb-2 w-full">
      <CardTitle className="text-xl">{title}</CardTitle>
      
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
        
        <FilterPopover 
          availableStrategies={availableStrategies}
          strategyFilter={strategyFilter}
          setStrategyFilter={setStrategyFilter}
          resultFilter={resultFilter}
          setResultFilter={setResultFilter}
          hasFilters={hasFilters}
        />
      </div>
    </div>
  );
}

interface FilterPopoverProps {
  availableStrategies: string[];
  strategyFilter: string;
  setStrategyFilter: (strategy: string) => void;
  resultFilter: 'all' | 'win' | 'loss';
  setResultFilter: (result: 'all' | 'win' | 'loss') => void;
  hasFilters: boolean;
}

function FilterPopover({
  availableStrategies,
  strategyFilter,
  setStrategyFilter,
  resultFilter,
  setResultFilter,
  hasFilters
}: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {hasFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
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
  );
}

// Need to import these icons that are used in the component
import { Trophy, X as XIcon } from 'lucide-react';
