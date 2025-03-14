import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays, Filter, Trophy, X as XIcon } from 'lucide-react';
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
import { Button } from './ui/button';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { formatCurrency } from '@/utils/tradeCalculations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type DailyPnL = {
  [key: string]: {
    pnl: number;
    tradeCount: number;
    tradeIds: string[];
  };
};

export function TradePnLCalendar() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  
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

  const filteredTrades = useMemo(() => {
    let result = [...trades];
    
    // Filter by strategy
    if (strategyFilter !== 'all') {
      result = result.filter(trade => trade.strategy === strategyFilter);
    }
    
    // Filter by win/loss
    if (resultFilter !== 'all') {
      result = result.filter(trade => {
        if (resultFilter === 'win') {
          return trade.metrics.profitLoss >= 0;
        } else {
          return trade.metrics.profitLoss < 0;
        }
      });
    }
    
    return result;
  }, [trades, strategyFilter, resultFilter]);

  const dailyPnL = useMemo(() => {
    const pnlByDay: DailyPnL = {};
    
    filteredTrades.forEach(trade => {
      if (trade.exitDate && trade.metrics.profitLoss !== undefined) {
        // Format date as YYYY-MM-DD for consistent keys
        const exitDay = format(new Date(trade.exitDate), 'yyyy-MM-dd');
        
        if (!pnlByDay[exitDay]) {
          pnlByDay[exitDay] = { pnl: 0, tradeCount: 0, tradeIds: [] };
        }
        
        pnlByDay[exitDay].pnl += trade.metrics.profitLoss;
        pnlByDay[exitDay].tradeCount += 1;
        pnlByDay[exitDay].tradeIds.push(trade.id);
      }
    });
    
    return pnlByDay;
  }, [filteredTrades]);

  const availableStrategies = useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach(trade => {
      if (trade.strategy) {
        strategies.add(trade.strategy);
      }
    });
    return Array.from(strategies).sort();
  }, [trades]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

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

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getCellClass = (day: Date | null) => {
    if (!day) return '';
    
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayData = dailyPnL[dateKey];
    
    if (!dayData) return 'bg-background';
    
    return dayData.pnl >= 0 
      ? 'bg-profit/20' 
      : 'bg-loss/20';
  };

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayData = dailyPnL[dateKey];
    
    if (dayData && dayData.tradeIds.length > 0) {
      if (dayData.tradeIds.length === 1) {
        navigate(`/trade/${dayData.tradeIds[0]}`);
      } else {
        const date = format(day, 'yyyy-MM-dd');
        navigate(`/?date=${date}`);
      }
    }
  };

  return (
    <Card className="shadow-subtle border">
      <CardHeader className="flex-row justify-between items-center pb-2">
        <div className="flex gap-2 items-center">
          <CardTitle className="text-xl">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="h-4 w-4 mr-1" />
            Today
          </Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Strategy</h4>
                  <Select 
                    value={strategyFilter} 
                    onValueChange={setStrategyFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Strategies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Strategies</SelectItem>
                      {availableStrategies.map((strategy) => (
                        <SelectItem key={strategy} value={strategy}>
                          {strategy}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Result</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant={resultFilter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setResultFilter('all')}
                    >
                      All
                    </Button>
                    <Button 
                      variant={resultFilter === 'win' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setResultFilter('win')}
                      className="text-profit"
                    >
                      <Trophy className="h-4 w-4 mr-1" />
                      Wins
                    </Button>
                    <Button 
                      variant={resultFilter === 'loss' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setResultFilter('loss')}
                      className="text-loss"
                    >
                      <XIcon className="h-4 w-4 mr-1" />
                      Losses
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center p-2 font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
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
                className={`border rounded-md p-2 h-24 flex flex-col ${getCellClass(day)} ${dayData ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => dayData && handleDayClick(day)}
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
