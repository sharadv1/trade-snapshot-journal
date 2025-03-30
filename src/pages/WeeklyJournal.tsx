
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
  getMonthlyReflection,
  getAllWeeklyReflections,
  getAllMonthlyReflections
} from '@/utils/journalStorage';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parse,
  parseISO
} from 'date-fns';
import { ArrowLeft, ArrowRight, Save, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeWithMetrics } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/calculations/formatters';
import { WeeklySummaryMetrics } from '@/components/journal/WeeklySummaryMetrics';

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
  const [periodTrades, setPeriodTrades] = useState<TradeWithMetrics[]>([]);
  const [allWeeklyReflections, setAllWeeklyReflections] = useState<Record<string, any>>({});
  const [allMonthlyReflections, setAllMonthlyReflections] = useState<Record<string, any>>({});

  // Date calculations
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);

  const formattedWeekRange = `${format(currentWeekStart, 'MMM dd')} - ${format(currentWeekEnd, 'MMM dd, yyyy')}`;
  const formattedMonth = format(currentMonthStart, 'MMMM yyyy');
  
  // Load all reflections to check existence
  useEffect(() => {
    const loadAllReflections = () => {
      setAllWeeklyReflections(getAllWeeklyReflections());
      setAllMonthlyReflections(getAllMonthlyReflections());
    };
    
    loadAllReflections();
    
    // Listen for journal updates
    const handleJournalUpdated = () => {
      loadAllReflections();
    };
    
    window.addEventListener('journal-updated', handleJournalUpdated);
    
    return () => {
      window.removeEventListener('journal-updated', handleJournalUpdated);
    };
  }, []);
  
  // Load trades for the current period (week or month)
  useEffect(() => {
    const loadPeriodTrades = () => {
      const allTrades = getTradesWithMetrics();
      let filteredTrades: TradeWithMetrics[] = [];
      
      if (isMonthView) {
        // Get trades for the current month
        const startDate = currentMonthStart;
        const endDate = currentMonthEnd;
        
        filteredTrades = allTrades.filter(trade => {
          if (trade.exitDate) {
            const exitDate = new Date(trade.exitDate);
            return exitDate >= startDate && exitDate <= endDate;
          }
          return false;
        });
      } else {
        // Get trades for the current week
        const startDate = currentWeekStart;
        const endDate = currentWeekEnd;
        
        filteredTrades = allTrades.filter(trade => {
          if (trade.exitDate) {
            const exitDate = new Date(trade.exitDate);
            return exitDate >= startDate && exitDate <= endDate;
          }
          return false;
        });
      }
      
      setPeriodTrades(filteredTrades);
      console.log(`Loaded ${filteredTrades.length} trades for ${isMonthView ? 'month' : 'week'}`);
    };
    
    loadPeriodTrades();
    
    // Listen for trade updates
    const handleTradeUpdated = () => {
      loadPeriodTrades();
    };
    
    window.addEventListener('trades-updated', handleTradeUpdated);
    
    return () => {
      window.removeEventListener('trades-updated', handleTradeUpdated);
    };
  }, [isMonthView, currentWeekStart, currentWeekEnd, currentMonthStart, currentMonthEnd]);
  
  // Check if entry exists
  const currentEntryExists = isMonthView 
    ? !!allMonthlyReflections[monthId]
    : !!allWeeklyReflections[weekId];
  
  const goBackToList = () => {
    navigate(isMonthView ? '/journal/monthly' : '/journal/weekly');
  };

  // Navigation functions
  const goToPreviousPeriod = () => {
    if (hasChanged) {
      // Save current changes before navigating
      saveReflections();
    }
    
    if (isMonthView) {
      const newDate = subMonths(currentDate, 1);
      const newMonthId = format(newDate, 'yyyy-MM');
      setCurrentDate(newDate);
      setMonthId(newMonthId);
      navigate(`/journal/monthly/${newMonthId}`);
    } else {
      const newDate = subWeeks(currentDate, 1);
      const newWeekId = format(newDate, 'yyyy-MM-dd');
      setCurrentDate(newDate);
      setWeekId(newWeekId);
      navigate(`/journal/weekly/${newWeekId}`);
    }
  };
  
  const goToNextPeriod = () => {
    if (hasChanged) {
      // Save current changes before navigating
      saveReflections();
    }
    
    if (isMonthView) {
      const newDate = addMonths(currentDate, 1);
      const newMonthId = format(newDate, 'yyyy-MM');
      setCurrentDate(newDate);
      setMonthId(newMonthId);
      navigate(`/journal/monthly/${newMonthId}`);
    } else {
      const newDate = addWeeks(currentDate, 1);
      const newWeekId = format(newDate, 'yyyy-MM-dd');
      setCurrentDate(newDate);
      setWeekId(newWeekId);
      navigate(`/journal/weekly/${newWeekId}`);
    }
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPeriod}
            title={isMonthView ? "Previous Month" : "Previous Week"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {isMonthView ? formattedMonth : formattedWeekRange}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPeriod}
            title={isMonthView ? "Next Month" : "Next Week"}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add summary metrics at the top */}
      <div className="mb-8">
        <WeeklySummaryMetrics trades={periodTrades} />
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
        <Card className="mb-8">
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

      {/* Add trades list for the current period */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isMonthView 
              ? `Trades in ${formattedMonth}` 
              : `Trades for ${formattedWeekRange}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodTrades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Entry Date</TableHead>
                  <TableHead>Exit Date</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>R Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>{trade.direction}</TableCell>
                    <TableCell>{format(new Date(trade.entryDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {trade.exitDate ? format(new Date(trade.exitDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className={trade.metrics.profitLoss >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {formatCurrency(trade.metrics.profitLoss || 0)}
                    </TableCell>
                    <TableCell className={trade.metrics.riskRewardRatio >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {trade.metrics.riskRewardRatio > 0 ? '+' : ''}
                      {trade.metrics.riskRewardRatio.toFixed(2)}R
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No trades found for this {isMonthView ? 'month' : 'week'}.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
