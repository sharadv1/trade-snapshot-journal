
import { format } from 'date-fns';
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
    return <div className="aspect-square p-1" />;
  }
  
  const isToday = day.toDateString() === new Date().toDateString();
  const hasTrades = dayData && dayData.tradeCount > 0;
  
  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  return (
    <button
      className={cn(
        "aspect-square p-1 w-full",
        hasTrades ? 'cursor-pointer' : 'cursor-default'
      )}
      onClick={() => hasTrades && onDayClick(day)}
      disabled={!hasTrades}
    >
      <div
        className={cn(
          "h-full w-full rounded-md flex flex-col items-center justify-start p-1",
          isToday ? "bg-primary/10 border border-primary" : hasTrades ? "bg-accent/40" : ""
        )}
      >
        <div className={cn(
          "text-xs font-medium",
          isToday ? "text-primary" : "text-foreground"
        )}>
          {format(day, 'd')}
        </div>
        
        {hasTrades && (
          <div className="w-full mt-auto space-y-0.5">
            <div className={cn(
              "text-xs font-semibold text-center truncate",
              getPnLColor(dayData.pnl)
            )}>
              {formatCurrency(dayData.pnl)}
            </div>
            
            {dayData.rValue !== undefined && (
              <div className={cn(
                "text-xs font-medium text-center truncate",
                getPnLColor(dayData.rValue)
              )}>
                {dayData.rValue > 0 ? "+" : ""}{dayData.rValue.toFixed(1)}R
              </div>
            )}
            
            <div className="text-[10px] text-center text-muted-foreground">
              {dayData.tradeCount} {dayData.tradeCount === 1 ? 'trade' : 'trades'}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
