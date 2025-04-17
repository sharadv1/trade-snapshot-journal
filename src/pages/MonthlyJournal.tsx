
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { MonthlyReflection, TradeWithMetrics } from '@/types';
import { getMonthlyReflection, saveMonthlyReflection } from '@/utils/journal/reflectionStorage';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { toast } from '@/utils/toast';
import { formatCurrency } from '@/utils/calculations/formatters';
import { clearTradeCache } from '@/utils/tradeCalculations';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MonthlyJournal() {
  const { monthId } = useParams<{ monthId: string }>();
  const navigate = useNavigate();
  const [reflection, setReflection] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [monthlyReflection, setMonthlyReflection] = useState<MonthlyReflection | null>(null);
  const [tradesForMonth, setTradesForMonth] = useState<TradeWithMetrics[]>([]);
  
  // Add mounted ref to prevent updates after unmount
  const isMountedRef = useRef(true);
  
  const backupRef = React.useRef<{reflection: string, grade: string}>({
    reflection: '',
    grade: ''
  });
  
  // Format the month for display
  const formattedMonth = monthId ? format(new Date(monthId), 'MMMM yyyy') : 'Unknown Month';
  
  // Effect for component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    
    // Clear trade cache on mount
    clearTradeCache();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Navigate to previous/next month
  const goToPreviousMonth = useCallback(() => {
    if (!monthId || isSaving || isLoading) return;
    
    const date = new Date(monthId);
    date.setMonth(date.getMonth() - 1);
    const previousMonth = format(date, 'yyyy-MM');
    
    // Clear cache before navigation
    clearTradeCache();
    
    navigate(`/journal/monthly/${previousMonth}`);
  }, [navigate, monthId, isSaving, isLoading]);
  
  const goToNextMonth = useCallback(() => {
    if (!monthId || isSaving || isLoading) return;
    
    const date = new Date(monthId);
    date.setMonth(date.getMonth() + 1);
    const nextMonth = format(date, 'yyyy-MM');
    
    // Clear cache before navigation
    clearTradeCache();
    
    navigate(`/journal/monthly/${nextMonth}`);
  }, [navigate, monthId, isSaving, isLoading]);
  
  // Load reflection data
  const loadReflection = useCallback(async () => {
    if (!monthId || !isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      const reflectionData = await getMonthlyReflection(monthId);
      
      if (!isMountedRef.current) return;
      
      if (reflectionData) {
        setMonthlyReflection(reflectionData);
        setReflection(reflectionData.reflection || '');
        setGrade(reflectionData.grade || '');
        
        // Store backup
        backupRef.current = {
          reflection: reflectionData.reflection || '',
          grade: reflectionData.grade || ''
        };
      } else {
        // Reset form for new reflection
        setMonthlyReflection(null);
        setReflection('');
        setGrade('');
        backupRef.current = { reflection: '', grade: '' };
      }
    } catch (error) {
      console.error('Error loading monthly reflection:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load monthly reflection');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [monthId]);
  
  // Initial load
  useEffect(() => {
    loadReflection();
  }, [loadReflection, monthId]);
  
  // Save reflection
  const handleSave = useCallback(async () => {
    if (!monthId || isSaving || !isMountedRef.current) return;
    
    setIsSaving(true);
    
    try {
      await saveMonthlyReflection(monthId, reflection, grade);
      
      if (!isMountedRef.current) return;
      
      toast.success('Monthly reflection saved successfully');
      
      // Update backup after successful save
      backupRef.current = { reflection, grade };
      
      // Reload to get updated data
      loadReflection();
    } catch (error) {
      console.error('Error saving monthly reflection:', error);
      if (isMountedRef.current) {
        toast.error('Failed to save monthly reflection');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [monthId, reflection, grade, isSaving, loadReflection]);
  
  // Save and return to list
  const handleSaveAndReturn = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      await handleSave();
      
      // Clear cache before navigation
      clearTradeCache();
      
      // Navigate back with React Router
      navigate('/journal/monthly');
    } catch (error) {
      console.error('Error in save and return:', error);
    }
  }, [handleSave, navigate]);
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monthly journal...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            clearTradeCache();
            navigate('/journal/monthly');
          }}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Monthly Journal
        </Button>
        
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Monthly Journal</h1>
          <p className="text-muted-foreground">Reflect on your trading month.</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center my-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToPreviousMonth}
          className="rounded-full"
          disabled={isSaving || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-medium text-center">
          {formattedMonth}
        </h2>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToNextMonth}
          className="rounded-full"
          disabled={isSaving || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-6">
          Monthly Reflection - {formattedMonth}
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-2">Reflection</h3>
            <RichTextEditor
              id="monthly-reflection"
              content={reflection}
              onChange={setReflection}
              placeholder="Write your monthly reflection here..."
            />
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">Month Grade</h3>
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
              disabled={isSaving}
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
    </div>
  );
}
