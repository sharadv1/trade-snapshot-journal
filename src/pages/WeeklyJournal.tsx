
import { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
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
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { TradeList } from '@/components/trade-list/TradeList';
import { toast } from '@/utils/toast';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { WeeklyReflection, getWeeklyReflection, saveWeeklyReflection } from '@/utils/journalStorage';
import { WeeklySummaryMetrics } from '@/components/journal/WeeklySummaryMetrics';

export default function WeeklyJournal() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  
  const [weeklyTrades, setWeeklyTrades] = useState<TradeWithMetrics[]>([]);
  const [reflection, setReflection] = useState<string>('');
  const [weekGrade, setWeekGrade] = useState<string>('B');
  
  // Load trades for the selected week
  useEffect(() => {
    const allTrades = getTradesWithMetrics();
    const weekStart = currentWeekStart.getTime();
    const weekEnd = currentWeekEnd.getTime();
    
    // Filter trades closed within the week
    const tradesInWeek = allTrades.filter(trade => {
      if (trade.status !== 'closed' || !trade.exitDate) return false;
      
      const exitTime = new Date(trade.exitDate).getTime();
      return exitTime >= weekStart && exitTime <= weekEnd;
    });
    
    setWeeklyTrades(tradesInWeek);
    
    // Load existing reflection for this week
    const weekId = format(currentWeekStart, 'yyyy-MM-dd');
    const savedReflection = getWeeklyReflection(weekId);
    
    if (savedReflection) {
      setReflection(savedReflection.reflection || '');
      setWeekGrade(savedReflection.grade || 'B');
    } else {
      setReflection('');
      setWeekGrade('B');
    }
  }, [currentWeekStart, currentWeekEnd]);
  
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
  
  const saveReflection = () => {
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
    
    saveWeeklyReflection(reflectionData);
    toast.success('Weekly reflection saved');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Weekly Trading Journal</h1>
        
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
      </div>
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Week of {format(currentWeekStart, 'MMMM d')} - {format(currentWeekEnd, 'MMMM d, yyyy')}
        </h2>
        
        <Button onClick={saveReflection}>
          <Save className="h-4 w-4 mr-2" />
          Save Reflection
        </Button>
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
              <Select value={weekGrade} onValueChange={setWeekGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a grade" />
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
      
      {/* List of trades for this week */}
      <h2 className="text-xl font-semibold mt-6">Trades This Week</h2>
      <TradeList initialTrades={weeklyTrades} statusFilter="closed" />
    </div>
  );
}
