import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isBefore, isAfter, addWeeks } from 'date-fns';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Loader2, ExternalLink, Trash } from 'lucide-react';
import { WeeklyReflection, TradeWithMetrics } from '@/types';
import { getWeeklyReflection, saveWeeklyReflection, deleteWeeklyReflection } from '@/utils/journal/reflectionStorage';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { toast } from '@/utils/toast';
import { getTradesForWeek, clearTradeCache, preventTradeFetching, setTradeDebug } from '@/utils/tradeCalculations';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReflectionMetrics } from '@/components/journal/reflections/ReflectionMetrics';
import { removeDuplicateReflections } from '@/utils/journal/storage/duplicateReflections';
import { getWeekIdFromDate } from '@/utils/journal/reflectionUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export function WeeklyJournal() {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [reflection, setReflection] = useState<string>('');
  const [weeklyPlan, setWeeklyPlan] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [tradesForWeek, setTradesForWeek] = useState<TradeWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false);
  const [isProcessingDuplicates, setIsProcessingDuplicates] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [weeklyReflection, setWeeklyReflection] = useState<WeeklyReflection | null>(null);
  
  const isMountedRef = useRef(true);
  const needsReloadRef = useRef(true);
  const backupRef = useRef<{reflection: string, weeklyPlan: string, grade: string}>({
    reflection: '',
    weeklyPlan: '',
    grade: ''
  });
  const previousWeekIdRef = useRef<string | null>(null);
  const navigationInProgressRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);
  
  const handleSave = useCallback(async () => {
    if (!weekId || isSaving || !isMountedRef.current) return;
    
    const hasContent = (reflection && reflection.trim() !== '') || 
                       (weeklyPlan && weeklyPlan.trim() !== '');
    
    if (!hasContent) {
      if (isMountedRef.current) {
        toast.error('Please add content to either Reflection or Weekly Plan');
      }
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log(`Saving reflection for ${weekId}`, {
        reflection: reflection.substring(0, 50) + (reflection.length > 50 ? '...' : ''),
        grade,
        weeklyPlan: weeklyPlan.substring(0, 50) + (weeklyPlan.length > 50 ? '...' : '')
      });
      
      const today = new Date();
      const currentDate = weekId ? new Date(weekId) : today;
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const isFutureWeek = isAfter(weekStart, today);
      
      await saveWeeklyReflection(weekId, reflection, grade, weeklyPlan, isFutureWeek);
      
      if (!isMountedRef.current) return;
      
      toast.success('Reflection saved successfully');
      
      backupRef.current = { reflection, weeklyPlan, grade };
      pendingSaveRef.current = false;
      
      needsReloadRef.current = true;
      loadReflection();
      loadTrades();
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
  }, [weekId, reflection, grade, weeklyPlan, isSaving, loadReflection, loadTrades]);
  
  const safeWeekId = weekId || getWeekIdFromDate(new Date());
  const currentDate = safeWeekId ? new Date(safeWeekId) : new Date();
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const formattedDateRange = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
  
  const today = new Date();
  const isFutureWeek = isAfter(weekStart, today);
  
  useEffect(() => {
    console.log("Enabling trade debug mode");
    setTradeDebug(true);
    clearTradeCache();
    
    return () => {
      console.log("Disabling trade debug mode");
      setTradeDebug(false);
    };
  }, []);
  
  useEffect(() => {
    console.log(`WeeklyJournal: Component mounted for week ${weekId}`);
    
    isMountedRef.current = true;
    previousWeekIdRef.current = weekId || null;
    navigationInProgressRef.current = false;
    pendingSaveRef.current = false;
    
    clearTradeCache();
    preventTradeFetching(false);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current && weekId) {
        console.log('Weekly journal page visible again, refreshing data');
        loadReflection();
        loadTrades();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log('WeeklyJournal: Component unmounting');
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  const loadReflection = useCallback(async () => {
    if (!weekId || !isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      
      const reflectionData = await getWeeklyReflection(weekId);
      
      if (!isMountedRef.current) return;
      
      if (reflectionData) {
        console.log(`Loaded reflection data for ${weekId}:`, reflectionData);
        
        if (isFutureWeek && !reflectionData.isFutureWeek) {
          reflectionData.isFutureWeek = true;
        }
        
        setWeeklyReflection(reflectionData);
        setReflection(reflectionData.reflection || '');
        setWeeklyPlan(reflectionData.weeklyPlan || '');
        setGrade(reflectionData.grade || '');
        
        backupRef.current = {
          reflection: reflectionData.reflection || '',
          weeklyPlan: reflectionData.weeklyPlan || '',
          grade: reflectionData.grade || ''
        };
      } else {
        console.log(`No reflection found for ${weekId}, creating new empty reflection`);
        setWeeklyReflection({
          id: weekId,
          weekId: weekId,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          reflection: '',
          weeklyPlan: '',
          grade: '',
          isFutureWeek: isFutureWeek,
          lastUpdated: new Date().toISOString(),
          tradeIds: []
        });
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
        needsReloadRef.current = false;
        setInitialLoadComplete(true);
      }
    }
  }, [weekId, weekStart, weekEnd, isFutureWeek]);
  
  const loadTrades = useCallback(() => {
    if (!weekId || !isMountedRef.current) return;
    
    try {
      setIsLoadingTrades(true);
      console.log(`Loading trades for week ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
      
      const trades = getTradesForWeek(weekStart, weekEnd);
      
      if (!isMountedRef.current) return;
      
      console.log(`Loaded ${trades.length} trades for journal week`);
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
  }, [weekId, weekStart, weekEnd]);
  
  const handleWeekNavigation = useCallback((direction: 'previous' | 'next') => {
    if (isSaving || isLoading || navigationInProgressRef.current) {
      console.log(`Navigation blocked - saving: ${isSaving}, loading: ${isLoading}, navigationInProgress: ${navigationInProgressRef.current}`);
      return;
    }
    
    navigationInProgressRef.current = true;
    console.log(`Going to ${direction} week from week ${safeWeekId}`);
    
    if (pendingSaveRef.current) {
      console.log('Auto-saving changes before navigation');
      handleSave();
      pendingSaveRef.current = false;
    }
    
    const daysToAdd = direction === 'next' ? 7 : -7;
    const targetDate = addDays(weekStart, daysToAdd);
    
    const targetWeekId = getWeekIdFromDate(targetDate);
    
    console.log(`Navigating from ${safeWeekId} to ${targetWeekId}, weekStart: ${weekStart.toISOString()}, targetDate: ${targetDate.toISOString()}`);
    
    clearTradeCache();
    navigate(`/journal/weekly/${targetWeekId}`);
    
    setTimeout(() => {
      navigationInProgressRef.current = false;
    }, 500);
  }, [navigate, weekStart, safeWeekId, isSaving, isLoading, handleSave]);
  
  const goToPreviousWeek = useCallback(() => {
    handleWeekNavigation('previous');
  }, [handleWeekNavigation]);
  
  const goToNextWeek = useCallback(() => {
    handleWeekNavigation('next');
  }, [handleWeekNavigation]);
  
  const handleDeleteReflection = useCallback(async () => {
    if (!weeklyReflection || !weeklyReflection.id || !isMountedRef.current) return;
    
    try {
      setIsSaving(true);
      await deleteWeeklyReflection(weeklyReflection.id);
      
      if (!isMountedRef.current) return;
      
      setWeeklyReflection(null);
      setReflection('');
      setWeeklyPlan('');
      setGrade('');
      backupRef.current = { reflection: '', weeklyPlan: '', grade: '' };
      pendingSaveRef.current = false;
      
      toast.success('Reflection deleted successfully');
      
      setDeleteDialogOpen(false);
      
      navigate('/journal/weekly');
    } catch (error) {
      console.error('Error deleting reflection:', error);
      if (isMountedRef.current) {
        toast.error('Failed to delete reflection');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [weeklyReflection, navigate]);
  
  const handleCleanupDuplicates = useCallback(async () => {
    if (isProcessingDuplicates) return;
    
    try {
      setIsProcessingDuplicates(true);
      const { weeklyRemoved } = await removeDuplicateReflections();
      
      if (weeklyRemoved > 0) {
        toast.success(`Removed ${weeklyRemoved} duplicate weekly reflections`);
        loadReflection();
      } else {
        toast.info('No duplicate reflections found');
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      toast.error('Failed to cleanup duplicate reflections');
    } finally {
      setIsProcessingDuplicates(false);
    }
  }, [isProcessingDuplicates, loadReflection]);
  
  const handleSaveAndReturn = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const hasContent = (reflection && reflection.trim() !== '') || 
                         (weeklyPlan && weeklyPlan.trim() !== '');
      
      if (!hasContent) {
        if (isMountedRef.current) {
          toast.error('Please add content to either Reflection or Weekly Plan');
        }
        return;
      }
      
      await handleSave();
      
      clearTradeCache();
      
      navigate('/journal/weekly');
    } catch (error) {
      console.error('Error in save and return:', error);
    }
  }, [handleSave, navigate, reflection, weeklyPlan]);
  
  useEffect(() => {
    if (!weekId || !isMountedRef.current) return;
    
    const isWeekIdChanged = previousWeekIdRef.current !== weekId;
    
    if (isWeekIdChanged || !initialLoadComplete) {
      console.log(`WeeklyJournal: ${isWeekIdChanged ? 'weekId changed' : 'initial load'} for ${weekId}`);
      
      if (isWeekIdChanged && pendingSaveRef.current) {
        console.log('Auto-saving changes before navigation');
        handleSave();
        pendingSaveRef.current = false;
      }
      
      previousWeekIdRef.current = weekId;
      
      clearTradeCache();
      loadReflection();
      loadTrades();
    }
  }, [weekId, location.pathname, loadReflection, loadTrades, initialLoadComplete, handleSave]);
  
  useEffect(() => {
    return () => {
      clearTradeCache();
    };
  }, []);
  
  useEffect(() => {
    if (initialLoadComplete && 
        (reflection !== backupRef.current.reflection || 
         weeklyPlan !== backupRef.current.weeklyPlan || 
         grade !== backupRef.current.grade)) {
      pendingSaveRef.current = true;
    }
  }, [reflection, weeklyPlan, grade, initialLoadComplete]);
  
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
  
  const avgRPerTrade = tradesForWeek.length > 0 
    ? totalR / tradesForWeek.length 
    : 0;

  const navigateToTradeDetails = useCallback((tradeId: string) => {
    navigate(`/trade/${tradeId}`);
  }, [navigate]);
  
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
    <div className="container mx-auto py-6 max-w-screen-xl px-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/journal/weekly')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Journal
        </Button>
        
        <div className="flex flex-col">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">Weekly Journal</h1>
            {isFutureWeek && (
              <Badge className="ml-3 bg-blue-100 text-blue-800">Future Week</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isFutureWeek 
              ? "Plan your upcoming trading week." 
              : "Reflect on your trading week."}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center my-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToPreviousWeek}
          className="rounded-full"
          disabled={isSaving || isLoading || navigationInProgressRef.current}
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
          disabled={isSaving || isLoading || navigationInProgressRef.current}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className={`p-6 mb-6 ${isFutureWeek ? 'border-blue-200 bg-blue-50/30' : ''}`}>
        <ReflectionMetrics
          tradeCount={tradesForWeek.length}
          totalPnL={totalPnL}
          totalR={totalR}
          winCount={winCount}
          lossCount={lossCount}
          winRate={winRate}
          avgRPerTrade={avgRPerTrade}
          isFutureWeek={isFutureWeek}
        />
      </Card>
      
      <Card className={`p-6 mb-6 ${isFutureWeek ? 'border-blue-200 bg-blue-50/30' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            {isFutureWeek ? 'Weekly Plan' : 'Weekly Reflection'} - {formattedDateRange}
          </h2>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCleanupDuplicates} 
              disabled={isProcessingDuplicates}
            >
              {isProcessingDuplicates ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                'Clean Duplicates'
              )}
            </Button>
            
            {weeklyReflection && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Reflection</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this weekly reflection? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteReflection}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        
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
              placeholder={isFutureWeek 
                ? "This is a future week. You can use this space for notes about what you're planning to focus on."
                : "Write your weekly reflection here..."}
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
      
      <Card className={`p-6 ${isFutureWeek ? 'border-blue-200 bg-blue-50/30' : ''}`}>
        <h2 className="text-2xl font-semibold mb-6">
          Trades for {formattedDateRange}
        </h2>
        
        {isLoadingTrades ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : tradesForWeek.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {isFutureWeek 
              ? "This is a future week. No trades can be recorded yet."
              : "No trades found for this week."}
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
                  <th className="text-right py-2 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {tradesForWeek.map(trade => (
                  <tr 
                    key={trade.id} 
                    className="border-b hover:bg-accent/10 cursor-pointer"
                    onClick={() => navigateToTradeDetails(trade.id)}
                  >
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
                    <td className="py-2 px-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
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
