
import React, { useEffect, useState, useCallback } from 'react';
import { MonthlyReflection } from '@/types';
import { getMonthlyReflections } from '@/utils/journal/reflectionStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { Loader2, Plus, Search, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { ReflectionCard } from './reflections/ReflectionCard';
import { getCurrentPeriodId, getReflectionStats } from '@/utils/journal/reflectionUtils';
import { toast } from '@/utils/toast';

export function MonthlyReflectionsPage() {
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<MonthlyReflection[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<MonthlyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [forceReload, setForceReload] = useState(false);
  
  // Use the reflection generator hook to ensure reflections are created
  const { isGenerating, error: generationError, isComplete } = useReflectionGenerator();
  
  // Function to load reflections
  const loadReflections = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading monthly reflections...");
      const fetchedReflections = await getMonthlyReflections();
      
      if (Array.isArray(fetchedReflections)) {
        // Sort reflections by date (most recent first)
        const sortedReflections = fetchedReflections.sort((a, b) => {
          if (!a.monthStart || !b.monthStart) return 0;
          
          try {
            return new Date(b.monthStart).getTime() - new Date(a.monthStart).getTime();
          } catch (error) {
            console.warn("Error sorting reflections by date:", error);
            return 0;
          }
        });
        
        console.log(`Loaded ${sortedReflections.length} monthly reflections successfully`);
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
      if (reflection.monthStart && reflection.monthStart.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in content
      if (reflection.reflection && reflection.reflection.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredReflections(filtered);
  }, [searchQuery, reflections]);

  // Initial load of reflections and after generation completes
  useEffect(() => {
    if (isComplete || !isGenerating) {
      loadReflections();
    }
  }, [loadReflections, isComplete, isGenerating, forceReload]);
  
  // Listen for reflections-generated events
  useEffect(() => {
    const handleReflectionsGenerated = () => {
      console.log("Reflections generation completed - reloading reflections list");
      loadReflections();
    };
    
    // Register event listeners
    window.addEventListener('reflections-generated', handleReflectionsGenerated);
    window.addEventListener('journal-updated', handleReflectionsGenerated);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('reflections-generated', handleReflectionsGenerated);
      window.removeEventListener('journal-updated', handleReflectionsGenerated);
    };
  }, [loadReflections]);
  
  // Force reload function
  const handleForceReload = () => {
    setForceReload(prev => !prev);
    toast.info("Refreshing reflections...");
  };

  // Handle reflection click with navigation
  const handleReflectionClick = useCallback((reflectionId: string) => {
    // Navigate programmatically to prevent UI freezing
    navigate(`/journal/monthly/${reflectionId}`);
  }, [navigate]);
  
  // Format date range for display
  const formatDateRange = (reflection: MonthlyReflection) => {
    if (reflection.monthStart && reflection.monthEnd) {
      try {
        const start = parseISO(reflection.monthStart);
        return format(start, 'MMMM yyyy');
      } catch (error) {
        console.error("Error formatting date range:", error);
        return 'Invalid date range';
      }
    } else if (reflection.monthId) {
      try {
        const [year, month] = reflection.monthId.split('-').map(n => parseInt(n));
        const date = new Date(year, month - 1, 1);
        return format(date, 'MMMM yyyy');
      } catch (error) {
        console.error("Error parsing month ID:", error);
        return 'Invalid date';
      }
    }
    return 'Date unavailable';
  };
  
  // Render loading state
  if (isLoading || isGenerating) {
    return (
      <div className="flex justify-center items-center py-12 flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">
          {isGenerating ? 'Generating reflections...' : 'Loading reflections...'}
        </p>
        {/* Add a button to force completion if stuck in this state for too long */}
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={handleForceReload}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
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
            <Button onClick={handleForceReload}>Refresh Data</Button>
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
          <p className="text-center">No monthly reflections found. Start creating your trading journal!</p>
          <div className="flex justify-center mt-4">
            <Button asChild>
              <Link to={`/journal/monthly/${getCurrentPeriodId('monthly')}`}>Create First Reflection</Link>
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
        <h2 className="text-2xl font-bold">Monthly Reflections</h2>
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
          <Button variant="outline" onClick={handleForceReload}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button asChild>
            <Link to={`/journal/monthly/${getCurrentPeriodId('monthly')}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Month
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
            const reflectionId = reflection.monthId || reflection.id;
            
            return (
              <div 
                key={reflection.id} 
                onClick={() => handleReflectionClick(reflectionId)}
                className="cursor-pointer"
              >
                <ReflectionCard
                  reflection={reflection}
                  type="monthly"
                  dateRange={dateRange}
                  stats={stats}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
