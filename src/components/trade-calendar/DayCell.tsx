
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
    return <div className="aspect-square p-1 border" />;
  }
  
  const isToday = day.toDateString() === new Date().toDateString();
  const hasTrades = dayData && dayData.tradeCount > 0;
  const isProfitable = dayData && dayData.pnl > 0;
  
  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  const handleClick = () => {
    if (hasTrades) {
      console.log("DayCell clicked with date:", day);
      onDayClick(day);
    }
  };
  
  return (
    <button
      className={cn(
        "h-24 p-1 w-full border",
        hasTrades ? 'cursor-pointer' : 'cursor-default',
        isToday ? 'border-2 border-primary' : ''
      )}
      onClick={handleClick}
      disabled={!hasTrades}
    >
      <div
        className={cn(
          "h-full w-full flex flex-col justify-between p-1",
          hasTrades && isProfitable ? "bg-green-100" : "",
          hasTrades && !isProfitable ? "bg-red-100" : ""
        )}
      >
        {/* Date number at the top right */}
        <div className="w-full text-right">
          <span className={cn(
            "inline-block px-1 text-sm font-medium",
            isToday ? "text-primary" : "text-foreground"
          )}>
            {format(day, 'd')}
          </span>
        </div>
        
        {/* PnL and trade data in the center */}
        {hasTrades && (
          <div className="w-full flex-grow flex flex-col justify-center items-center mt-1 space-y-0.5">
            <div className={cn(
              "text-base font-semibold",
              getPnLColor(dayData.pnl)
            )}>
              {formatCurrency(dayData.pnl)}
            </div>
            
            <div className="text-xs text-muted-foreground">
              {dayData.tradeCount} {dayData.tradeCount === 1 ? 'trade' : 'trades'}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
