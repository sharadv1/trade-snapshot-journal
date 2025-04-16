import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronsLeft, ChevronsRight, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WeeklyReflection, TradeWithMetrics } from '@/types';
import { getWeeklyReflections, addWeeklyReflection, updateWeeklyReflection, deleteWeeklyReflection } from '@/utils/reflectionStorage';
import { TradeCommentsList } from '@/components/journal/TradeCommentsList';
import { WeeklySummaryMetrics } from '@/components/journal/WeeklySummaryMetrics';
import { TradeDetailModal } from '@/components/TradeDetailModal';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { toast } from '@/utils/toast';
import { getTradesForWeek, clearTradeCache } from '@/utils/tradeCalculations';

const formatDate = (date: Date): string => format(date, 'MMMM dd, yyyy');

export function WeeklyJournal() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weeklyReflections, setWeeklyReflections] = useState<WeeklyReflection[]>([]);
  const [selectedReflection, setSelectedReflection] = useState<WeeklyReflection | null>(null);
  const [reflection, setReflection] = useState<string>('');
  const [weeklyPlan, setWeeklyPlan] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeWithMetrics | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  const [tradesForWeek, setTradesForWeek] = useState<TradeWithMetrics[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const [isTradesLoading, setIsTradesLoading] = useState<boolean>(false);
  const tradesLoadingRef = useRef<boolean>(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef<boolean>(false);
  
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekId = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const dateRange = useMemo(() => `${formatDate(weekStart)} - ${formatDate(weekEnd)}`, [weekStart, weekEnd]);
  
  const reflectionWordCount = useMemo(() => countWords(reflection), [reflection]);
  const planWordCount = useMemo(() => countWords(weeklyPlan), [weeklyPlan]);
  
  useEffect(() => {
    isMounted.current = true;
    
    clearTradeCache();
    
    return () => {
      isMounted.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);
  
  const loadReflections = useCallback(async () => {
    if (loadingRef.current || !isMounted.current) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const reflections = await getWeeklyReflections();
      
      if (isMounted.current) {
        if (Array.isArray(reflections)) {
          setWeeklyReflections(reflections);
        } else {
          console.error('Expected array of reflections but got:', typeof reflections);
          setWeeklyReflections([]);
        }
        
        setIsLoading(false);
        loadingRef.current = false;
      }
    } catch (error) {
      console.error('Error loading reflections:', error);
      
      if (isMounted.current) {
        setWeeklyReflections([]);
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, []);
  
  const loadTradesForWeek = useCallback(async () => {
    if (tradesLoadingRef.current || !isMounted.current) return;
    
    try {
      tradesLoadingRef.current = true;
      setIsTradesLoading(true);
      
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      loadTimeoutRef.current = setTimeout(async () => {
        try {
          const trades = await getTradesForWeek(weekStart, weekEnd);
          
          if (isMounted.current) {
            if (Array.isArray(trades)) {
              setTradesForWeek(trades);
            } else {
              console.error('Expected array of trades but got:', typeof trades);
              setTradesForWeek([]);
            }
            
            setIsTradesLoading(false);
            tradesLoadingRef.current = false;
          }
        } catch (error) {
          console.error('Error in delayed trade loading:', error);
          
          if (isMounted.current) {
            setTradesForWeek([]);
            setIsTradesLoading(false);
            tradesLoadingRef.current = false;
          }
        }
      }, 300);
    } catch (error) {
      console.error('Error loading trades for week:', error);
      
      if (isMounted.current) {
        setTradesForWeek([]);
        setIsTradesLoading(false);
        tradesLoadingRef.current = false;
      }
    }
  }, [weekStart, weekEnd]);
  
  useEffect(() => {
    loadReflections();
  }, [loadReflections]);
  
  useEffect(() => {
    loadTradesForWeek();
  }, [loadTradesForWeek]);
  
  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
    }
  }, []);
  
  const goToPreviousWeek = useCallback(() => {
    const previousWeek = addDays(currentDate, -7);
    setCurrentDate(previousWeek);
  }, [currentDate]);
  
  const goToNextWeek = useCallback(() => {
    const nextWeek = addDays(currentDate, 7);
    setCurrentDate(nextWeek);
  }, [currentDate]);
  
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);
  
  const handleReflectionClick = useCallback((reflection: WeeklyReflection) => {
    setSelectedReflection(reflection);
    setReflection(reflection.reflection || '');
    setWeeklyPlan(reflection.weeklyPlan || '');
  }, []);
  
  const handleTradeClick = useCallback((trade: TradeWithMetrics) => {
    setSelectedTrade(trade);
    setIsTradeModalOpen(true);
  }, []);
  
  const handleSaveReflection = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    const reflectionData = {
      weekId,
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      reflection,
      weeklyPlan,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      if (selectedReflection) {
        const updatedReflection: WeeklyReflection = {
          ...selectedReflection,
          ...reflectionData
        };
        await updateWeeklyReflection(updatedReflection);
        
        setWeeklyReflections(prevReflections => {
          if (!Array.isArray(prevReflections)) {
            return [updatedReflection];
          }
          return prevReflections.map(r => (r.id === selectedReflection.id ? updatedReflection : r));
        });
        
        toast.success("Reflection updated successfully", { duration: 3000 });
      } else {
        const newReflection: WeeklyReflection = {
          id: weekId,
          ...reflectionData
        };
        await addWeeklyReflection(newReflection);
        
        setWeeklyReflections(prevReflections => {
          if (!Array.isArray(prevReflections)) {
            return [newReflection];
          }
          return [...prevReflections, newReflection];
        });
        toast.success("Reflection saved successfully", { duration: 3000 });
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast.error("Failed to save reflection", { duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, weekId, weekStart, weekEnd, reflection, weeklyPlan, selectedReflection]);
  
  const handleDeleteReflection = useCallback(async () => {
    if (isSaving || !selectedReflection) return;
    
    setIsSaving(true);
    
    try {
      await deleteWeeklyReflection(selectedReflection.id);
      
      setWeeklyReflections(prevReflections => {
        if (!Array.isArray(prevReflections)) {
          return [];
        }
        return prevReflections.filter(r => r.id !== selectedReflection.id);
      });
      
      setSelectedReflection(null);
      setReflection('');
      setWeeklyPlan('');
      
      toast.success("Reflection deleted successfully", { duration: 3000 });
    } catch (error) {
      console.error('Error deleting reflection:', error);
      toast.error("Failed to delete reflection", { duration: 3000 });
    } finally {
      setIsSaving(false);
      setIsDeleteModalOpen(false);
    }
  }, [isSaving, selectedReflection]);
  
  const currentReflection = useMemo(() => {
    return Array.isArray(weeklyReflections) ? 
      weeklyReflections.find(r => r.weekId === weekId) : undefined;
  }, [weeklyReflections, weekId]);
  
  const hasExistingContent = useMemo(() => {
    return currentReflection ? 
      !!(currentReflection.reflection || currentReflection.weeklyPlan) : false;
  }, [currentReflection]);
  
  const handleCreateNew = useCallback(() => {
    navigate(`/journal/weekly/${weekId}`);
  }, [navigate, weekId]);
  
  const totalPnL = Array.isArray(tradesForWeek) ? 
    tradesForWeek.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0) : 0;
  
  const totalR = Array.isArray(tradesForWeek) ? 
    tradesForWeek.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0) : 0;

  function countWords(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-semibold">Weekly Journal</h1>
          <Badge variant="secondary">{dateRange}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={
                  "h-8 w-[220px] justify-start text-left font-normal" +
                  (currentDate ? "pl-3" : "text-muted-foreground")
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {currentDate ? formatDate(currentDate) : <span>Pick a week</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                defaultMonth={currentDate}
                selected={currentDate}
                onSelect={handleDateChange}
                numberOfMonths={3}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
          <Button onClick={goToToday}>Today</Button>
          
          {isMounted && (
            <Button onClick={handleCreateNew}>
              {hasExistingContent ? 'Edit Reflection' : 'Create Reflection'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-full border">
            <CardHeader>
              <CardTitle>Past Reflections</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {Array.isArray(weeklyReflections) && weeklyReflections
                    .sort((a, b) => (b.weekStart || '').localeCompare(a.weekStart || ''))
                    .map((reflection) => (
                      <div
                        key={reflection.id}
                        className={`p-4 cursor-pointer hover:bg-accent/30 ${selectedReflection?.id === reflection.id ? 'bg-accent' : ''}`}
                        onClick={() => handleReflectionClick(reflection)}
                      >
                        {reflection.weekStart && reflection.weekEnd ? (
                          <div className="flex items-center justify-between">
                            <div>
                              Week of {formatDate(new Date(reflection.weekStart))} - {formatDate(new Date(reflection.weekEnd))}
                            </div>
                            {reflection.grade && (
                              <Badge variant="outline">{reflection.grade}</Badge>
                            )}
                          </div>
                        ) : (
                          <div>
                            No Date
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="border">
            <CardHeader>
              <CardTitle>
                {selectedReflection ? 'Edit Reflection' : 'New Reflection'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Weekly Reflection</h3>
                  <RichTextEditor
                    id="weekly-reflection"
                    content={reflection}
                    onChange={setReflection}
                    placeholder="Write your weekly reflection here..."
                  />
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-2">Next Week's Plan</h3>
                  <RichTextEditor
                    id="weekly-plan"
                    content={weeklyPlan}
                    onChange={setWeeklyPlan}
                    placeholder="Plan for next week..."
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    Reflection: {reflectionWordCount} words | Plan: {planWordCount} words
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveReflection}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Reflection'}
                    </Button>
                    
                    {selectedReflection && (
                      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="text-red-500 border-red-300 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
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
                            <AlertDialogAction onClick={handleDeleteReflection} className="bg-red-500 hover:bg-red-600">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-6">
        <WeeklySummaryMetrics
          trades={tradesForWeek}
        />
        
        <TradeCommentsList trades={tradesForWeek} listTitle="Trades This Week" />
      </div>
      
      <TradeDetailModal 
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        tradeId={selectedTrade?.id} 
      />
      
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reflection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this weekly reflection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReflection} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
