
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
    return <div className="h-16 rounded-xl" />;
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
    <button
      className={cn(
        "relative h-16 p-0 w-full rounded-xl border border-gray-200",
        hasTrades ? 'cursor-pointer' : 'cursor-default',
        hasTrades && isProfitable ? "bg-green-100" : "",
        hasTrades && !isProfitable ? "bg-red-100" : "",
        isToday ? 'border-primary' : ''
      )}
      onClick={handleClick}
      disabled={!hasTrades}
    >
      {/* Date number at top right */}
      <div className="absolute top-1 right-2 text-base font-semibold text-gray-800">
        {format(day, 'd')}
      </div>
      
      {/* PnL and trade data */}
      {hasTrades && (
        <div className="absolute inset-x-0 bottom-0 p-2 flex flex-col items-center">
          <div className={cn(
            "text-lg font-bold",
            isProfitable ? "text-green-500" : "text-red-500"
          )}>
            {isProfitable ? formatCurrency(dayData.pnl) : formatCurrency(dayData.pnl)}
          </div>
          
          <div className="text-sm text-gray-500">
            {dayData.tradeCount} {dayData.tradeCount === 1 ? 'trade' : 'trades'}
          </div>
        </div>
      )}
    </button>
  );
}
