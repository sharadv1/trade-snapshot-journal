
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarFilters } from './CalendarFilters';

interface CalendarHeaderProps {
  currentMonth: Date;
  availableStrategies: string[];
  strategyFilter: string;
  setStrategyFilter: (value: string) => void;
  resultFilter: 'all' | 'win' | 'loss';
  setResultFilter: (value: 'all' | 'win' | 'loss') => void;
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
  onNextMonth,
  onPrevMonth,
  onToday,
  onRefresh
}: CalendarHeaderProps) {
  return (
    <div className="flex-row justify-between items-center pb-2 flex">
      <div className="flex gap-2 items-center">
        <div className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        
        <Button variant="outline" size="sm" onClick={onToday}>
          <CalendarDays className="h-4 w-4 mr-1" />
          Today
        </Button>
      </div>
      
      <div className="flex gap-2 items-center">
        <CalendarFilters 
          strategies={availableStrategies}
          strategyFilter={strategyFilter}
          setStrategyFilter={setStrategyFilter}
          resultFilter={resultFilter}
          setResultFilter={setResultFilter}
          onRefresh={onRefresh}
        />
        
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
