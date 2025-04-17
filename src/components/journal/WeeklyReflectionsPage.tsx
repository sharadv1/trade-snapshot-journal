
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections, deleteWeeklyReflection } from '@/utils/journal/reflectionStorage';
import { removeDuplicateReflections } from '@/utils/journal/storage/duplicateReflections';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Scissors } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentPeriodId } from '@/utils/journal/reflectionUtils';
import { toast } from '@/utils/toast';
import { ReflectionCard } from './ReflectionCard';
import { clearTradeCache, preventTradeFetching } from '@/utils/tradeCalculations';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Add mounted ref to prevent updates after unmount
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);
  
  // Track if we've already loaded reflections to avoid loop
  const hasLoadedRef = useRef(false);
  
  const loadReflections = useCallback(async () => {
    if (!isMountedRef.current || loadingRef.current) return;
    
    try {
      // Set loading ref to prevent concurrent loads
      loadingRef.current = true;
      setIsLoading(true);
      setLoadError(null);
      
      console.log("Loading weekly reflections...");
      const fetchedReflections = await getWeeklyReflections();
      
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      if (Array.isArray(fetchedReflections)) {
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
        hasLoadedRef.current = true;
      } else {
        console.error('Expected array of reflections but got:', typeof fetchedReflections);
        setReflections([]);
        setLoadError("Invalid reflection data format");
      }
    } catch (error) {
      console.error("Error loading reflections:", error);
      if (isMountedRef.current) {
        setLoadError("Failed to load reflections. Please try refreshing the page.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    // Set the mounted flag to true when mounting
    isMountedRef.current = true;
    hasLoadedRef.current = false;
    
    // Reset fetching prevention on mount
    preventTradeFetching(false);
    
    // Reset the trade cache when loading the reflections list
    clearTradeCache();
    
    // Load reflections ONLY if we haven't loaded them yet
    if (!hasLoadedRef.current) {
      loadReflections();
    }
    
    const handleUpdate = () => {
      if (isMountedRef.current && !loadingRef.current) {
        // Clear cache when changes occur
        clearTradeCache();
        loadReflections();
      }
    };
    
    window.addEventListener('journal-updated', handleUpdate);
    window.addEventListener('journalUpdated', handleUpdate);
    window.addEventListener('trades-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      
      // Ensure fetching is enabled when leaving
      preventTradeFetching(false);
    };
  }, [loadReflections]);
  
  const handleDeleteReflection = useCallback(async (reflectionId: string, e: React.MouseEvent) => {
    if (!isMountedRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await deleteWeeklyReflection(reflectionId);
      if (isMountedRef.current) {
        toast.success("Reflection deleted successfully");
        loadReflections();
      }
    } catch (error) {
      console.error("Error deleting reflection:", error);
      if (isMountedRef.current) {
        toast.error("Failed to delete reflection");
      }
    }
  }, [loadReflections]);
  
  const handleRemoveDuplicates = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const results = await removeDuplicateReflections();
      if (isMountedRef.current) {
        toast.success(`Removed ${results.weeklyRemoved + results.monthlyRemoved} duplicate reflections`);
        loadReflections();
      }
    } catch (error) {
      console.error("Error removing duplicates:", error);
      if (isMountedRef.current) {
        toast.error("Failed to remove duplicates");
      }
    }
  }, [loadReflections]);
  
  // Helper function for navigation without page reload
  const navigateTo = useCallback((path: string) => {
    // Clear cache before navigating
    clearTradeCache();
    navigate(path);
  }, [navigate]);
  
  // Handle clicking on a reflection card
  const handleReflectionClick = useCallback((reflection: WeeklyReflection) => {
    // Clear cache before navigating to ensure fresh data
    clearTradeCache();
    navigate(`/journal/weekly/${reflection.weekId || reflection.id}`);
  }, [navigate]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading reflections...</p>
      </div>
    );
  }
  
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
        <Button 
          variant="outline" 
          className="flex-1 py-6 rounded-md text-base"
          onClick={() => navigateTo('/journal/monthly')}
        >
          Monthly Reflections
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Weekly Reflections</h2>
        <Button 
          onClick={() => navigateTo(`/journal/weekly/${getCurrentPeriodId('weekly')}`)}
          size="lg" 
          className="rounded-full h-12 w-12 p-0"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">New Week</span>
        </Button>
      </div>
      
      {reflections.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-xl text-muted-foreground">No weekly reflections found. Start creating your trading journal!</p>
          <Button 
            size="lg" 
            className="mt-4"
            onClick={() => navigateTo(`/journal/weekly/${getCurrentPeriodId('weekly')}`)}
          >
            Create First Reflection
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reflections.map((reflection) => (
            <div 
              key={reflection.id} 
              onClick={() => handleReflectionClick(reflection)} 
              className="cursor-pointer"
            >
              <ReflectionCard 
                reflection={reflection} 
                onDelete={handleDeleteReflection}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
