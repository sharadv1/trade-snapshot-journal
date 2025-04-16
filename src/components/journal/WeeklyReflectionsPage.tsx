
import React, { useEffect, useState, useCallback } from 'react';
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
  
  // Use the reflection generator hook to ensure reflections are created
  const { isGenerating, error: generationError, isComplete } = useReflectionGenerator();
  
  // Function to load reflections
  const loadReflections = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
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
        
        setReflections(sortedReflections);
        setFilteredReflections(sortedReflections);
      } else {
        console.error('Expected array of reflections but got:', typeof fetchedReflections);
        setReflections([]);
        setFilteredReflections([]);
        setLoadError("Invalid reflection data format");
      }
    } catch (error) {
      console.error("Error loading reflections:", error);
      setLoadError("Failed to load reflections. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReflections(reflections);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = reflections.filter(reflection => {
      // Search in date
      if (reflection.weekStart && reflection.weekStart.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in content
      if (reflection.reflection && reflection.reflection.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in plan
      if (reflection.weeklyPlan && reflection.weeklyPlan.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredReflections(filtered);
  }, [searchQuery, reflections]);

  // Initial load of reflections
  useEffect(() => {
    if (isComplete || !isGenerating) {
      loadReflections();
    }
  }, [loadReflections, isComplete, isGenerating]);
  
  // Set up event listeners for storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
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
  
  // Format date range for display
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
              <Link to={`/journal/weekly/${getCurrentPeriodId('weekly')}`}>Create First Reflection</Link>
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
