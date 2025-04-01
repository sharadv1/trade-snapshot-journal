
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
    return <div className="border rounded-md p-2 h-24 flex flex-col items-center bg-muted/20"></div>;
  }
  
  const isToday = day.toDateString() === new Date().toDateString();
  const hasTrades = dayData && dayData.tradeCount > 0;
  const isProfitable = dayData && dayData.pnl > 0;
  
  const handleClick = () => {
    if (hasTrades) {
      console.log("DayCell clicked with date:", day);
      onDayClick(day);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-md p-2 h-24 flex flex-col",
        !hasTrades && "bg-background",
        hasTrades && isProfitable && "bg-profit/20 cursor-pointer hover:shadow-md transition-shadow",
        hasTrades && !isProfitable && "bg-loss/20 cursor-pointer hover:shadow-md transition-shadow",
        isToday && "ring-2 ring-primary font-bold bg-background shadow-md"
      )}
      onClick={hasTrades ? handleClick : undefined}
    >
      {/* Date number at top right */}
      <div className={cn(
        "self-end text-sm font-medium",
        isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
      )}>
        {format(day, 'd')}
      </div>
      
      {/* PnL and trade data */}
      {hasTrades ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-1">
          <div className={cn(
            "text-lg font-bold",
            isProfitable ? "text-profit" : "text-loss"
          )}>
            {isProfitable ? formatCurrency(dayData.pnl) : formatCurrency(dayData.pnl)}
          </div>
          
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
