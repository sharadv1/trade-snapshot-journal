
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { addMonths, subMonths, format } from 'date-fns';
import { useTradePnLCalendar } from './trade-calendar/useTradePnLCalendar';
import { CalendarGrid } from './trade-calendar/CalendarGrid';
import { CalendarHeader } from './trade-calendar/CalendarHeader';

export function TradePnLCalendar() {
  const navigate = useNavigate();
  const {
    currentMonth,
    setCurrentMonth,
    strategyFilter,
    setStrategyFilter,
    resultFilter,
    setResultFilter,
    dailyPnL,
    availableStrategies,
    loadTrades,
    recordNavigatedDate
  } = useTradePnLCalendar();

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayData = dailyPnL[dateKey];
    
    // Record the navigation for state persistence
    recordNavigatedDate(day);
    
    if (dayData && dayData.tradeIds.length > 0) {
      if (dayData.tradeIds.length === 1) {
        navigate(`/trade/${dayData.tradeIds[0]}`);
      } else {
        navigate(`/?date=${dateKey}`);
      }
    }
  };

  return (
    <Card className="shadow-subtle border rounded-lg">
      <CardHeader className="flex flex-col space-y-1.5 p-6 pb-2">
        <CalendarHeader 
          currentMonth={currentMonth}
          availableStrategies={availableStrategies}
          strategyFilter={strategyFilter}
          setStrategyFilter={setStrategyFilter}
          resultFilter={resultFilter}
          setResultFilter={setResultFilter}
          onNextMonth={nextMonth}
          onPrevMonth={prevMonth}
          onToday={goToToday}
          onRefresh={loadTrades}
        />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <CalendarGrid 
          currentMonth={currentMonth}
          dailyPnL={dailyPnL}
          onDayClick={handleDayClick}
        />
      </CardContent>
    </Card>
  );
}
