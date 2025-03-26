
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/calculations/formatters';

interface DayCellProps {
  day: Date | null;
  dayData?: {
    pnl: number;
    tradeCount: number;
    tradeIds: string[];
    rValue?: number;
  };
  onDayClick: (day: Date) => void;
}

export function DayCell({ day, dayData, onDayClick }: DayCellProps) {
  if (!day) {
    return (
      <div className="border rounded-md p-2 h-24 flex flex-col items-center bg-muted/20">
        {/* Empty cell */}
      </div>
    );
  }

  const isCurrentDay = isToday(day);
  
  const getCellClass = () => {
    let classes = '';
    
    if (isCurrentDay) {
      classes += 'ring-2 ring-primary font-bold ';
    }
    
    if (!dayData) return classes + 'bg-background';
    
    return classes + (dayData.pnl >= 0 
      ? 'bg-profit/20' 
      : 'bg-loss/20');
  };
  
  return (
    <div 
      className={`border rounded-md p-2 h-24 flex flex-col ${getCellClass()} ${dayData ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${isCurrentDay ? 'shadow-md' : ''}`}
      onClick={() => dayData && onDayClick(day)}
    >
      <div className={`self-end text-sm font-medium ${isCurrentDay ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
        {format(day, 'd')}
      </div>
      {dayData ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-1">
          <div className={`text-lg font-bold ${dayData.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatCurrency(dayData.pnl)}
          </div>
          {dayData.rValue !== undefined && (
            <div className="text-xs font-medium">
              R: {dayData.rValue.toFixed(2)}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {dayData.tradeCount} {dayData.tradeCount === 1 ? 'trade' : 'trades'}
          </div>
        </div>
      ) : (
        <div className="flex-1"></div>
      )}
    </div>
  );
}
