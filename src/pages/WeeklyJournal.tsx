import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  parse,
  parseISO
} from 'date-fns';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function WeeklyJournal() {
  const { weekId: paramWeekId, monthId: paramMonthId } = useParams<{ weekId: string; monthId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);
  
  // Determine if we're viewing monthly or weekly reflection
  const isMonthView = location.pathname.includes('/journal/monthly/');
  
  // State variables
  const [currentDate, setCurrentDate] = useState(() => {
    // If we have a monthId, use it to create a date in that month
    if (isMonthView && paramMonthId) {
      try {
        // First try to parse it as YYYY-MM format for months
        if (paramMonthId.match(/^\d{4}-\d{2}$/)) {
          const year = parseInt(paramMonthId.split('-')[0], 10);
          const month = parseInt(paramMonthId.split('-')[1], 10) - 1; // JS months are 0-indexed
          return new Date(year, month, 1);
        }
        // If that didn't work, try to parse it as a date string
        return new Date(paramMonthId);
      } catch (e) {
        console.error("Failed to parse monthId", paramMonthId, e);
        return new Date();
      }
    }
    // Otherwise use weekId or current date
    return paramWeekId ? new Date(paramWeekId) : new Date();
  });
  
  const [weekId, setWeekId] = useState(() => {
    // Ensure we're using the received weekId or current date
    return paramWeekId || format(currentDate, 'yyyy-MM-dd');
  });
  
  const [monthId, setMonthId] = useState(() => {
    if (isMonthView && paramMonthId) {
      // For month view, always preserve the exact format from the URL
      // This ensures we don't change the ID format when editing
      if (paramMonthId.match(/^\d{4}-\d{2}$/)) {
        return paramMonthId;
      }
      // If not in YYYY-MM format, format it properly
      return format(new Date(paramMonthId), 'yyyy-MM');
    }
    return format(currentDate, 'yyyy-MM');
  });
  
  const [reflection, setReflection] = useState<string>('');
  const [monthlyReflection, setMonthlyReflection] = useState<string>('');
  const [weekGrade, setWeekGrade] = useState<string>('');
  const [monthGrade, setMonthGrade] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);

  // Date calculations
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);

  const formattedWeekRange = `${format(currentWeekStart, 'MMM dd')} - ${format(currentWeekEnd, 'MMM dd, yyyy')}`;
  const formattedMonth = format(currentMonthStart, 'MMMM yyyy');
  
  const goBackToList = () => {
    navigate(isMonthView ? '/journal/monthly' : '/journal/weekly');
  };

  // Load data whenever weekId, monthId, or isMonthView changes
  useEffect(() => {
    setIsLoading(true);
    if (!isMonthView && weekId) {
      console.log('Loading weekly reflection for ID:', weekId);
      const savedReflection = getWeeklyReflection(weekId);
      if (savedReflection) {
        console.log('Loaded weekly reflection for', weekId, savedReflection);
        setReflection(savedReflection.reflection || '');
        setWeekGrade(savedReflection.grade || '');
      } else {
        console.log('No existing weekly reflection found for', weekId);
        setReflection('');
        setWeekGrade('');
      }
    }
    setIsLoading(false);
    setHasChanged(false);
  }, [weekId, isMonthView]);
  
  useEffect(() => {
    setIsLoading(true);
    if (isMonthView && monthId) {
      console.log('Loading monthly reflection for ID:', monthId);
      const savedReflection = getMonthlyReflection(monthId);
      if (savedReflection) {
        console.log('Loaded monthly reflection for', monthId, savedReflection);
        setMonthlyReflection(savedReflection.reflection || '');
        setMonthGrade(savedReflection.grade || '');
      } else {
        console.log('No existing monthly reflection found for', monthId);
        setMonthlyReflection('');
        setMonthGrade('');
      }
    }
    setIsLoading(false);
    setHasChanged(false);
  }, [monthId, isMonthView]);

  const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('Weekly reflection changed:', newValue);
    setReflection(newValue);
    setHasChanged(true);
  };
  
  const handleMonthlyReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('Monthly reflection changed:', newValue);
    setMonthlyReflection(newValue);
    setHasChanged(true);
  };
  
  const handleWeekGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setWeekGrade(newValue);
    setHasChanged(true);
  };
  
  const handleMonthGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMonthGrade(newValue);
    setHasChanged(true);
  };
  
  // Define a function to save reflections
  const saveReflections = useCallback(() => {
    if (isLoading || !hasChanged) return false;
    
    if (!isMonthView && weekId) {
      console.log(`Saving weekly reflection for ${weekId}:`, reflection, weekGrade);
      saveWeeklyReflection(weekId, reflection || '', weekGrade);
      setHasChanged(false);
      return true;
    }
    
    if (isMonthView && monthId) {
      console.log(`Saving monthly reflection for ${monthId}:`, monthlyReflection, monthGrade);
      saveMonthlyReflection(monthId, monthlyReflection || '', monthGrade);
      setHasChanged(false);
      return true;
    }
    
    return false;
  }, [weekId, reflection, weekGrade, monthId, monthlyReflection, monthGrade, isMonthView, isLoading, hasChanged]);
  
  // Add a function to explicitly save the reflection and return to list
  const handleSaveWeekly = () => {
    if (!isLoading && weekId) {
      console.log(`Explicitly saving weekly reflection for ${weekId}:`, reflection, weekGrade);
      saveWeeklyReflection(weekId, reflection || '', weekGrade);
      toast.success("Weekly reflection saved successfully");
      navigate('/journal/weekly');
    }
  };
  
  const handleSaveMonthly = () => {
    if (!isLoading && monthId) {
      console.log(`Explicitly saving monthly reflection for ${monthId}:`, monthlyReflection, monthGrade);
      saveMonthlyReflection(monthId, monthlyReflection || '', monthGrade);
      toast.success("Monthly reflection saved successfully");
      navigate('/journal/monthly');
    }
  };
  
  // Save when user navigates away or component unmounts
  useEffect(() => {
    return () => {
      console.log("Component unmounting, saving reflections if needed");
      if (hasChanged) {
        saveReflections();
      }
    };
  }, [saveReflections, hasChanged]);

  // Auto-save changes periodically (every 5 seconds), but only if content has changed
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const autoSaveInterval = setInterval(() => {
      if (hasChanged) {
        saveReflections();
      }
    }, 5000);
    
    return () => clearInterval(autoSaveInterval);
  }, [saveReflections, hasChanged]);

  // Don't render until loading is complete to avoid flickering
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading...</p>
      </div>
    );
  }

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
                rows={6}
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
            <div className="flex justify-center mt-4">
              <Button 
                onClick={handleSaveWeekly} 
                className="w-full max-w-[200px]"
              >
                <Save className="mr-2 h-4 w-4" />
                Save & Return to List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isMonthView && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monthly Reflection - {formattedMonth}</CardTitle>
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
                rows={6}
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
            <div className="flex justify-center mt-4">
              <Button 
                onClick={handleSaveMonthly} 
                className="w-full max-w-[200px]"
              >
                <Save className="mr-2 h-4 w-4" />
                Save & Return to List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
