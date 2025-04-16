
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections } from '@/utils/journal/reflectionStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { Loader2, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { ReflectionCard } from './reflections/ReflectionCard';
import { getCurrentPeriodId, getReflectionStats } from '@/utils/journal/reflectionUtils';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isMounted = useRef(true);
  const eventsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventTimeRef = useRef<number>(0);
  const isLoadingRef = useRef(true);
  
  const { isGenerating, error: generationError, isComplete } = useReflectionGenerator();
  
  const loadReflections = useCallback(async () => {
    if (!isMounted.current || (isGenerating && !isComplete)) {
      console.log('Skipping loadReflections - component unmounted or still generating');
      return;
    }
    
    if (isLoadingRef.current) {
      console.log('Already loading reflections, skipping duplicate load');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading weekly reflections...");
      // Add small delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      let fetchedReflections;
      try {
        fetchedReflections = await getWeeklyReflections();
        console.log(`Loaded ${fetchedReflections.length} weekly reflections`);
      } catch (err) {
        console.error("Error in getWeeklyReflections:", err);
        throw err;
      }
      
      if (!isMounted.current) {
        console.log('Component unmounted during fetch, aborting update');
        return;
      }
      
      if (Array.isArray(fetchedReflections)) {
        // Process reflections in chunks to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 0)); // Yield to browser
        
        const sortedReflections = [...fetchedReflections].sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          
          try {
            return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
          } catch (error) {
            console.warn("Error sorting reflections by date:", error);
            return 0;
          }
        });
        
        setReflections(sortedReflections);
        setFilteredReflections(sortedReflections);
      } else {
        console.error('Expected array of reflections but got:', typeof fetchedReflections);
        setReflections([]);
        setFilteredReflections([]);
        setLoadError("Invalid reflection data format");
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error("Error loading reflections:", error);
      setLoadError("Failed to load reflections. Please try refreshing the page.");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [isGenerating, isComplete]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReflections(reflections);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = reflections.filter(reflection => {
      if (reflection.weekStart && reflection.weekStart.toLowerCase().includes(query)) {
        return true;
      }
      
      if (reflection.reflection && typeof reflection.reflection === 'string' && 
          reflection.reflection.toLowerCase().includes(query)) {
        return true;
      }
      
      if (reflection.weeklyPlan && typeof reflection.weeklyPlan === 'string' && 
          reflection.weeklyPlan.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredReflections(filtered);
  }, [searchQuery, reflections]);

  useEffect(() => {
    console.log("Deciding whether to load reflections:", { isComplete, isGenerating });
    // Only load reflections when generation is complete or not started
    if (isComplete || !isGenerating) {
      loadReflections();
    }
  }, [loadReflections, isComplete, isGenerating]);
  
  useEffect(() => {
    const handleStorageUpdate = () => {
      console.log("Storage update detected");
      const now = Date.now();
      const MIN_EVENT_INTERVAL = 500;
      
      if (eventsTimerRef.current) {
        clearTimeout(eventsTimerRef.current);
      }
      
      if (now - lastEventTimeRef.current < MIN_EVENT_INTERVAL) {
        eventsTimerRef.current = setTimeout(() => {
          console.log("Debounced journal update - refreshing reflections list");
          loadReflections();
          lastEventTimeRef.current = Date.now();
        }, MIN_EVENT_INTERVAL);
        return;
      }
      
      console.log("Journal update detected - refreshing reflections list");
      loadReflections();
      lastEventTimeRef.current = now;
    };
    
    window.addEventListener('journal-updated', handleStorageUpdate);
    
    return () => {
      isMounted.current = false;
      
      if (eventsTimerRef.current) {
        clearTimeout(eventsTimerRef.current);
      }
      
      window.removeEventListener('journal-updated', handleStorageUpdate);
    };
  }, [loadReflections]);
  
  const formatDateRange = (reflection: WeeklyReflection) => {
    if (reflection.weekStart && reflection.weekEnd) {
      try {
        const start = parseISO(reflection.weekStart);
        const end = parseISO(reflection.weekEnd);
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
      } catch (error) {
        console.error("Error formatting date range:", error);
        return 'Invalid date range';
      }
    }
    return 'Date range unavailable';
  };
  
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
  
  if (reflections.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center">No weekly reflections found. Start creating your trading journal!</p>
          <div className="flex justify-center mt-4">
            <Button asChild>
              <Link to={`/journal/weekly/${getCurrentPeriodId('weekly')}`}>Create First Reflection</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Weekly Reflections</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search reflections..."
              className="pl-8 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link to={`/journal/weekly/${getCurrentPeriodId('weekly')}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Week
            </Link>
          </Button>
        </div>
      </div>
      
      {filteredReflections.length === 0 && searchQuery ? (
        <p className="text-center py-8 text-muted-foreground">
          No reflections matching "{searchQuery}"
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReflections.map((reflection) => {
            if (!reflection || !reflection.id) return null;
            
            const stats = getReflectionStats(reflection);
            const dateRange = formatDateRange(reflection);
            
            return (
              <ReflectionCard
                key={reflection.id}
                reflection={reflection}
                type="weekly"
                dateRange={dateRange}
                stats={stats}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
