
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  parse
} from 'date-fns';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { formatCurrency } from '@/utils/tradeCalculations';
import { Button } from './ui/button';

type DailyPnL = {
  [key: string]: {
    pnl: number;
    tradeCount: number;
  };
};

export function TradePnLCalendar() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    const loadTrades = () => {
      const allTrades = getTradesWithMetrics();
      // Only include closed trades (they have P&L)
      setTrades(allTrades.filter(trade => trade.status === 'closed'));
    };
    
    loadTrades();
    
    // Reload when localStorage changes (for multi-tab support)
    const handleStorageChange = () => {
      loadTrades();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate daily P&L for all trades
  const dailyPnL = useMemo(() => {
    const pnlByDay: DailyPnL = {};
    
    trades.forEach(trade => {
      if (trade.exitDate && trade.metrics.profitLoss !== undefined) {
        // Format date as YYYY-MM-DD for consistent keys
        const exitDay = format(new Date(trade.exitDate), 'yyyy-MM-dd');
        
        if (!pnlByDay[exitDay]) {
          pnlByDay[exitDay] = { pnl: 0, tradeCount: 0 };
        }
        
        pnlByDay[exitDay].pnl += trade.metrics.profitLoss;
        pnlByDay[exitDay].tradeCount += 1;
      }
    });
    
    return pnlByDay;
  }, [trades]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Create calendar grid with leading and trailing days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = startOfMonth(currentMonth);
    const firstDayOfWeek = getDay(firstDayOfMonth); // 0 = Sunday, 1 = Monday, etc.
    
    const days = [...daysInMonth];
    
    // Add empty cells before the first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.unshift(null);
    }
    
    // Group days into weeks (rows of 7)
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    // If the last week is not complete, pad with nulls
    const lastWeek = weeks[weeks.length - 1];
    if (lastWeek.length < 7) {
      for (let i = lastWeek.length; i < 7; i++) {
        lastWeek.push(null);
      }
    }
    
    return weeks;
  }, [daysInMonth, currentMonth]);

  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  // Determine cell background color based on P&L
  const getCellClass = (day: Date | null) => {
    if (!day) return '';
    
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayData = dailyPnL[dateKey];
    
    if (!dayData) return 'bg-background';
    
    return dayData.pnl >= 0 
      ? 'bg-profit/20' 
      : 'bg-loss/20';
  };

  return (
    <Card className="shadow-subtle border">
      <CardHeader className="flex-row justify-between items-center pb-2">
        <CardTitle className="text-xl">
          {format(currentMonth, 'MMMM yyyy')}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center p-2 font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.flat().map((day, i) => {
            if (!day) {
              return (
                <div 
                  key={`empty-${i}`} 
                  className="border rounded-md p-2 h-24 flex flex-col items-center bg-muted/20"
                >
                  {/* Empty cell */}
                </div>
              );
            }
            
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = dailyPnL[dateKey];
            
            return (
              <div 
                key={dateKey} 
                className={`border rounded-md p-2 h-24 flex flex-col ${getCellClass(day)}`}
              >
                <div className="self-end text-sm font-medium">
                  {format(day, 'd')}
                </div>
                {dayData ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-1">
                    <div className={`text-lg font-bold ${dayData.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatCurrency(dayData.pnl)}
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
          })}
        </div>
      </CardContent>
    </Card>
  );
}
