
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

// Cache for reflections data
const reflectionsCache = {
  data: null as WeeklyReflection[] | null,
  timestamp: 0,
  isLoading: false,
  pendingRequests: 0
};

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isMounted = useRef(true);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadAttemptRef = useRef(0);
  const lastLoadTimeRef = useRef<number>(0);
  
  const { isGenerating, error: generationError, isComplete } = useReflectionGenerator();
  
  const loadReflections = useCallback(async () => {
    // Skip if component unmounted or we're already loading
    if (!isMounted.current || reflectionsCache.isLoading) return;
    
    // Throttle loading attempts
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 2000 && loadAttemptRef.current > 2) {
      console.log('Too many loading attempts, throttling');
      setTimeout(() => {
        if (isMounted.current) {
          loadAttemptRef.current = 0;
          lastLoadTimeRef.current = Date.now();
        }
      }, 2000);
      return;
    }
    
    // Check cache freshness
    if (reflectionsCache.data && now - reflectionsCache.timestamp < 5000) {
      console.log('Using cached reflections data');
      setReflections(reflectionsCache.data);
      setFilteredReflections(reflectionsCache.data);
      setIsLoading(false);
      return;
    }
    
    try {
      loadAttemptRef.current++;
      lastLoadTimeRef.current = now;
      reflectionsCache.isLoading = true;
      reflectionsCache.pendingRequests++;
      setIsLoading(true);
      setLoadError(null);
      
      console.log('Loading weekly reflections');
      let fetchedReflections;
      
      try {
        fetchedReflections = await getWeeklyReflections();
      } catch (err) {
        console.error("Error in getWeeklyReflections:", err);
        throw err;
      }
      
      if (!isMounted.current) {
        reflectionsCache.pendingRequests--;
        if (reflectionsCache.pendingRequests === 0) {
          reflectionsCache.isLoading = false;
        }
        return;
      }
      
      if (Array.isArray(fetchedReflections)) {
        const sortedReflections = [...fetchedReflections].sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          return b.weekStart.localeCompare(a.weekStart);
        });
        
        reflectionsCache.data = sortedReflections;
        reflectionsCache.timestamp = now;
        
        if (isMounted.current) {
          setReflections(sortedReflections);
          setFilteredReflections(sortedReflections);
        }
      } else {
        console.error('Expected array of reflections but got:', typeof fetchedReflections);
        
        if (isMounted.current) {
          setReflections([]);
          setFilteredReflections([]);
        }
      }
    } catch (error) {
      console.error("Error loading reflections:", error);
      
      if (isMounted.current) {
        setLoadError("Failed to load reflections. Please try refreshing the page.");
      }
    } finally {
      reflectionsCache.pendingRequests--;
      if (reflectionsCache.pendingRequests === 0) {
        reflectionsCache.isLoading = false;
      }
      
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);
  
  // Handle search filtering with debounce
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    searchTimerRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      if (searchQuery.trim() === '') {
        setFilteredReflections(reflections);
        return;
      }
      
      const query = searchQuery.toLowerCase();
      const filtered = reflections.filter(reflection => {
        if (!reflection) return false;
        
        if (reflection.weekStart && reflection.weekStart.toLowerCase().includes(query)) {
          return true;
        }
        
        if (reflection.reflection && typeof reflection.reflection === 'string') {
          if (reflection.reflection.toLowerCase().includes(query)) {
            return true;
          }
        }
        
        if (reflection.weeklyPlan && typeof reflection.weeklyPlan === 'string') {
          if (reflection.weeklyPlan.toLowerCase().includes(query)) {
            return true;
          }
        }
        
        return false;
      });
      
      setFilteredReflections(filtered);
    }, 300);
    
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, reflections]);
  
  // Load reflections when generation completes or when not generating
  useEffect(() => {
    // Only load if generation is complete or not in progress
    if (isComplete || !isGenerating) {
      loadReflections();
    }
  }, [loadReflections, isComplete, isGenerating]);
  
  // Handle storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (!isMounted.current) return;
      
      console.log('Journal updated event received');
      reflectionsCache.timestamp = 0; // Invalidate cache
      
      // Slight delay to ensure all storage operations complete
      setTimeout(() => {
        if (isMounted.current) {
          loadReflections();
        }
      }, 300);
    };
    
    window.addEventListener('journal-updated', handleStorageUpdate);
    
    return () => {
      isMounted.current = false;
      
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      
      window.removeEventListener('journal-updated', handleStorageUpdate);
    };
  }, [loadReflections]);
  
  // Format date range for display
  const formatDateRange = useCallback((reflection: WeeklyReflection) => {
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
  }, []);
  
  // Loading and error states
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
            <Button onClick={() => {
              reflectionsCache.timestamp = 0;
              loadReflections();
            }}>Retry Loading</Button>
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
  
  // Main content with reflections list
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
            
            try {
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
            } catch (error) {
              console.error("Error rendering reflection card:", error);
              return null;
            }
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}
