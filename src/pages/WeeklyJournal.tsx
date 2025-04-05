import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  subMonths
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
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { Label } from '@/components/ui/label';

export default function WeeklyJournal() {
  const { weekId: paramWeekId, monthId: paramMonthId } = useParams<{ weekId: string; monthId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);
  
  const isMonthView = location.pathname.includes('/journal/monthly/');
  
  const [currentDate, setCurrentDate] = useState(() => {
    if (isMonthView && paramMonthId) {
      try {
        if (paramMonthId.match(/^\d{4}-\d{2}$/)) {
          const year = parseInt(paramMonthId.split('-')[0], 10);
          const month = parseInt(paramMonthId.split('-')[1], 10) - 1;
          return new Date(year, month, 1);
        }
        return new Date(paramMonthId);
      } catch (e) {
        console.error("Failed to parse monthId", paramMonthId, e);
        return new Date();
      }
    }
    return paramWeekId ? new Date(paramWeekId) : new Date();
  });
  
  const [weekId, setWeekId] = useState(() => {
    if (paramWeekId) {
      return paramWeekId;
    }
    return format(currentDate, 'yyyy-MM-dd');
  });
  
  const [monthId, setMonthId] = useState(() => {
    if (isMonthView && paramMonthId) {
      if (paramMonthId.match(/^\d{4}-\d{2}$/)) {
        return paramMonthId;
      }
      return format(new Date(paramMonthId), 'yyyy-MM');
    }
    return format(currentDate, 'yyyy-MM');
  });
  
  const [reflection, setReflection] = useState<string>('');
  const [weeklyPlan, setWeeklyPlan] = useState<string>('');
  const [monthlyReflection, setMonthlyReflection] = useState<string>('');
  const [weekGrade, setWeekGrade] = useState<string>('');
  const [monthGrade, setMonthGrade] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);
  const [periodTrades, setPeriodTrades] = useState<TradeWithMetrics[]>([]);
  const [allWeeklyReflections, setAllWeeklyReflections] = useState<Record<string, any>>({});
  const [allMonthlyReflections, setAllMonthlyReflections] = useState<Record<string, any>>({});

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);

  const formattedWeekRange = `${format(currentWeekStart, 'MMM dd')} - ${format(currentWeekEnd, 'MMM dd, yyyy')}`;
  const formattedMonth = format(currentMonthStart, 'MMMM yyyy');
  
  useEffect(() => {
    const loadAllReflections = () => {
      const weeklyReflections = getAllWeeklyReflections();
      const monthlyReflections = getAllMonthlyReflections();
      
      setAllWeeklyReflections(weeklyReflections);
      setAllMonthlyReflections(monthlyReflections);
    };
    
    loadAllReflections();
    
    const handleJournalUpdated = () => {
      loadAllReflections();
    };
    
    window.addEventListener('journal-updated', handleJournalUpdated);
    
    return () => {
      window.removeEventListener('journal-updated', handleJournalUpdated);
    };
  }, [isMonthView]);
  
  useEffect(() => {
    const loadPeriodTrades = () => {
      const allTrades = getTradesWithMetrics();
      let filteredTrades: TradeWithMetrics[] = [];
      
      if (isMonthView) {
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
    
    const handleTradeUpdated = () => {
      loadPeriodTrades();
    };
    
    window.addEventListener('trades-updated', handleTradeUpdated);
    
    return () => {
      window.removeEventListener('trades-updated', handleTradeUpdated);
    };
  }, [isMonthView, currentWeekStart, currentWeekEnd, currentMonthStart, currentMonthEnd]);
  
  const currentEntryExists = isMonthView 
    ? !!allMonthlyReflections[monthId]
    : !!allWeeklyReflections[weekId];
  
  const goBackToList = () => {
    navigate(isMonthView ? '/journal/monthly' : '/journal/weekly');
  };

  const goToPreviousPeriod = () => {
    if (hasChanged) {
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

  useEffect(() => {
    setIsLoading(true);
    if (!isMonthView && weekId) {
      console.log('Loading weekly reflection for ID:', weekId);
      const savedReflection = getWeeklyReflection(weekId);
      if (savedReflection) {
        console.log('Loaded weekly reflection for', weekId, savedReflection);
        setReflection(savedReflection.reflection || '');
        setWeeklyPlan(savedReflection.weeklyPlan || '');
        setWeekGrade(savedReflection.grade || '');
      } else {
        console.log('No existing weekly reflection found for', weekId);
        setReflection('');
        setWeeklyPlan('');
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
  
  const handleWeeklyPlanChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('Weekly plan changed:', newValue);
    setWeeklyPlan(newValue);
    setHasChanged(true);
  };
  
  const handleMonthlyReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('Monthly reflection changed:', newValue);
    setMonthlyReflection(newValue);
    setHasChanged(true);
  };
  
  const handleWeekGradeChange = (value: string) => {
    setWeekGrade(value);
    setHasChanged(true);
  };
  
  const handleMonthGradeChange = (value: string) => {
    setMonthGrade(value);
    setHasChanged(true);
  };
  
  const saveReflections = useCallback(() => {
    if (isLoading || !hasChanged) return false;
    
    if (!isMonthView && weekId) {
      console.log(`Saving weekly reflection for ${weekId}:`, reflection, weekGrade, weeklyPlan);
      saveWeeklyReflection(weekId, reflection || '', weekGrade, weeklyPlan || '');
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
  }, [weekId, reflection, weekGrade, weeklyPlan, monthId, monthlyReflection, monthGrade, isMonthView, isLoading, hasChanged]);
  
  const handleSaveWeekly = () => {
    if (!isLoading && weekId) {
      console.log(`Explicitly saving weekly reflection for ${weekId}:`, reflection, weekGrade, weeklyPlan);
      saveWeeklyReflection(weekId, reflection || '', weekGrade, weeklyPlan || '');
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
  
  useEffect(() => {
    return () => {
      console.log("Component unmounting, saving reflections if needed");
      if (hasChanged) {
        saveReflections();
      }
    };
  }, [saveReflections, hasChanged]);

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading...</p>
      </div>
    );
  }

  const gradeOptions = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'F', label: 'F' }
  ];

  const handleRichReflectionChange = (content: string) => {
    console.log('Weekly reflection changed:', content);
    setReflection(content);
    setHasChanged(true);
  };
  
  const handleRichWeeklyPlanChange = (content: string) => {
    console.log('Weekly plan changed:', content);
    setWeeklyPlan(content);
    setHasChanged(true);
  };
  
  const handleRichMonthlyReflectionChange = (content: string) => {
    console.log('Monthly reflection changed:', content);
    setMonthlyReflection(content);
    setHasChanged(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex justify-between items-center">
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

      <div className="mb-8">
        <WeeklySummaryMetrics trades={periodTrades} />
      </div>

      {!isMonthView && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Weekly Reflection - {formattedWeekRange}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weekly-plan">Weekly Plan</Label>
              <RichTextEditor 
                id="weekly-plan"
                content={weeklyPlan}
                onChange={handleRichWeeklyPlanChange}
                placeholder="Write your plan for the week. Use markdown: **bold**, # Heading, - bullet points, > for quotes, --- for dividers"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reflection">Reflection</Label>
              <RichTextEditor
                id="reflection"
                content={reflection}
                onChange={handleRichReflectionChange}
                placeholder="Write your weekly reflection here. Use markdown: **bold**, # Heading, - bullet points, > for quotes, --- for dividers"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="week-grade">Week Grade</Label>
              <Select
                value={weekGrade}
                onValueChange={handleWeekGradeChange}
              >
                <SelectTrigger id="week-grade" className="w-[100px]">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <RichTextEditor
                id="monthly-reflection"
                content={monthlyReflection}
                onChange={handleRichMonthlyReflectionChange}
                placeholder="Write your monthly reflection here. Use markdown: **bold**, # Heading, - bullet points, > for quotes, --- for dividers"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="month-grade">Month Grade</Label>
              <Select
                value={monthGrade}
                onValueChange={handleMonthGradeChange}
              >
                <SelectTrigger id="month-grade" className="w-[100px]">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableCell className={(trade.metrics.riskRewardRatio || 0) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {(trade.metrics.riskRewardRatio || 0) > 0 ? '+' : ''}
                      {(trade.metrics.riskRewardRatio || 0).toFixed(2)}R
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
