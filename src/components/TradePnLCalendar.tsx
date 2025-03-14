
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { formatCurrency } from '@/utils/tradeCalculations';

type DailyPnL = {
  [key: string]: number;
};

export function TradePnLCalendar() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDayPnL, setSelectedDayPnL] = useState<number | null>(null);
  const [selectedDayTrades, setSelectedDayTrades] = useState<TradeWithMetrics[]>([]);

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
          pnlByDay[exitDay] = 0;
        }
        
        pnlByDay[exitDay] += trade.metrics.profitLoss;
      }
    });
    
    return pnlByDay;
  }, [trades]);

  // Update selected day's P&L and trades when date changes
  useEffect(() => {
    if (date) {
      const dateKey = format(date, 'yyyy-MM-dd');
      setSelectedDayPnL(dailyPnL[dateKey] || null);
      
      // Find trades that were closed on this day
      const tradesOnSelectedDay = trades.filter(trade => 
        trade.exitDate && isSameDay(new Date(trade.exitDate), date)
      );
      
      setSelectedDayTrades(tradesOnSelectedDay);
    } else {
      setSelectedDayPnL(null);
      setSelectedDayTrades([]);
    }
  }, [date, dailyPnL, trades]);

  // Calendar day renderer with P&L highlights
  const dayClassName = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayPnL = dailyPnL[dateKey];
    
    if (dayPnL === undefined) return '';
    
    return dayPnL >= 0 
      ? 'bg-profit/20 text-profit font-medium' 
      : 'bg-loss/20 text-loss font-medium';
  };

  return (
    <Card className="shadow-subtle border">
      <CardHeader>
        <CardTitle>Daily P&L Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow-sm p-3 pointer-events-auto"
              modifiersClassNames={{
                selected: 'bg-primary text-primary-foreground font-bold',
              }}
              components={{
                Day: ({ date: dayDate, ...rest }) => {
                  if (!dayDate) return null;
                  
                  const customClassName = dayClassName(dayDate);
                  
                  return (
                    <div
                      {...rest}
                      className={`${rest.className || ''} ${customClassName}`}
                    >
                      {format(dayDate, 'd')}
                    </div>
                  );
                },
              }}
              disabled={{ after: new Date() }}
            />
          </div>
          
          <div className="md:w-1/2">
            {date && (
              <>
                <h3 className="text-lg font-medium mb-2">
                  {format(date, 'MMMM d, yyyy')}
                </h3>
                
                {selectedDayPnL !== null ? (
                  <div className="space-y-4">
                    <div className={`text-2xl font-bold ${selectedDayPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatCurrency(selectedDayPnL)}
                    </div>
                    
                    {selectedDayTrades.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm text-muted-foreground font-medium">
                          Trades Closed This Day:
                        </h4>
                        {selectedDayTrades.map(trade => (
                          <div key={trade.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <div className="font-medium">{trade.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {trade.quantity} {trade.type === 'futures' ? 'contracts' : 'shares'}
                              </div>
                            </div>
                            <div className={`${trade.metrics.profitLoss >= 0 ? 'text-profit' : 'text-loss'} font-mono`}>
                              {formatCurrency(trade.metrics.profitLoss)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No trade details available.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No trades closed on this day.</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
