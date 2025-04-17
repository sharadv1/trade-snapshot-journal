import React, { useEffect, useState, useCallback, useRef } from 'react';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections, deleteWeeklyReflection } from '@/utils/journal/reflectionStorage';
import { removeDuplicateReflections } from '@/utils/journal/storage/duplicateReflections';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Scissors } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPeriodId, countWords } from '@/utils/journal/reflectionUtils';
import { toast } from '@/utils/toast';
import { clearTradeCache, preventTradeFetching } from '@/utils/tradeCalculations';
import { ReflectionsList } from './reflections/ReflectionsList';
import { ReflectionCard } from './reflections/ReflectionCard';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  
  const loadReflections = useCallback(async () => {
    if (!isMountedRef.current || loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      setLoadError(null);
      
      console.log("Loading weekly reflections...");
      const fetchedReflections = await getWeeklyReflections();
      
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
    isMountedRef.current = true;
    hasLoadedRef.current = false;
    
    preventTradeFetching(false);
    clearTradeCache();
    
    if (!hasLoadedRef.current) {
      loadReflections();
    }
    
    const handleUpdate = () => {
      if (isMountedRef.current && !loadingRef.current) {
        clearTradeCache();
        loadReflections();
      }
    };
    
    window.addEventListener('journal-updated', handleUpdate);
    window.addEventListener('journalUpdated', handleUpdate);
    window.addEventListener('trades-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      
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
  
  const navigateTo = useCallback((path: string) => {
    clearTradeCache();
    navigate(path);
  }, [navigate]);
  
  const getReflectionStats = (reflection: WeeklyReflection) => {
    const tradeCount = Array.isArray(reflection.tradeIds) ? reflection.tradeIds.length : 0;
    const rValue = typeof reflection.totalR === 'number' ? reflection.totalR : 0;
    const totalPnL = typeof reflection.totalPnL === 'number' ? reflection.totalPnL : 0;
    const hasContent = Boolean(reflection.reflection && reflection.reflection.trim().length > 0);
    
    return {
      pnl: totalPnL,
      rValue: rValue,
      tradeCount: tradeCount,
      hasContent: hasContent,
      winCount: 0,
      lossCount: 0,
      winRate: 0
    };
  };
  
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
  
  const handleCreateReflection = () => {
    navigateTo(`/journal/weekly/${getCurrentPeriodId('weekly')}`);
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Weekly Reflections</h1>
        <div className="flex gap-2">
          <Button onClick={handleRemoveDuplicates} variant="outline" className="gap-2">
            <Scissors size={18} />
            Remove Duplicates
          </Button>
          <Button onClick={handleCreateReflection} className="rounded-full h-12 w-12 p-0">
            <Plus className="h-6 w-6" />
            <span className="sr-only">New Week</span>
          </Button>
        </div>
      </div>
      
      {reflections.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-xl text-muted-foreground">No weekly reflections found. Start creating your trading journal!</p>
          <Button 
            size="lg" 
            className="mt-4"
            onClick={handleCreateReflection}
          >
            Create First Reflection
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reflections.map((reflection) => {
            const stats = getReflectionStats(reflection);
            
            const reflectionWordCount = countWords(reflection.reflection || '');
            const planWordCount = countWords(reflection.weeklyPlan || '');
            
            const dateRange = reflection.weekStart ? 
              `Week of ${new Date(reflection.weekStart).toLocaleDateString()}` : 
              'Unknown date range';
            
            return (
              <div 
                key={reflection.id} 
                onClick={() => navigateTo(`/journal/weekly/${reflection.weekId || reflection.id}`)} 
                className="cursor-pointer"
              >
                <ReflectionCard 
                  reflection={reflection}
                  type="weekly"
                  stats={stats}
                  dateRange={dateRange}
                  reflectionWordCount={reflectionWordCount}
                  planWordCount={planWordCount}
                  canDelete={stats.tradeCount === 0}
                  onDelete={handleDeleteReflection}
                  hasContent={stats.hasContent}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
