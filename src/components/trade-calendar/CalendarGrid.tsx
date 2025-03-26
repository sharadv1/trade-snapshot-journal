
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { DayCell } from './DayCell';
import { DailyPnL } from './types';

interface CalendarGridProps {
  currentMonth: Date;
  dailyPnL: DailyPnL;
  onDayClick: (day: Date) => void;
}

export function CalendarGrid({ currentMonth, dailyPnL, onDayClick }: CalendarGridProps) {
  const calendarDays = useMemo(() => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    
    const firstDayOfMonth = startOfMonth(currentMonth);
    const firstDayOfWeek = getDay(firstDayOfMonth);
    
    const days = [...daysInMonth];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.unshift(null);
    }
    
    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    // Pad the last week with empty cells
    const lastWeek = weeks[weeks.length - 1];
    if (lastWeek.length < 7) {
      for (let i = lastWeek.length; i < 7; i++) {
        lastWeek.push(null);
      }
    }
    
    return weeks;
  }, [currentMonth]);

  const handleDayClick = (day: Date) => {
    console.log("CalendarGrid: Day clicked", day);
    onDayClick(day);
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center p-2 font-medium text-muted-foreground">
          {day}
        </div>
      ))}
      
      {calendarDays.flat().map((day, i) => {
        if (!day) {
          return <DayCell key={`empty-${i}`} day={null} onDayClick={handleDayClick} />;
        }
        
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayData = dailyPnL[dateKey];
        
        return (
          <DayCell 
            key={dateKey} 
            day={day} 
            dayData={dayData}
            onDayClick={handleDayClick}
          />
        );
      })}
    </div>
  );
}
