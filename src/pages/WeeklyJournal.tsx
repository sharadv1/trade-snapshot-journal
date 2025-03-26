
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startOfWeek, endOfWeek, subWeeks, format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Save, Calendar } from 'lucide-react';
import { toast } from '@/utils/toast';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { 
  WeeklyReflection, 
  getWeeklyReflection, 
  saveWeeklyReflection,
  MonthlyReflection,
  getMonthlyReflection,
  saveMonthlyReflection,
  getMonthlyReflections,
  getWeeklyReflections
} from '@/utils/journalStorage';
import { WeeklySummaryMetrics } from '@/components/journal/WeeklySummaryMetrics';
import { TradeCommentsList } from '@/components/journal/TradeCommentsList';
import { ReflectionsList } from '@/components/journal/ReflectionsList';
import { MonthlyReflectionsList } from '@/components/journal/MonthlyReflectionsList';
import { formatCurrency } from '@/utils/calculations/formatters';

export default function WeeklyJournal() {
  const navigate = useNavigate();
  const { weekId } = useParams();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (weekId === 'new') {
      return startOfWeek(new Date(), { weekStartsOn: 0 });
    } else if (weekId) {
      const reflection = getWeeklyReflection(weekId);
      if (reflection) {
        return parseISO(reflection.weekStart);
      }
    }
    return startOfWeek(new Date(), { weekStartsOn: 0 });
  });
  
  const [currentMonthStart, setCurrentMonthStart] = useState(() => {
    return startOfMonth(currentWeekStart);
  });
  
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const currentMonthEnd = endOfMonth(currentMonthStart);
  
  const [weeklyTrades, setWeeklyTrades] = useState<TradeWithMetrics[]>([]);
  const [monthlyTrades, setMonthlyTrades] = useState<TradeWithMetrics[]>([]);
  const [reflection, setReflection] = useState<string>('');
  const [weekGrade, setWeekGrade] = useState<string>('B');
  const [monthlyReflection, setMonthlyReflection] = useState<string>('');
  const [monthGrade, setMonthGrade] = useState<string>('B');
  const [showList, setShowList] = useState<boolean>(!weekId || weekId === 'list');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = sessionStorage.getItem('journal-active-tab');
    if (savedTab) {
      sessionStorage.removeItem('journal-active-tab');
      return savedTab;
    }
    return "weekly";
  });
  
  useEffect(() => {
    if (!weekId || weekId === 'list') {
      setShowList(true);
    } else {
      setShowList(false);
    }
  }, [weekId]);
  
  useEffect(() => {
    if (showList) return;
    
    const allTrades = getTradesWithMetrics();
    
    const weekStart = currentWeekStart.getTime();
    const weekEnd = currentWeekEnd.getTime();
    
    const tradesInWeek = allTrades.filter(trade => {
      if (trade.status !== 'closed' || !trade.exitDate) return false;
      
      const exitTime = new Date(trade.exitDate).getTime();
      return exitTime >= weekStart && exitTime <= weekEnd;
    });
    
    setWeeklyTrades(tradesInWeek);
    
    const monthStart = currentMonthStart.getTime();
    const monthEnd = currentMonthEnd.getTime();
    
    const tradesInMonth = allTrades.filter(trade => {
      if (trade.status !== 'closed' || !trade.exitDate) return false;
      
      const exitTime = new Date(trade.exitDate).getTime();
      return exitTime >= monthStart && exitTime <= monthEnd;
    });
    
    setMonthlyTrades(tradesInMonth);
    
    const currentWeekId = format(currentWeekStart, 'yyyy-MM-dd');
    const savedWeeklyReflection = getWeeklyReflection(currentWeekId);
    
    if (savedWeeklyReflection) {
      setReflection(savedWeeklyReflection.reflection || '');
      setWeekGrade(savedWeeklyReflection.grade || 'B');
    } else {
      setReflection('');
      setWeekGrade('B');
    }
    
    const currentMonthId = format(currentMonthStart, 'yyyy-MM');
    const savedMonthlyReflection = getMonthlyReflection(currentMonthId);
    
    if (savedMonthlyReflection) {
      setMonthlyReflection(savedMonthlyReflection.reflection || '');
      setMonthGrade(savedMonthlyReflection.grade || 'B');
    } else {
      setMonthlyReflection('');
      setMonthGrade('B');
    }
  }, [currentWeekStart, currentWeekEnd, currentMonthStart, currentMonthEnd, showList]);
  
  const handleWeekGradeChange = (value: string) => {
    setWeekGrade(value);
  };
  
  const handleMonthGradeChange = (value: string) => {
    setMonthGrade(value);
  };
  
  const previousWeek = () => {
    setCurrentWeekStart(prevDate => subWeeks(prevDate, 1));
  };
  
  const nextWeek = () => {
    const nextDate = new Date(currentWeekStart);
    nextDate.setDate(nextDate.getDate() + 7);
    
    if (nextDate <= new Date()) {
      setCurrentWeekStart(nextDate);
    }
  };
  
  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };
  
  const previousMonth = () => {
    const prevMonth = new Date(currentMonthStart);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonthStart(startOfMonth(prevMonth));
  };
  
  const nextMonth = () => {
    const nextMonth = new Date(currentMonthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    if (nextMonth <= new Date()) {
      setCurrentMonthStart(startOfMonth(nextMonth));
    }
  };
  
  const goToCurrentMonth = () => {
    setCurrentMonthStart(startOfMonth(new Date()));
  };
  
  const saveWeeklyJournal = () => {
    setIsSaving(true);
    const weekId = format(currentWeekStart, 'yyyy-MM-dd');
    
    const reflectionData: WeeklyReflection = {
      id: weekId,
      weekStart: format(currentWeekStart, 'yyyy-MM-dd'),
      weekEnd: format(currentWeekEnd, 'yyyy-MM-dd'),
      reflection,
      grade: weekGrade,
      tradeIds: weeklyTrades.map(trade => trade.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const success = saveWeeklyReflection(reflectionData);
    if (success) {
      toast.success('Weekly reflection saved');
      
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'trade-journal-reflections'
      }));
      
      setTimeout(() => {
        navigate('/journal');
        setIsSaving(false);
      }, 1000);
    } else {
      toast.error('Failed to save reflection');
      setIsSaving(false);
    }
  };
  
  const saveMonthlyJournal = () => {
    setIsSaving(true);
    const monthId = format(currentMonthStart, 'yyyy-MM');
    
    const reflectionData: MonthlyReflection = {
      id: monthId,
      monthStart: format(currentMonthStart, 'yyyy-MM-dd'),
      monthEnd: format(currentMonthEnd, 'yyyy-MM-dd'),
      reflection: monthlyReflection,
      grade: monthGrade,
      tradeIds: monthlyTrades.map(trade => trade.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const success = saveMonthlyReflection(reflectionData);
    if (success) {
      toast.success('Monthly reflection saved');
      
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'trade-journal-monthly-reflections'
      }));
      
      setTimeout(() => {
        navigate('/journal');
        setIsSaving(false);
      }, 1000);
    } else {
      toast.error('Failed to save monthly reflection');
      setIsSaving(false);
    }
  };
  
  if (showList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
        </div>
        
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="weekly">Weekly Journal</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Journal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="mt-4">
            <ReflectionsList />
          </TabsContent>
          
          <TabsContent value="monthly" className="mt-4">
            <MonthlyReflectionsList />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
      </div>
      
      <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="weekly">Weekly Journal</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Journal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="mt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" onClick={goToCurrentWeek}>
                Current Week
              </Button>
              
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold">
                Week of {format(currentWeekStart, 'MMMM d')} - {format(currentWeekEnd, 'MMMM d, yyyy')}
              </h2>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/journal')}>
                All Reflections
              </Button>
              
              <Button onClick={saveWeeklyJournal} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Reflection'}
              </Button>
            </div>
          </div>
          
          <WeeklySummaryMetrics trades={weeklyTrades} />
          
          <Card>
            <CardHeader>
              <CardTitle>Weekly Reflection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your thoughts about your trading this week. What went well? What could be improved? Any patterns you noticed?"
                className="min-h-[150px]"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Rate your week
                  </label>
                  <Select value={weekGrade} onValueChange={handleWeekGradeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Excellent</SelectItem>
                      <SelectItem value="B">B - Good</SelectItem>
                      <SelectItem value="C">C - Average</SelectItem>
                      <SelectItem value="D">D - Poor</SelectItem>
                      <SelectItem value="F">F - Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <TradeCommentsList trades={weeklyTrades} groupByStrategy={true} />
        </TabsContent>
        
        <TabsContent value="monthly" className="mt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" onClick={goToCurrentMonth}>
                Current Month
              </Button>
              
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold">
                Month of {format(currentMonthStart, 'MMMM yyyy')}
              </h2>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/journal')}>
                All Reflections
              </Button>
              
              <Button onClick={saveMonthlyJournal} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Reflection'}
              </Button>
            </div>
          </div>
          
          <WeeklySummaryMetrics trades={monthlyTrades} />
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reflection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your thoughts about your trading this month. What went well? What could be improved? Any patterns you noticed?"
                className="min-h-[150px]"
                value={monthlyReflection}
                onChange={(e) => setMonthlyReflection(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Rate your month
                  </label>
                  <Select value={monthGrade} onValueChange={handleMonthGradeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Excellent</SelectItem>
                      <SelectItem value="B">B - Good</SelectItem>
                      <SelectItem value="C">C - Average</SelectItem>
                      <SelectItem value="D">D - Poor</SelectItem>
                      <SelectItem value="F">F - Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <TradeCommentsList
            trades={monthlyTrades}
            groupByStrategy={true}
            listTitle="Trades This Month"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WeeklyReflectionsInMonthList({ currentMonth, navigate }: { currentMonth: Date, navigate: (path: string) => void }) {
  const [weeklyReflections, setWeeklyReflections] = useState<WeeklyReflection[]>([]);
  const [reflectionStats, setReflectionStats] = useState<Record<string, {
    totalPnL: number,
    totalR: number
  }>>({});
  
  useEffect(() => {
    const allReflections = getWeeklyReflections();
    const allTrades = getTradesWithMetrics();
    const monthStart = startOfMonth(currentMonth).getTime();
    const monthEnd = endOfMonth(currentMonth).getTime();
    
    const reflectionsInMonth = allReflections.filter(reflection => {
      const reflectionStart = new Date(reflection.weekStart).getTime();
      return reflectionStart >= monthStart && reflectionStart <= monthEnd;
    });
    
    reflectionsInMonth.sort((a, b) => 
      new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    );
    
    const stats: Record<string, { totalPnL: number, totalR: number }> = {};
    
    reflectionsInMonth.forEach(reflection => {
      const weekTrades = allTrades.filter(trade => 
        reflection.tradeIds.includes(trade.id)
      );
      
      const totalPnL = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.profitLoss || 0), 0);
      
      const totalR = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.riskRewardRatio || 0), 0);
      
      stats[reflection.id] = { totalPnL, totalR };
    });
    
    setReflectionStats(stats);
    setWeeklyReflections(reflectionsInMonth);
  }, [currentMonth]);
  
  if (weeklyReflections.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No weekly reflections found for this month.</p>
      </div>
    );
  }
  
  const handleCardClick = (reflectionId: string) => {
    console.log("Navigating to weekly journal:", `/journal/${reflectionId}`);
    navigate(`/journal/${reflectionId}`);
  };
  
  return (
    <div className="space-y-4">
      {weeklyReflections.map(reflection => {
        const stats = reflectionStats[reflection.id] || { totalPnL: 0, totalR: 0 };
        return (
          <Card 
            key={reflection.id} 
            className="cursor-pointer hover:bg-accent/10 transition-colors" 
            onClick={() => handleCardClick(reflection.id)}
          >
            <CardContent className="pt-4 pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">
                    {format(parseISO(reflection.weekStart), 'MMM d')} - {format(parseISO(reflection.weekEnd), 'MMM d, yyyy')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{reflection.tradeIds.length} trades</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={stats.totalPnL >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {formatCurrency(stats.totalPnL)}
                  </span>
                  <span className={stats.totalR >= 0 ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                    {stats.totalR > 0 ? '+' : ''}{stats.totalR.toFixed(1)}R
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
