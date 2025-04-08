
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CalendarFilters } from './CalendarFilters';

interface CalendarHeaderProps {
  currentMonth: Date;
  availableStrategies: string[];
  strategyFilter: string;
  setStrategyFilter: (value: string) => void;
  resultFilter: 'all' | 'win' | 'loss';
  setResultFilter: (value: 'all' | 'win' | 'loss') => void;
  availableAccounts?: string[];
  accountFilter?: string;
  setAccountFilter?: (value: string) => void;
  onNextMonth: () => void;
  onPrevMonth: () => void;
  onToday: () => void;
  onRefresh: () => void;
}

export function CalendarHeader({
  currentMonth,
  availableStrategies,
  strategyFilter,
  setStrategyFilter,
  resultFilter,
  setResultFilter,
  availableAccounts = [],
  accountFilter = 'all',
  setAccountFilter = () => {},
  onNextMonth,
  onPrevMonth,
  onToday,
  onRefresh
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarDays className="h-5 w-5 mr-2 text-primary" />
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <CalendarFilters 
            strategies={availableStrategies}
            strategyFilter={strategyFilter}
            setStrategyFilter={setStrategyFilter}
            resultFilter={resultFilter}
            setResultFilter={setResultFilter}
            accounts={availableAccounts}
            accountFilter={accountFilter}
            setAccountFilter={setAccountFilter}
            onRefresh={onRefresh}
          />
          
          <div className="flex">
            <Button variant="outline" size="icon" onClick={onPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday} className="mx-1">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={onNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
