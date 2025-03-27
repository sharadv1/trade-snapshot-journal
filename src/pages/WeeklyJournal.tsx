
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  saveWeeklyReflection, 
  getWeeklyReflection, 
  saveMonthlyReflection, 
  getMonthlyReflection 
} from '@/utils/journalStorage';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isSameDay 
} from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, ArrowLeft, Save } from 'lucide-react';
import { WeeklyReflection, MonthlyReflection } from '@/types';

export default function WeeklyJournal() {
  const { weekId: paramWeekId, monthId: paramMonthId } = useParams<{ weekId: string; monthId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if we're viewing monthly or weekly reflection
  const isMonthView = location.pathname.includes('/journal/monthly/');
  
  // State variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekId, setWeekId] = useState(paramWeekId || format(currentDate, 'yyyy-MM-dd'));
  const [monthId, setMonthId] = useState(paramMonthId || format(currentDate, 'yyyy-MM'));
  const [reflection, setReflection] = useState<string>('');
  const [monthlyReflection, setMonthlyReflection] = useState<string>('');
  const [weekGrade, setWeekGrade] = useState<string>('');
  const [monthGrade, setMonthGrade] = useState<string>('');

  // Date manipulations
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);

  const formattedWeekRange = `${format(currentWeekStart, 'MMM dd')} - ${format(currentWeekEnd, 'MMM dd, yyyy')}`;
  const formattedMonth = format(currentMonthStart, 'MMMM yyyy');

  // Navigation functions
  const goToPreviousWeek = () => {
    const prevWeekDate = new Date(currentDate);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    setCurrentDate(prevWeekDate);
    const newWeekId = format(prevWeekDate, 'yyyy-MM-dd');
    setWeekId(newWeekId);
    navigate(`/journal/${newWeekId}`);
  };

  const goToNextWeek = () => {
    const nextWeekDate = new Date(currentDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    setCurrentDate(nextWeekDate);
    const newWeekId = format(nextWeekDate, 'yyyy-MM-dd');
    setWeekId(newWeekId);
    navigate(`/journal/${newWeekId}`);
  };

  const goToPreviousMonth = () => {
    const prevMonthDate = new Date(currentDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    setCurrentDate(prevMonthDate);
    const newMonthId = format(prevMonthDate, 'yyyy-MM');
    setMonthId(newMonthId);
  };

  const goToNextMonth = () => {
    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setCurrentDate(nextMonthDate);
    const newMonthId = format(nextMonthDate, 'yyyy-MM');
    setMonthId(newMonthId);
  };
  
  const goBackToList = () => {
    navigate(isMonthView ? '/journal/monthly' : '/journal/weekly');
  };

  // Load data
  useEffect(() => {
    if (weekId) {
      const savedReflection = getWeeklyReflection(weekId);
      if (savedReflection) {
        setReflection(savedReflection.reflection || '');
        setWeekGrade(savedReflection.grade || '');
      } else {
        setReflection('');
        setWeekGrade('');
      }
    }
  }, [weekId]);
  
  useEffect(() => {
    if (monthId) {
      const savedReflection = getMonthlyReflection(monthId);
      if (savedReflection) {
        setMonthlyReflection(savedReflection.reflection || '');
        setMonthGrade(savedReflection.grade || '');
      } else {
        setMonthlyReflection('');
        setMonthGrade('');
      }
    }
  }, [monthId]);

  const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('Reflection changed to:', newValue);
    setReflection(newValue);
  };
  
  const handleMonthlyReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('Monthly reflection changed to:', newValue);
    setMonthlyReflection(newValue);
  };
  
  const handleWeekGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Week grade changed to:', newValue);
    setWeekGrade(newValue);
  };
  
  const handleMonthGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Month grade changed to:', newValue);
    setMonthGrade(newValue);
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      const newWeekId = format(date, 'yyyy-MM-dd');
      setWeekId(newWeekId);
      navigate(`/journal/${newWeekId}`);
    }
  };

  const saveReflections = useCallback(() => {
    console.log('Saving reflections manually');
    if (weekId && reflection !== undefined) {
      console.log(`Saving weekly reflection for ${weekId}:`, reflection);
      saveWeeklyReflection(weekId, reflection || '', weekGrade);
    }
    
    if (monthId && monthlyReflection !== undefined) {
      console.log(`Saving monthly reflection for ${monthId}:`, monthlyReflection);
      saveMonthlyReflection(monthId, monthlyReflection || '', monthGrade);
    }
  }, [weekId, reflection, weekGrade, monthId, monthlyReflection, monthGrade]);
  
  // Add a function to explicitly save the reflection
  const handleSaveWeekly = () => {
    if (weekId && reflection !== undefined) {
      console.log(`Saving weekly reflection for ${weekId}:`, reflection);
      saveWeeklyReflection(weekId, reflection || '', weekGrade);
    }
  };
  
  const handleSaveMonthly = () => {
    if (monthId && monthlyReflection !== undefined) {
      console.log(`Saving monthly reflection for ${monthId}:`, monthlyReflection);
      saveMonthlyReflection(monthId, monthlyReflection || '', monthGrade);
    }
  };
  
  // Add an effect to save on component unmount
  useEffect(() => {
    return () => {
      saveReflections();
    };
  }, [saveReflections]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goBackToList}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </Button>
          <h1 className="text-2xl font-bold">
            {isMonthView ? "Monthly Journal" : "Weekly Journal"}
          </h1>
          <p className="text-muted-foreground">
            {isMonthView 
              ? "Reflect on your trading month." 
              : "Reflect on your trading week."}
          </p>
        </div>
      </div>

      {/* Show only weekly or monthly form based on view */}
      {!isMonthView && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Weekly Reflection - {formattedWeekRange}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                ←
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"ghost"}
                    className={cn(
                      "w-[220px] justify-start text-left font-normal",
                      !currentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentDate ? format(currentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date > new Date() || isSameDay(date, new Date("2020-10-01"))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reflection">Reflection</Label>
              <Textarea
                id="reflection"
                name="reflection"
                placeholder="Write your weekly reflection here."
                value={reflection}
                onChange={handleReflectionChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="week-grade">Week Grade</Label>
              <Input
                type="text"
                id="week-grade"
                name="week-grade"
                placeholder="Enter your grade for the week (e.g., A, B, C)"
                value={weekGrade}
                onChange={handleWeekGradeChange}
              />
            </div>
            <Button 
              onClick={handleSaveWeekly} 
              className="mt-2 w-full max-w-[200px] mx-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Weekly Reflection
            </Button>
          </CardContent>
        </Card>
      )}

      {isMonthView && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monthly Reflection - {formattedMonth}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                ←
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="monthly-reflection">Reflection</Label>
              <Textarea
                id="monthly-reflection"
                name="monthly-reflection"
                placeholder="Write your monthly reflection here."
                value={monthlyReflection}
                onChange={handleMonthlyReflectionChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="month-grade">Month Grade</Label>
              <Input
                type="text"
                id="month-grade"
                name="month-grade"
                placeholder="Enter your grade for the month (e.g., A, B, C)"
                value={monthGrade}
                onChange={handleMonthGradeChange}
              />
            </div>
            <Button 
              onClick={handleSaveMonthly} 
              className="mt-2 w-full max-w-[200px] mx-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Monthly Reflection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
