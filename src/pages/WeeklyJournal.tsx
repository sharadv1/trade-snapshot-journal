
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isBefore, isAfter } from 'date-fns';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { WeeklyReflection, TradeWithMetrics } from '@/types';
import { getWeeklyReflection, saveWeeklyReflection } from '@/utils/journal/reflectionStorage';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { toast } from '@/utils/toast';
import { getTradesForWeek, clearTradeCache, preventTradeFetching, setTradeDebug } from '@/utils/tradeCalculations';
import { formatCurrency } from '@/utils/calculations/formatters';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Safety flag to track first load completion
let initialLoadCompleted = false;

export function WeeklyJournal() {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const [reflection, setReflection] = useState<string>('');
  const [weeklyPlan, setWeeklyPlan] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [tradesForWeek, setTradesForWeek] = useState<TradeWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [weeklyReflection, setWeeklyReflection] = useState<WeeklyReflection | null>(null);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false);
  
  // Critical mount/unmount tracking
  const isMountedRef = useRef(true);
  
  // Track if the component has finished loading - important!
  const hasLoadedRef = useRef(false);
  
  // Track if initial load should clear cache
  const shouldClearCacheRef = useRef(!initialLoadCompleted);
  
  // Backup for content
  const backupRef = useRef<{reflection: string, weeklyPlan: string, grade: string}>({
    reflection: '',
    weeklyPlan: '',
    grade: ''
  });
  
  // Parse the weekId to date objects
  const currentDate = weekId ? new Date(weekId) : new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const formattedDateRange = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
  
  // Check if navigation should be disabled (prevent navigating to future weeks)
  const today = new Date();
  const canNavigateForward = isBefore(weekStart, startOfWeek(today, { weekStartsOn: 1 }));
  
  // Turn off debug mode to reduce console noise
  useEffect(() => {
    setTradeDebug(false);
  }, []);
  
  // First-time safety: disabling fetch prevention
  useEffect(() => {
    // Always ensure fetching is enabled on component mount
    preventTradeFetching(false);
    return () => {
      // Ensure fetching is enabled when leaving
      preventTradeFetching(false);
    };
  }, []);
  
  // Navigate to previous/next week - memoized
  const goToPreviousWeek = useCallback(() => {
    if (isSaving || isLoading) return; // Prevent navigation during loading
    
    const previousWeek = addDays(weekStart, -7);
    
    // Prevent fetching during navigation to avoid loops
    preventTradeFetching(true);
    
    // Navigate to the new week
    navigate(`/journal/weekly/${format(previousWeek, 'yyyy-MM-dd')}`);
    
    // Re-enable fetching after navigation with delay
    setTimeout(() => {
      if (isMountedRef.current) {
        preventTradeFetching(false);
      }
    }, 500);
  }, [navigate, weekStart, isSaving, isLoading]);
  
  const goToNextWeek = useCallback(() => {
    if (isSaving || isLoading) return; // Prevent navigation during loading
    
    // Only allow navigation if not going beyond current week
    if (canNavigateForward) {
      const nextWeek = addDays(weekStart, 7);
      
      // Prevent fetching during navigation to avoid loops
      preventTradeFetching(true);
      
      // Navigate to the new week
      navigate(`/journal/weekly/${format(nextWeek, 'yyyy-MM-dd')}`);
      
      // Re-enable fetching after navigation with delay
      setTimeout(() => {
        if (isMountedRef.current) {
          preventTradeFetching(false);
        }
      }, 500);
    }
  }, [navigate, weekStart, canNavigateForward, isSaving, isLoading]);
  
  // Load reflection data - memoized
  const loadReflection = useCallback(async () => {
    if (!weekId || !isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      
      // Use getWeeklyReflection instead of getWeeklyReflectionById
      const reflectionData = await getWeeklyReflection(weekId);
      
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      if (reflectionData) {
        setWeeklyReflection(reflectionData);
        setReflection(reflectionData.reflection || '');
        setWeeklyPlan(reflectionData.weeklyPlan || '');
        setGrade(reflectionData.grade || '');
        
        // Store backup
        backupRef.current = {
          reflection: reflectionData.reflection || '',
          weeklyPlan: reflectionData.weeklyPlan || '',
          grade: reflectionData.grade || ''
        };
      } else {
        // Reset form for new reflection
        setWeeklyReflection(null);
        setReflection('');
        setWeeklyPlan('');
        setGrade('');
        backupRef.current = { reflection: '', weeklyPlan: '', grade: '' };
      }
    } catch (error) {
      console.error('Error loading reflection:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load reflection');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        
        // Mark as loaded - important
        hasLoadedRef.current = true;
      }
    }
  }, [weekId]);
  
  // Load trades for the week - memoized with loading state
  const loadTrades = useCallback(() => {
    if (!weekId || !isMountedRef.current || isLoadingTrades) return;
    
    try {
      setIsLoadingTrades(true);
      console.log(`Loading trades for week ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
      
      // Get trades for the week
      const trades = getTradesForWeek(weekStart, weekEnd);
      
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      setTradesForWeek(Array.isArray(trades) ? trades : []);
    } catch (error) {
      console.error('Error loading trades:', error);
      if (isMountedRef.current) {
        setTradesForWeek([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingTrades(false);
      }
    }
  }, [weekId, weekStart, weekEnd, isLoadingTrades]);
  
  // Critical component lifecycle management
  useEffect(() => {
    // Set the mounted flag (should always be true here)
    isMountedRef.current = true;
    
    // Enable fetching when component mounts
    preventTradeFetching(false);
    
    // Only clear cache on first load of the app, not on subsequent route changes
    if (shouldClearCacheRef.current) {
      console.log('Initial load - clearing trade cache');
      clearTradeCache();
      shouldClearCacheRef.current = false;
      initialLoadCompleted = true;
    } else {
      console.log('Subsequent load - not clearing cache');
    }
    
    // Load reflection data
    loadReflection();
    
    // Load trades after reflection with a small delay
    const tradeLoadTimer = setTimeout(() => {
      if (isMountedRef.current && !hasLoadedRef.current) {
        loadTrades();
      }
    }, 300);
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      clearTimeout(tradeLoadTimer);
      
      // Always enable fetching when component unmounts
      preventTradeFetching(false);
    };
  }, [loadReflection, loadTrades, weekId]);
  
  // Save reflection - memoized
  const handleSave = useCallback(async () => {
    if (!weekId || isSaving || !isMountedRef.current) return;
    
    setIsSaving(true);
    
    try {
      await saveWeeklyReflection(weekId, reflection, grade, weeklyPlan);
      
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      toast.success('Reflection saved successfully');
      
      // Update backup after successful save
      backupRef.current = { reflection, weeklyPlan, grade };
      
      // Reload to get updated data with short delay
      setTimeout(() => {
        if (isMountedRef.current) {
          loadReflection();
        }
      }, 300);
    } catch (error) {
      console.error('Error saving reflection:', error);
      if (isMountedRef.current) {
        toast.error('Failed to save reflection');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [weekId, reflection, grade, weeklyPlan, isSaving, loadReflection]);
  
  // Save and return to list - memoized
  const handleSaveAndReturn = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      await handleSave();
      
      // Prevent fetching during navigation
      preventTradeFetching(true);
      
      // Navigate back to the list
      navigate('/journal/weekly');
      
      // Re-enable fetching after navigation completes (with delay)
      setTimeout(() => {
        preventTradeFetching(false);
      }, 500);
    } catch (error) {
      console.error('Error in save and return:', error);
    }
  }, [handleSave, navigate]);
  
  // Calculate statistics
  const totalPnL = tradesForWeek.reduce((sum, trade) => 
    sum + (trade.metrics?.profitLoss || 0), 0);
  
  const totalR = tradesForWeek.reduce((sum, trade) => 
    sum + (trade.metrics?.rMultiple || 0), 0);
  
  const winCount = tradesForWeek.filter(trade => 
    (trade.metrics?.profitLoss || 0) > 0).length;
  
  const lossCount = tradesForWeek.filter(trade => 
    (trade.metrics?.profitLoss || 0) < 0).length;
  
  const winRate = tradesForWeek.length > 0 
    ? (winCount / tradesForWeek.length) * 100 
    : 0;
  
  const avgWin = winCount > 0 
    ? tradesForWeek.filter(t => (t.metrics?.profitLoss || 0) > 0)
        .reduce((sum, t) => sum + (t.metrics?.profitLoss || 0), 0) / winCount 
    : 0;
  
  const avgLoss = lossCount > 0 
    ? tradesForWeek.filter(t => (t.metrics?.profitLoss || 0) < 0)
        .reduce((sum, t) => sum + (t.metrics?.profitLoss || 0), 0) / lossCount 
    : 0;
  
  // Display loading state if still loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading weekly journal...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Back button and header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          asChild 
          className="mb-2"
          onClick={() => {
            // Safety: prevent fetching during navigation
            preventTradeFetching(true);
            
            // Re-enable after delay
            setTimeout(() => preventTradeFetching(false), 500);
          }}
        >
          <Link to="/journal/weekly">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </Link>
        </Button>
        
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Weekly Journal</h1>
          <p className="text-muted-foreground">Reflect on your trading week.</p>
        </div>
      </div>
      
      {/* Week navigation */}
      <div className="flex justify-between items-center my-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToPreviousWeek}
          className="rounded-full"
          disabled={isSaving || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-medium text-center">
          {formattedDateRange}
        </h2>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToNextWeek}
          className="rounded-full"
          disabled={!canNavigateForward || isSaving || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Weekly Stats */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-center">
          {/* Stats content */}
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
            <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Total R</p>
            <p className={`text-lg font-bold ${totalR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalR.toFixed(2)}R
            </p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Trades</p>
            <p className="text-lg font-bold">{tradesForWeek.length}</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="text-lg font-bold">{winRate.toFixed(1)}%</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Win/Loss</p>
            <p className="text-lg font-bold">{winCount}/{lossCount}</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Win</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(avgWin)}</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Loss</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(avgLoss)}</p>
          </div>
        </div>
      </Card>
      
      {/* Reflection form */}
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-6">
          Weekly Reflection - {formattedDateRange}
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-2">Weekly Plan</h3>
            <RichTextEditor
              id="weekly-plan"
              content={weeklyPlan}
              onChange={setWeeklyPlan}
              placeholder="Enter your plan for the week..."
            />
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">Reflection</h3>
            <RichTextEditor
              id="weekly-reflection"
              content={reflection}
              onChange={setReflection}
              placeholder="Write your weekly reflection here..."
            />
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">Week Grade</h3>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C+">C+</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="w-64"
              onClick={handleSaveAndReturn}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Return to List
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Trades for the week */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">
          Trades for {formattedDateRange}
        </h2>
        
        {isLoadingTrades ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : tradesForWeek.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No trades found for this week.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-left py-2 px-4">Direction</th>
                  <th className="text-left py-2 px-4">Grade</th>
                  <th className="text-left py-2 px-4">Entry Date</th>
                  <th className="text-left py-2 px-4">Exit Date</th>
                  <th className="text-right py-2 px-4">P&L</th>
                  <th className="text-right py-2 px-4">R Value</th>
                </tr>
              </thead>
              <tbody>
                {tradesForWeek.map(trade => (
                  <tr key={trade.id} className="border-b hover:bg-accent/10">
                    <td className="py-2 px-4">{trade.symbol}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.direction?.toUpperCase() === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {trade.grade && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.grade.startsWith('A') ? 'bg-green-100 text-green-800' : 
                          trade.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' : 
                          trade.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {trade.grade}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {trade.entryDate ? format(new Date(trade.entryDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="py-2 px-4">
                      {trade.exitDate ? format(new Date(trade.exitDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className={`py-2 px-4 text-right ${
                      (trade.metrics?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(trade.metrics?.profitLoss || 0)}
                    </td>
                    <td className={`py-2 px-4 text-right ${
                      (trade.metrics?.rMultiple || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(trade.metrics?.rMultiple || 0) > 0 ? '+' : ''}
                      {(trade.metrics?.rMultiple || 0).toFixed(2)}R
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
