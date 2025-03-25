
import { Filter, Trophy, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CalendarFiltersProps {
  strategies: string[];
  strategyFilter: string;
  setStrategyFilter: (value: string) => void;
  resultFilter: 'all' | 'win' | 'loss';
  setResultFilter: (value: 'all' | 'win' | 'loss') => void;
  onRefresh: () => void;
}

export function CalendarFilters({
  strategies,
  strategyFilter,
  setStrategyFilter,
  resultFilter,
  setResultFilter,
  onRefresh
}: CalendarFiltersProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filters
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
                {strategies.map((strategy) => (
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

          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            Refresh Calendar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
