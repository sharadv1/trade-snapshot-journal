
import React, { useEffect, useState, useCallback } from 'react';
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
import { clearTradeCache } from '@/utils/tradeCalculations';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const loadReflections = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      console.log("Loading weekly reflections...");
      const fetchedReflections = await getWeeklyReflections();
      
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

  useEffect(() => {
    // Reset the trade cache when loading the reflections list
    clearTradeCache();
    
    loadReflections();
    
    const handleUpdate = () => {
      loadReflections();
    };
    
    window.addEventListener('journal-updated', handleUpdate);
    window.addEventListener('journalUpdated', handleUpdate);
    window.addEventListener('trades-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadReflections]);
  
  const handleDeleteReflection = useCallback(async (reflectionId: string, e: React.MouseEvent) => {
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
  }, [loadReflections]);
  
  const handleRemoveDuplicates = useCallback(async () => {
    try {
      const results = await removeDuplicateReflections();
      toast.success(`Removed ${results.weeklyRemoved + results.monthlyRemoved} duplicate reflections`);
      loadReflections();
    } catch (error) {
      console.error("Error removing duplicates:", error);
      toast.error("Failed to remove duplicates");
    }
  }, [loadReflections]);
  
  const handleReflectionClick = useCallback((reflection: WeeklyReflection) => {
    // Clear trade cache before navigating to ensure fresh data
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
          {reflections.map((reflection) => (
            <div key={reflection.id} onClick={() => handleReflectionClick(reflection)} className="cursor-pointer">
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
