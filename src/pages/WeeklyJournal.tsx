import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
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
import { ReflectionCard } from '@/components/journal/reflections/ReflectionCard';
import { countWords, hasContent, getCurrentPeriodId } from '@/components/journal/reflections/ReflectionUtility';
import { getTradesForWeek } from '@/utils/tradeCalculations';
import { formatCurrency } from '@/utils/calculations/formatters';
import { WeeklySummaryMetrics } from '@/components/journal/WeeklySummaryMetrics';
import { TradeDetailModal } from '@/components/TradeDetailModal';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { toast } from '@/utils/toast';

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
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekId = format(weekStart, 'yyyy-MM-dd');
  const dateRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  
  const reflectionWordCount = countWords(reflection);
  const planWordCount = countWords(weeklyPlan);
  
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch reflections and trades on component mount and when the week changes
  useEffect(() => {
    const loadReflections = async () => {
      const reflections = await getWeeklyReflections();
      setWeeklyReflections(reflections);
    };
    
    loadReflections();
  }, [weekId]);
  
  useEffect(() => {
    const loadTrades = async () => {
      const trades = await getTradesForWeek(weekStart, weekEnd);
      setTradesForWeek(trades);
    };
    
    loadTrades();
  }, [weekStart, weekEnd]);
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
    }
  };
  
  const goToPreviousWeek = () => {
    const previousWeek = addDays(currentDate, -7);
    setCurrentDate(previousWeek);
  };
  
  const goToNextWeek = () => {
    const nextWeek = addDays(currentDate, 7);
    setCurrentDate(nextWeek);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleReflectionClick = (reflection: WeeklyReflection) => {
    setSelectedReflection(reflection);
    setReflection(reflection.reflection || '');
    setWeeklyPlan(reflection.weeklyPlan || '');
  };
  
  const handleTradeClick = (trade: TradeWithMetrics) => {
    setSelectedTrade(trade);
    setIsTradeModalOpen(true);
  };
  
  const handleSaveReflection = async () => {
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
        // Update existing reflection
        const updatedReflection: WeeklyReflection = {
          ...selectedReflection,
          ...reflectionData
        };
        await updateWeeklyReflection(updatedReflection);
        
        // Update the state
        setWeeklyReflections(prevReflections =>
          prevReflections.map(r => (r.id === selectedReflection.id ? updatedReflection : r))
        );
        
        toast.success("Reflection updated successfully", { duration: 3000 });
      } else {
        // Create new reflection
        const newReflection: WeeklyReflection = {
          id: weekId,
          ...reflectionData
        };
        await addWeeklyReflection(newReflection);
        
        // Update the state
        setWeeklyReflections(prevReflections => [...prevReflections, newReflection]);
        toast.success("Reflection saved successfully", { duration: 3000 });
      }
    } catch (error) {
      setIsSaving(false);
      toast.error("Failed to save reflection", { duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteReflection = async () => {
    setIsSaving(true);
    
    try {
      if (selectedReflection) {
        await deleteWeeklyReflection(selectedReflection.id);
        
        // Update the state
        setWeeklyReflections(prevReflections =>
          prevReflections.filter(r => r.id !== selectedReflection.id)
        );
        
        // Clear selected reflection
        setSelectedReflection(null);
        setReflection('');
        setWeeklyPlan('');
        
        toast.success("Reflection deleted successfully", { duration: 3000 });
      }
    } catch (error) {
      toast.error("Failed to delete reflection", { duration: 3000 });
    } finally {
      setIsSaving(false);
      setIsDeleteModalOpen(false);
    }
  };
  
  const currentReflection = weeklyReflections.find(r => r.weekId === weekId);
  
  const hasExistingContent = currentReflection ? (currentReflection.reflection || currentReflection.weeklyPlan) : false;
  
  const handleCreateNew = () => {
    navigate(`/journal/weekly/${weekId}`);
  };
  
  const totalPnL = tradesForWeek.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
  const totalR = tradesForWeek.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
  
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
          
          {/* Button to Create New or Edit Existing Reflection */}
          {isMounted && (
            <Button onClick={handleCreateNew}>
              {hasExistingContent ? 'Edit Reflection' : 'Create Reflection'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Reflections List */}
        <div className="md:col-span-1">
          <Card className="h-full border">
            <CardHeader>
              <CardTitle>Past Reflections</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {weeklyReflections.sort((a, b) => (b.weekStart || '').localeCompare(a.weekStart || '')).map((reflection) => (
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
        
        {/* Middle Column: Reflection Input */}
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
      
      {/* Trade Detail Modal */}
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
