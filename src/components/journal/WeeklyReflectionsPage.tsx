
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections, deleteWeeklyReflection } from '@/utils/journal/reflectionStorage';
import { removeDuplicateReflections, cleanupEmptyReflections } from '@/utils/journal/storage/duplicateReflections';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Scissors, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPeriodId, getReflectionStats } from '@/utils/journal/reflectionUtils';
import { toast } from '@/utils/toast';
import { clearTradeCache, preventTradeFetching } from '@/utils/tradeCalculations';
import { ReflectionCard } from './reflections/ReflectionCard';
import { format, addDays } from 'date-fns';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isProcessingDuplicates, setIsProcessingDuplicates] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const navigate = useNavigate();

  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const loadReflections = useCallback(async (showToast = false) => {
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

        if (showToast) {
          toast.success("Reflections refreshed successfully");
        }
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
    if (hasInitialized) return;
    
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
    
    setHasInitialized(true);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);

      preventTradeFetching(false);
    };
  }, [loadReflections, hasInitialized]);

  const handleDeleteReflection = useCallback(async (reflectionId: string, e: React.MouseEvent) => {
    if (!isMountedRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      const reflection = reflections.find(r => r.id === reflectionId);
      if (!reflection) {
        toast.error("Reflection not found");
        return;
      }
      
      const stats = getReflectionStats(reflection);

      if (stats.tradeCount > 0) {
        toast.error("Cannot delete a reflection with associated trades");
        return;
      }

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
  }, [loadReflections, reflections]);

  const handleRemoveDuplicates = useCallback(async () => {
    if (!isMountedRef.current || isProcessingDuplicates) return;

    try {
      setIsProcessingDuplicates(true);
      console.log("Starting duplicate removal process...");

      // First, try to remove duplicates
      const results = await removeDuplicateReflections();
      const totalRemoved = results.weeklyRemoved + results.monthlyRemoved;

      // Then cleanup any empty reflections
      const emptyRemoved = await cleanupEmptyReflections();

      if (isMountedRef.current) {
        if (totalRemoved > 0 || emptyRemoved > 0) {
          let message = "";
          if (totalRemoved > 0) {
            message += `Removed ${totalRemoved} duplicate reflection${totalRemoved !== 1 ? 's' : ''}. `;
          }
          if (emptyRemoved > 0) {
            message += `Cleaned up ${emptyRemoved} empty reflection${emptyRemoved !== 1 ? 's' : ''}.`;
          }
          toast.success(message);

          // Force storage clearing
          clearTradeCache();

          // Force a reload with the reloaded flag
          await loadReflections(true);
        } else {
          toast.info("No duplicate or empty reflections found");
        }
      }
    } catch (error) {
      console.error("Error removing duplicates:", error);
      if (isMountedRef.current) {
        toast.error("Failed to remove duplicates");
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessingDuplicates(false);
      }
    }
  }, [isProcessingDuplicates, loadReflections]);

  const navigateTo = useCallback((path: string) => {
    clearTradeCache();
    navigate(path);
  }, [navigate]);

  const handleCreateReflection = () => {
    // Ensure we're creating for the current or future week, not past week
    const today = new Date();
    const nextWeek = addDays(today, 1); // Add 1 day to ensure we're in the current week
    const currentWeekId = format(nextWeek, 'yyyy-MM-dd');

    clearTradeCache();
    navigateTo(`/journal/weekly/${currentWeekId}`);
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
          <Button onClick={() => loadReflections(true)}>Retry Loading</Button>
        </div>
      </Card>
    );
  }

  // Find duplicate reflections (different IDs with the same weekId)
  const weekIdMap = new Map();
  const hasDuplicates = reflections.some(r => {
    if (!r.weekId) return false;
    if (weekIdMap.has(r.weekId)) return true;
    weekIdMap.set(r.weekId, true);
    return false;
  });

  return (
    <div className="container mx-auto py-6 max-w-screen-xl px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Weekly Reflections</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRemoveDuplicates}
            variant="outline"
            className={`gap-2 ${hasDuplicates ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
            disabled={isProcessingDuplicates}
          >
            {isProcessingDuplicates ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Scissors size={18} />
            )}
            {hasDuplicates ? 'Duplicates Detected!' : 'Remove Duplicates'}
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

            const dateRange = reflection.weekStart ?
              `Week of ${new Date(reflection.weekStart).toLocaleDateString()}` :
              'Unknown date range';

            // Check if this is a duplicate reflection
            const isDuplicate = reflections.some(
              r => r.id !== reflection.id && r.weekId === reflection.weekId
            );

            return (
              <div
                key={reflection.id}
                onClick={() => navigateTo(`/journal/weekly/${reflection.weekId || reflection.id}`)}
                className={`cursor-pointer ${isDuplicate ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <ReflectionCard
                  reflection={reflection}
                  type="weekly"
                  stats={stats}
                  dateRange={dateRange}
                  canDelete={stats.tradeCount === 0}
                  onDelete={stats.tradeCount === 0 ? handleDeleteReflection : undefined}
                  hasContent={stats.hasContent}
                  isDuplicate={isDuplicate}
                  showWordCounts={false}
                  showGrade={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
