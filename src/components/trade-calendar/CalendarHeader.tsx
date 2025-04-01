
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
    <div className="flex-row justify-between items-center pb-1 flex">
      <div className="flex gap-2 items-center">
        <div className="text-base font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onToday}>
          <CalendarDays className="h-3 w-3 mr-1" />
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
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={onPrevMonth}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={onNextMonth}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
