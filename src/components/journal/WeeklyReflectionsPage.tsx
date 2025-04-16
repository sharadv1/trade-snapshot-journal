
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections } from '@/utils/reflectionStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReflectionCardSimple } from './reflections/ReflectionCardSimple';
import { format, parseISO } from 'date-fns';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMounted = useRef(true);
  
  // Use the reflection generator hook to ensure reflections are created
  const { isGenerating, error: generationError, isComplete } = useReflectionGenerator();
  
  // Function to load reflections
  const loadReflections = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading weekly reflections...");
      const fetchedReflections = await getWeeklyReflections();
      
      if (!isMounted.current) return;
      
      if (Array.isArray(fetchedReflections)) {
        // Sort reflections by date (most recent first)
        const sortedReflections = fetchedReflections.sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          
          try {
            const dateA = new Date(a.weekStart);
            const dateB = new Date(b.weekStart);
            
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return 0;
            }
            
            return dateB.getTime() - dateA.getTime();
          } catch (error) {
            console.warn("Error sorting reflections by date:", error);
            return 0;
          }
        });
        
        setReflections(sortedReflections);
      } else {
        console.error('Expected array of reflections but got:', typeof fetchedReflections);
        setReflections([]);
        setLoadError("Invalid reflection data format");
      }
    } catch (error) {
      console.error("Error loading reflections:", error);
      if (isMounted.current) {
        setLoadError("Failed to load reflections. Please try refreshing the page.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial load of reflections
  useEffect(() => {
    if (isComplete || !isGenerating) {
      loadReflections();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [loadReflections, isComplete, isGenerating]);
  
  // Set up event listeners for storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (!isMounted.current) return;
      
      console.log("Journal update detected - refreshing reflections list");
      loadReflections();
    };
    
    // Register event listeners
    window.addEventListener('journal-updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('journal-updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [loadReflections]);
  
  // Get current week ID for new reflection button
  const getCurrentWeekId = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday of current week
    return format(weekStart, 'yyyy-MM-dd');
  };
  
  // Format date range for display
  const formatDateRange = (reflection: WeeklyReflection) => {
    if (reflection.weekStart && reflection.weekEnd) {
      try {
        const start = parseISO(reflection.weekStart);
        const end = parseISO(reflection.weekEnd);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn("Invalid date in reflection:", reflection);
          return 'Invalid date range';
        }
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
      } catch (error) {
        console.error("Error formatting date range:", error);
        return 'Invalid date range';
      }
    }
    return 'Date range unavailable';
  };
  
  // Calculate reflection stats
  const getReflectionStats = (reflection: WeeklyReflection) => {
    const pnl = typeof reflection.totalPnL === 'number' ? reflection.totalPnL : 0;
    const rValue = typeof reflection.totalR === 'number' ? reflection.totalR : 0;
    const tradeCount = Array.isArray(reflection.tradeIds) ? reflection.tradeIds.length : 0;
    const hasContent = !!(reflection.reflection || reflection.weeklyPlan) && !reflection.isPlaceholder;
    
    return { pnl, rValue, tradeCount, hasContent };
  };
  
  // Render loading state
  if (isLoading || isGenerating) {
    return (
      <div className="flex justify-center items-center py-12 flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">
          {isGenerating ? 'Generating reflections...' : 'Loading reflections...'}
        </p>
      </div>
    );
  }
  
  // Render error state
  if (loadError || generationError) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-500">{loadError || generationError || "An unknown error occurred"}</p>
          <div className="flex justify-center mt-4">
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (reflections.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center">No weekly reflections found. Start creating your trading journal!</p>
          <div className="flex justify-center mt-4">
            <Button asChild>
              <Link to={`/journal/weekly/${getCurrentWeekId()}`}>Create First Reflection</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render reflections list
  return (
    <div className="w-full max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Weekly Reflections</h2>
        <Button asChild>
          <Link to={`/journal/weekly/${getCurrentWeekId()}`}>
            <Plus className="mr-2 h-4 w-4" />
            New Week
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {reflections.map((reflection) => {
          if (!reflection || !reflection.id) return null;
          
          const stats = getReflectionStats(reflection);
          const dateRange = formatDateRange(reflection);
          
          return (
            <ReflectionCardSimple
              key={reflection.id}
              reflection={reflection}
              type="weekly"
              dateRange={dateRange}
              pnl={stats.pnl}
              rValue={stats.rValue}
              tradeCount={stats.tradeCount}
              grade={reflection.grade}
              hasContent={stats.hasContent}
            />
          );
        })}
      </div>
    </div>
  );
}
