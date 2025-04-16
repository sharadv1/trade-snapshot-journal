
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ReflectionsList } from './reflections/ReflectionsList';
import { WeeklyReflection } from '@/types';
import { getWeeklyReflections } from '@/utils/reflectionStorage';
import { format, parseISO, isBefore, isEqual, isWithinInterval } from 'date-fns';
import { getTradesForWeek } from '@/utils/tradeCalculations';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generatePDFReport } from '@/components/journal/ReportGenerator';
import { toast } from '@/utils/toast';
import { Card, CardContent } from '@/components/ui/card';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const processingWeekIds = useRef(new Set<string>());
  
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
        const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
        const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
        const winningTrades = weekTrades.filter(trade => (trade.metrics.profitLoss || 0) > 0);
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

  // Initial load of reflections
  useEffect(() => {
    const loadReflections = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log("Loading weekly reflections...");
        const fetchedReflections = await getWeeklyReflections();
        
        if (isMounted.current) {
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
              return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
            });
            
            setReflections(sortedReflections);
          } else {
            console.error('Expected array of reflections but got:', typeof fetchedReflections);
            setReflections([]);
            setLoadError("Invalid reflection data format");
          }
        }
      } catch (error) {
        console.error("Error loading reflections:", error);
        if (isMounted.current) {
          setLoadError("Failed to load reflections. Please try refreshing the page.");
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadReflections();
    
    return () => {
      isMounted.current = false;
    };
  }, [handleDownloadReport]);
  
  // Set up event listeners for storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      if (!isMounted.current) return;
      
      console.log("Journal update detected - refreshing reflections list");
      
      // Re-fetch reflections
      setIsLoading(true);
      getWeeklyReflections()
        .then(updatedReflections => {
          if (!isMounted.current) return;
          
          const updatedWithButtons = updatedReflections.map(reflection => ({
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
          
          // Sort by date (most recent first)
          const sortedReflections = updatedWithButtons.sort((a, b) => {
            if (!a.weekStart || !b.weekStart) return 0;
            return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
          });
          
          setReflections(sortedReflections);
        })
        .catch(error => {
          console.error("Error refreshing reflections:", error);
        })
        .finally(() => {
          if (isMounted.current) {
            setIsLoading(false);
          }
        });
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
  }, [handleDownloadReport]);
  
  // Get stats function for weekly reflections
  const getWeeklyStats = (reflection: WeeklyReflection) => {
    return {
      pnl: reflection.totalPnL || 0,
      rValue: reflection.totalR || 0,
      tradeCount: reflection.tradeIds?.length || 0,
      hasContent: !!(reflection.reflection || reflection.weeklyPlan) && !reflection.isPlaceholder
    };
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading reflections...</p>
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-red-500">{loadError}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ReflectionsList 
          reflections={reflections}
          type="weekly"
          getStats={getWeeklyStats}
        />
      )}
    </div>
  );
}
