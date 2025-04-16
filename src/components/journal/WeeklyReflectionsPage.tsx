
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ReflectionsList } from './reflections/ReflectionsList';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections } from '@/utils/reflectionStorage';
import { format, parseISO } from 'date-fns';
import { getTradesForWeek } from '@/utils/tradeCalculations';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generatePDFReport } from '@/components/journal/ReportGenerator';
import { toast } from '@/utils/toast';
import { Card, CardContent } from '@/components/ui/card';
import { useReflectionGenerator } from '@/hooks/useReflectionGenerator';
import { Loader2 } from 'lucide-react';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const loadAttempts = useRef(0);
  const maxLoadAttempts = 3;
  
  // Use the reflection generator hook to ensure reflections are created
  const { isGenerating, error: generationError, isComplete } = useReflectionGenerator();
  
  // Function to download a weekly report
  const handleDownloadReport = useCallback((reflection: WeeklyReflection) => {
    if (!reflection.weekStart || !reflection.weekEnd) {
      toast.error("Cannot generate report: Missing week dates");
      return;
    }
    
    // Show generation toast
    toast.info("Generating PDF report...");
    
    // Get trades for this week
    getTradesForWeek(new Date(reflection.weekStart), new Date(reflection.weekEnd))
      .then(weekTrades => {
        // Calculate metrics
        const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
        const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
        const winningTrades = weekTrades.filter(trade => (trade.metrics?.profitLoss || 0) > 0);
        const winRate = weekTrades.length > 0 ? (winningTrades.length / weekTrades.length) * 100 : 0;
        
        // Format date range for the report
        const dateRange = `${format(new Date(reflection.weekStart), 'MMM d')} - ${format(new Date(reflection.weekEnd), 'MMM d, yyyy')}`;
        
        // Data for the report
        const reportData = {
          title: `Weekly Trading Report: ${dateRange}`,
          dateRange,
          trades: weekTrades,
          metrics: {
            totalPnL,
            winRate,
            totalR,
            tradeCount: weekTrades.length,
            winningTrades: winningTrades.length,
            losingTrades: weekTrades.length - winningTrades.length
          }
        };
        
        // Generate and download the PDF report
        const filename = `trading-report-${format(new Date(reflection.weekStart), 'yyyy-MM-dd')}.pdf`;
        
        if (generatePDFReport(reportData, filename)) {
          toast.success("Trading report downloaded successfully!");
        }
      })
      .catch(error => {
        console.error("Error generating report:", error);
        toast.error("Failed to generate report");
      });
  }, []);

  // Function to load reflections
  const loadReflections = useCallback(async () => {
    if (loadAttempts.current >= maxLoadAttempts) {
      console.error("Maximum load attempts reached");
      setLoadError("Failed to load reflections after multiple attempts. Please refresh the page.");
      setIsLoading(false);
      return;
    }
    
    loadAttempts.current += 1;
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading weekly reflections...");
      const fetchedReflections = await getWeeklyReflections();
      
      if (!isMounted.current) return;
      
      console.log(`Loaded ${fetchedReflections.length} weekly reflections`);
      
      if (Array.isArray(fetchedReflections)) {
        // Add download buttons to reflections
        const reflectionsWithButtons = fetchedReflections.map(reflection => ({
          ...reflection,
          actions: (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadReport(reflection);
              }}
              title="Download weekly report as PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          )
        }));
        
        // Sort reflections by date (most recent first)
        const sortedReflections = reflectionsWithButtons.sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          
          const dateA = new Date(a.weekStart);
          const dateB = new Date(b.weekStart);
          
          // Check if dates are valid
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.warn("Invalid date encountered when sorting reflections");
            return 0;
          }
          
          return dateB.getTime() - dateA.getTime();
        });
        
        console.log(`Sorted ${sortedReflections.length} reflections for display`);
        setReflections(sortedReflections);
        setIsLoading(false);
      } else {
        console.error('Expected array of reflections but got:', typeof fetchedReflections);
        setReflections([]);
        setLoadError("Invalid reflection data format");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading reflections:", error);
      if (isMounted.current) {
        setLoadError("Failed to load reflections. Please try refreshing the page.");
        setIsLoading(false);
      }
    }
  }, [handleDownloadReport]);

  // Initial load of reflections
  useEffect(() => {
    if (isComplete || loadAttempts.current === 0) {
      // Only load reflections after generation is complete or on first attempt
      loadReflections();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [loadReflections, isComplete]);
  
  // Set up event listeners for storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (!isMounted.current) return;
      
      console.log("Journal update detected - refreshing reflections list");
      loadReflections();
    };
    
    // Register event listeners
    window.addEventListener('journal-updated', handleStorageUpdate);
    window.addEventListener('journalUpdated', handleStorageUpdate);
    window.addEventListener('trades-updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('journal-updated', handleStorageUpdate);
      window.removeEventListener('journalUpdated', handleStorageUpdate);
      window.removeEventListener('trades-updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [loadReflections]);
  
  // Handle situations where loading takes too long
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !loadError) {
        console.log("Loading timeout reached, forcing refresh");
        loadReflections();
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, loadError, loadReflections]);
  
  // Get stats function for weekly reflections
  const getWeeklyStats = (reflection: WeeklyReflection) => {
    const pnl = typeof reflection.totalPnL === 'number' ? reflection.totalPnL : 0;
    const rValue = typeof reflection.totalR === 'number' ? reflection.totalR : 0;
    const tradeCount = Array.isArray(reflection.tradeIds) ? reflection.tradeIds.length : 0;
    const hasContent = !!(reflection.reflection || reflection.weeklyPlan) && !reflection.isPlaceholder;
    
    return { pnl, rValue, tradeCount, hasContent };
  };
  
  // Function to render loading state
  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-12 flex-col">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-muted-foreground">
        {isGenerating ? 'Generating reflections...' : 'Loading reflections...'}
      </p>
    </div>
  );
  
  // Function to render error state
  const renderErrorState = (errorMessage: string) => (
    <Card>
      <CardContent className="py-8">
        <p className="text-center text-red-500">{errorMessage}</p>
        <div className="flex justify-center mt-4">
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </CardContent>
    </Card>
  );
  
  // Function to render empty state
  const renderEmptyState = () => (
    <Card>
      <CardContent className="py-8">
        <p className="text-center">No weekly reflections found. Start creating your trading journal!</p>
        <div className="flex justify-center mt-4">
          <Button onClick={() => window.location.href = '/journal/weekly/new-week'}>Create First Reflection</Button>
        </div>
      </CardContent>
    </Card>
  );
  
  // Return appropriate UI based on state
  return (
    <div className="w-full max-w-screen-xl mx-auto">
      {isLoading ? (
        renderLoadingState()
      ) : loadError || generationError ? (
        renderErrorState(loadError || generationError || "An unknown error occurred")
      ) : reflections.length > 0 ? (
        <ReflectionsList 
          reflections={reflections}
          type="weekly"
          getStats={getWeeklyStats}
        />
      ) : (
        renderEmptyState()
      )}
    </div>
  );
}
