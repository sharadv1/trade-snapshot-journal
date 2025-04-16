
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections } from '@/utils/journal/reflectionStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { Loader2, Plus, Search, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { ReflectionCard } from './reflections/ReflectionCard';
import { getCurrentPeriodId, getReflectionStats } from '@/utils/journal/reflectionUtils';
import { toast } from '@/utils/toast';

// Global cache to prevent redundant data fetching
const reflectionsCache = {
  data: [] as WeeklyReflection[],
  timestamp: 0,
  lastPath: ''
};

export function WeeklyReflectionsPage() {
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [forceReload, setForceReload] = useState(false);
  
  const isMounted = useRef(true);
  const loadingRef = useRef(false);
  
  // The generation process should be completely skipped on this page
  const { isComplete } = useReflectionGenerator();
  
  // Function to load reflections with caching
  const loadReflections = useCallback(async () => {
    if (loadingRef.current || !isMounted.current) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const now = Date.now();
      const currentPath = window.location.pathname;
      
      // Use cache if available and not forcing reload
      if (!forceReload && 
          reflectionsCache.data.length > 0 && 
          now - reflectionsCache.timestamp < 30000 &&
          reflectionsCache.lastPath === currentPath) {
        console.log('Using cached reflections data');
        setReflections(reflectionsCache.data);
        setFilteredReflections(reflectionsCache.data);
        setIsLoading(false);
        loadingRef.current = false;
        return;
      }
      
      console.log("Loading weekly reflections...");
      const fetchedReflections = await getWeeklyReflections();
      
      if (!isMounted.current) return;
      
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
        
        // Update cache
        reflectionsCache.data = sortedReflections;
        reflectionsCache.timestamp = now;
        reflectionsCache.lastPath = currentPath;
        
        console.log(`Loaded ${sortedReflections.length} weekly reflections successfully`);
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
      if (isMounted.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [forceReload]);

  // Handle search with simpler filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReflections(reflections);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = reflections.filter(reflection => {
      // Simple and efficient filtering
      if (!reflection) return false;
      
      // Search in date
      if (reflection.weekStart && reflection.weekStart.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in content (only if string)
      if (reflection.reflection && typeof reflection.reflection === 'string' && 
          reflection.reflection.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredReflections(filtered);
  }, [searchQuery, reflections]);

  // Initial load and reload on generation complete
  useEffect(() => {
    loadReflections();
  }, [loadReflections, isComplete]);
  
  // Event listeners for storage updates
  useEffect(() => {
    const handleReflectionsGenerated = () => {
      console.log("Reflections generation completed - reloading reflections list");
      // Invalidate cache
      reflectionsCache.timestamp = 0;
      loadReflections();
    };
    
    // Register event listeners
    window.addEventListener('reflections-generated', handleReflectionsGenerated);
    window.addEventListener('journal-updated', handleReflectionsGenerated);
    
    return () => {
      isMounted.current = false;
      // Clean up event listeners
      window.removeEventListener('reflections-generated', handleReflectionsGenerated);
      window.removeEventListener('journal-updated', handleReflectionsGenerated);
    };
  }, [loadReflections]);
  
  // Force reload function
  const handleForceReload = useCallback(() => {
    reflectionsCache.timestamp = 0; // Invalidate cache
    setForceReload(prev => !prev);
    toast.info("Refreshing reflections...");
  }, []);
  
  // Format date range for display
  const formatDateRange = useCallback((reflection: WeeklyReflection) => {
    if (!reflection.weekStart || !reflection.weekEnd) {
      return 'Date range unavailable';
    }
    
    try {
      const start = new Date(reflection.weekStart);
      const end = new Date(reflection.weekEnd);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid date range';
      }
      
      const formatMonth = (date: Date) => date.toLocaleDateString('en-US', { month: 'short' });
      const formatDay = (date: Date) => date.toLocaleDateString('en-US', { day: 'numeric' });
      const formatYear = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric' });
      
      return `${formatMonth(start)} ${formatDay(start)} - ${formatMonth(end)} ${formatDay(end)}, ${formatYear(end)}`;
    } catch (error) {
      console.error("Error formatting date range:", error);
      return 'Invalid date range';
    }
  }, []);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading reflections...</p>
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
  if (loadError) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-500">{loadError}</p>
          <div className="flex justify-center mt-4">
            <Button onClick={handleForceReload}>Retry Loading</Button>
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
          <Button variant="outline" onClick={handleForceReload}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
                  hasContent={stats.hasContent}
                />
              );
            } catch (error) {
              console.error("Error rendering reflection card:", error, reflection);
              return null;
            }
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}
