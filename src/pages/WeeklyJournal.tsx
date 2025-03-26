
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startOfWeek, endOfWeek, subWeeks, format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  getMonthlyReflections
} from '@/utils/journalStorage';
import { WeeklySummaryMetrics } from '@/components/journal/WeeklySummaryMetrics';
import { TradeCommentsList } from '@/components/journal/TradeCommentsList';
import { ReflectionsList } from '@/components/journal/ReflectionsList';
import { MonthlyReflectionsList } from '@/components/journal/MonthlyReflectionsList';

export default function WeeklyJournal() {
  const navigate = useNavigate();
  const { weekId } = useParams();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (weekId === 'new') {
      return startOfWeek(new Date(), { weekStartsOn: 0 });
    } else if (weekId) {
      // Try to load the specified week
      const reflection = getWeeklyReflection(weekId);
      if (reflection) {
        return parseISO(reflection.weekStart);
      }
    }
    // Default to current week
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
  const [activeTab, setActiveTab] = useState<string>("weekly");
  
  // If we're on the main journal page, show the list of reflections
  useEffect(() => {
    if (!weekId || weekId === 'list') {
      setShowList(true);
    } else {
      setShowList(false);
    }
  }, [weekId]);
  
  // Load trades for the selected week
  useEffect(() => {
    if (showList) return;
    
    const allTrades = getTradesWithMetrics();
    
    // Load weekly trades
    const weekStart = currentWeekStart.getTime();
    const weekEnd = currentWeekEnd.getTime();
    
    // Filter trades closed within the week
    const tradesInWeek = allTrades.filter(trade => {
      if (trade.status !== 'closed' || !trade.exitDate) return false;
      
      const exitTime = new Date(trade.exitDate).getTime();
      return exitTime >= weekStart && exitTime <= weekEnd;
    });
    
    setWeeklyTrades(tradesInWeek);
    
    // Load monthly trades
    const monthStart = currentMonthStart.getTime();
    const monthEnd = currentMonthEnd.getTime();
    
    // Filter trades closed within the month
    const tradesInMonth = allTrades.filter(trade => {
      if (trade.status !== 'closed' || !trade.exitDate) return false;
      
      const exitTime = new Date(trade.exitDate).getTime();
      return exitTime >= monthStart && exitTime <= monthEnd;
    });
    
    setMonthlyTrades(tradesInMonth);
    
    // Load existing reflection for this week
    const currentWeekId = format(currentWeekStart, 'yyyy-MM-dd');
    const savedWeeklyReflection = getWeeklyReflection(currentWeekId);
    
    if (savedWeeklyReflection) {
      setReflection(savedWeeklyReflection.reflection || '');
      setWeekGrade(savedWeeklyReflection.grade || 'B');
    } else {
      setReflection('');
      setWeekGrade('B');
    }
    
    // Load existing reflection for this month
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
  
  const previousWeek = () => {
    setCurrentWeekStart(prevDate => subWeeks(prevDate, 1));
  };
  
  const nextWeek = () => {
    const nextDate = new Date(currentWeekStart);
    nextDate.setDate(nextDate.getDate() + 7);
    
    // Don't allow going into the future
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
    
    // Don't allow going into the future
    if (nextMonth <= new Date()) {
      setCurrentMonthStart(startOfMonth(nextMonth));
    }
  };
  
  const goToCurrentMonth = () => {
    setCurrentMonthStart(startOfMonth(new Date()));
  };
  
  const handleGradeChange = (value: string) => {
    console.log('Setting week grade to:', value);
    setWeekGrade(value);
  };
  
  const handleMonthGradeChange = (value: string) => {
    console.log('Setting month grade to:', value);
    setMonthGrade(value);
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
      
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'trade-journal-reflections'
      }));
      
      // Navigate back to the list after saving
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
      
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'trade-journal-monthly-reflections'
      }));
      
      // Navigate back to the list after saving
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
        
        <Tabs defaultValue="weekly" className="w-full" onValueChange={setActiveTab}>
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
      
      <Tabs defaultValue="weekly" className="w-full" onValueChange={setActiveTab}>
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
          
          {/* Weekly metrics summary */}
          <WeeklySummaryMetrics trades={weeklyTrades} />
          
          {/* Reflection and grade */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Reflection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <Textarea
                    placeholder="Write your thoughts about your trading this week. What went well? What could be improved? Any patterns you noticed?"
                    className="min-h-[150px]"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Week Grade</label>
                  <Select 
                    value={weekGrade} 
                    onValueChange={handleGradeChange}
                    defaultValue={weekGrade}
                  >
                    <SelectTrigger>
                      <SelectValue>{weekGrade}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="C+">C+</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C-">C-</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Combined trades list with comments */}
          <TradeCommentsList trades={weeklyTrades} />
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
          
          {/* Monthly metrics summary */}
          <WeeklySummaryMetrics trades={monthlyTrades} />
          
          {/* Monthly reflection and grade */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reflection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <Textarea
                    placeholder="Write your thoughts about your trading this month. What went well? What could be improved? Any patterns you noticed?"
                    className="min-h-[150px]"
                    value={monthlyReflection}
                    onChange={(e) => setMonthlyReflection(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Month Grade</label>
                  <Select 
                    value={monthGrade} 
                    onValueChange={handleMonthGradeChange}
                    defaultValue={monthGrade}
                  >
                    <SelectTrigger>
                      <SelectValue>{monthGrade}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="C+">C+</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C-">C-</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Combined trades list with comments */}
          <TradeCommentsList trades={monthlyTrades} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
