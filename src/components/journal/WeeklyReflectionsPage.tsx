
import React, { useEffect, useState, useCallback } from 'react';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections } from '@/utils/journal/reflectionStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Scissors } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { getCurrentPeriodId, countWords } from '@/utils/journal/reflectionUtils';
import { toast } from '@/utils/toast';
import { formatCurrency } from '@/utils/calculations/formatters';
import { deleteWeeklyReflection } from '@/utils/journal/reflectionStorage';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Function to load reflections
  const loadReflections = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      console.log("Loading weekly reflections...");
      const fetchedReflections = await getWeeklyReflections();
      
      if (Array.isArray(fetchedReflections)) {
        // Sort reflections by date (most recent first)
        const sortedReflections = fetchedReflections.sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          
          try {
            return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
          } catch (error) {
            console.warn("Error sorting reflections by date:", error);
            return 0;
          }
        });
        
        console.log(`Loaded ${sortedReflections.length} weekly reflections successfully`);
        setReflections(sortedReflections);
      } else {
        console.error('Expected array of reflections but got:', typeof fetchedReflections);
        setReflections([]);
        setLoadError("Invalid reflection data format");
      }
    } catch (error) {
      console.error("Error loading reflections:", error);
      setLoadError("Failed to load reflections. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and reload on event
  useEffect(() => {
    loadReflections();
    
    // Listen for updates to reflections
    const handleUpdate = () => {
      loadReflections();
    };
    
    // Register event listeners
    window.addEventListener('journal-updated', handleUpdate);
    window.addEventListener('journalUpdated', handleUpdate);
    window.addEventListener('trades-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadReflections]);
  
  // Format date for display
  const formatDateRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      return `Week of ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
    } catch (error) {
      console.error("Error formatting date range:", error);
      return 'Invalid date range';
    }
  };
  
  // Handle reflection removal
  const handleDeleteReflection = async (reflectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await deleteWeeklyReflection(reflectionId);
      toast.success("Reflection deleted successfully");
      loadReflections();
    } catch (error) {
      console.error("Error deleting reflection:", error);
      toast.error("Failed to delete reflection");
    }
  };
  
  // Handle reflection creation or editing
  const handleRemoveDuplicates = () => {
    // This would connect to the duplicate removal logic
    try {
      const { removeDuplicateReflections } = require('@/utils/journal/reflectionStorage');
      const results = removeDuplicateReflections();
      toast.success(`Removed ${results.weeklyRemoved + results.monthlyRemoved} duplicate reflections`);
      loadReflections();
    } catch (error) {
      console.error("Error removing duplicates:", error);
      toast.error("Failed to remove duplicates");
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading reflections...</p>
      </div>
    );
  }
  
  // Render error state
  if (loadError) {
    return (
      <Card className="p-6">
        <p className="text-center text-red-500">{loadError}</p>
        <div className="flex justify-center mt-4">
          <Button onClick={loadReflections}>Retry Loading</Button>
        </div>
      </Card>
    );
  }
  
  // Main content with reflections list
  return (
    <div className="w-full max-w-screen-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Trading Journal</h1>
        <Button onClick={handleRemoveDuplicates} variant="outline" className="gap-2">
          <Scissors size={18} />
          Remove Duplicates
        </Button>
      </div>
      
      <div className="flex mb-10 gap-2">
        <Button variant="default" className="flex-1 py-6 rounded-md text-base">
          Weekly Reflections
        </Button>
        <Button variant="outline" className="flex-1 py-6 rounded-md text-base" asChild>
          <Link to="/journal/monthly">Monthly Reflections</Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Weekly Reflections</h2>
        <Button asChild size="lg" className="rounded-full h-12 w-12 p-0">
          <Link to={`/journal/weekly/${getCurrentPeriodId('weekly')}`}>
            <Plus className="h-6 w-6" />
            <span className="sr-only">New Week</span>
          </Link>
        </Button>
      </div>
      
      {reflections.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-xl text-muted-foreground">No weekly reflections found. Start creating your trading journal!</p>
          <Button 
            size="lg" 
            className="mt-4" 
            asChild
          >
            <Link to={`/journal/weekly/${getCurrentPeriodId('weekly')}`}>Create First Reflection</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reflections.map((reflection) => {
            if (!reflection || !reflection.id) return null;
            
            const dateRange = reflection.weekStart && reflection.weekEnd 
              ? formatDateRange(reflection.weekStart, reflection.weekEnd)
              : 'Unknown date range';
              
            const reflectionWordCount = countWords(reflection.reflection || '');
            const planWordCount = countWords(reflection.weeklyPlan || '');
            const tradeCount = Array.isArray(reflection.tradeIds) ? reflection.tradeIds.length : 0;
            const rValue = typeof reflection.totalR === 'number' ? reflection.totalR : 0;
            const totalPnL = typeof reflection.totalPnL === 'number' ? reflection.totalPnL : 0;
            const weekId = reflection.weekId || reflection.id;
            
            const hasContent = !!(reflection.reflection || reflection.weeklyPlan);
            
            return (
              <Card 
                key={reflection.id} 
                className="p-6 hover:bg-accent/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-medium">{dateRange}</h3>
                  <div className={`text-xl font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalPnL)}
                  </div>
                </div>
                
                <div className="space-y-1 mb-3">
                  <div className="text-muted-foreground">
                    Trades: {tradeCount}
                  </div>
                  <div className="text-muted-foreground">
                    R-Value: <span className={rValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {rValue > 0 ? '+' : ''}{rValue.toFixed(2)}R
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Reflection: {reflectionWordCount} words
                    {' '}Plan: {planWordCount} words
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 gap-3">
                  {tradeCount === 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={(e) => handleDeleteReflection(reflection.id, e)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                  >
                    <Link to={`/journal/weekly/${weekId}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit mr-2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Reflection
                    </Link>
                  </Button>
                </div>
                
                {reflection.grade && (
                  <div className="absolute top-6 right-24 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Grade: {reflection.grade}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
