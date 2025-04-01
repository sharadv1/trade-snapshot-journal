
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
    return <div className="border h-14 p-1" />;
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
        "h-14 p-0 w-full border",
        hasTrades ? 'cursor-pointer' : 'cursor-default',
        isToday ? 'border-2 border-primary' : ''
      )}
      onClick={handleClick}
      disabled={!hasTrades}
    >
      <div
        className={cn(
          "h-full w-full flex flex-row justify-between p-1",
          hasTrades && isProfitable ? "bg-green-50" : "",
          hasTrades && !isProfitable ? "bg-red-50" : ""
        )}
      >
        {/* Date number at the left */}
        <div className="flex items-start">
          <span className={cn(
            "text-xs font-medium pt-0.5",
            isToday ? "text-primary" : "text-foreground"
          )}>
            {format(day, 'd')}
          </span>
        </div>
        
        {/* PnL and trade data on the right */}
        {hasTrades && (
          <div className="flex flex-col items-end">
            <div className={cn(
              "text-xs font-semibold",
              getPnLColor(dayData.pnl)
            )}>
              {formatCurrency(dayData.pnl)}
            </div>
            
            <div className="text-xs text-muted-foreground">
              {dayData.tradeCount}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
