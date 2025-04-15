
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ReflectionsList } from './reflections/ReflectionsList';
import { WeeklyReflection } from '@/types';
import { 
  getAllWeeklyReflections, 
  weeklyReflectionExists,
  getWeeklyReflection
} from '@/utils/journalStorage';
import { startOfWeek, endOfWeek, addWeeks, format, parseISO, isBefore, isEqual, isWithinInterval } from 'date-fns';
import { getTradesForWeek } from '@/utils/tradeCalculations';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generatePDFReport } from '@/components/journal/ReportGenerator';
import { toast } from '@/utils/toast';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const processingWeekIds = useRef(new Set<string>());
  
  // Function to download a weekly report - defined outside of useEffect to avoid recreating on each render
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
    setIsLoading(true);
    
    // Load reflections once on component mount
    const loadReflections = () => {
      console.log("Loading weekly reflections");
      
      try {
        // Get existing reflections from storage
        const existingReflections = getAllWeeklyReflections();
        
        // Ensure existingReflections is an object
        if (!existingReflections || typeof existingReflections !== 'object') {
          console.error('Expected object of reflections but got:', typeof existingReflections);
          setIsLoading(false);
          return [];
        }
        
        // Create a map to track unique reflections by their week range
        const weeksByRange = new Map<string, WeeklyReflection>();
        
        // Process all existing reflections
        Object.values(existingReflections).forEach(reflection => {
          if (reflection && typeof reflection === 'object' && 'id' in reflection) {
            const reflectionObj = reflection as WeeklyReflection;
            
            // Skip reflections without proper ID
            if (!reflectionObj.weekId) return;
            
            // Generate a normalized week key that represents the actual week range
            let normalizedWeekKey = "";
            
            if (reflectionObj.weekStart && reflectionObj.weekEnd) {
              const startDate = new Date(reflectionObj.weekStart);
              const endDate = new Date(reflectionObj.weekEnd);
              normalizedWeekKey = `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
            } else if (reflectionObj.weekId) {
              try {
                // Try to parse the ID as a date and generate standard week range
                const weekDate = new Date(reflectionObj.weekId);
                if (!isNaN(weekDate.getTime())) {
                  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
                  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
                  normalizedWeekKey = `${format(weekStart, 'yyyy-MM-dd')}_${format(weekEnd, 'yyyy-MM-dd')}`;
                } else {
                  normalizedWeekKey = reflectionObj.weekId;
                }
              } catch (e) {
                normalizedWeekKey = reflectionObj.weekId;
              }
            }
            
            if (!normalizedWeekKey) {
              console.log(`Skipping reflection due to missing week data:`, reflectionObj);
              return;
            }
            
            // Check if we already have a reflection for this week
            const existingEntry = weeksByRange.get(normalizedWeekKey);
            
            // If no existing entry or this one is newer (non-placeholder or has content), use this one
            const hasContent = !!(reflectionObj.reflection || reflectionObj.weeklyPlan);
            const isPlaceholder = reflectionObj.isPlaceholder === true;
            
            if (!existingEntry || 
                // Prefer entries with content over empty ones
                (hasContent && !existingEntry.reflection && !existingEntry.weeklyPlan) ||
                // Prefer non-placeholder entries
                (!isPlaceholder && existingEntry.isPlaceholder) ||
                // If both have content and same placeholder status, use the one with latest update
                (hasContent && !!(existingEntry.reflection || existingEntry.weeklyPlan) && 
                 (isPlaceholder === existingEntry.isPlaceholder) && 
                 reflectionObj.lastUpdated && existingEntry.lastUpdated && 
                 new Date(reflectionObj.lastUpdated) > new Date(existingEntry.lastUpdated))) {
              
              // Add enriched data to the map - this prevents duplicates by week range
              weeksByRange.set(normalizedWeekKey, {
                ...reflectionObj,
                date: reflectionObj.weekStart || reflectionObj.date || new Date().toISOString(),
                weekId: reflectionObj.weekId,
                tradeIds: reflectionObj.tradeIds || [],
                isPlaceholder: isPlaceholder
              });
              
              console.log(`Selected reflection for week ${normalizedWeekKey}:`, reflectionObj.weekId);
            } else {
              console.log(`Skipping duplicate reflection for week ${normalizedWeekKey}:`, reflectionObj.weekId);
            }
          }
        });
        
        // Convert map to array and sort by date (most recent first)
        const uniqueReflections = Array.from(weeksByRange.values()).sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
        });
        
        console.log(`Generated ${uniqueReflections.length} unique weekly reflections`);
        
        return uniqueReflections;
      } catch (error) {
        console.error("Error generating reflection list:", error);
        return [];
      }
    };
    
    // Generate initial reflections list
    const initialReflections = loadReflections();
    setReflections(initialReflections);
    
    // Then add download buttons in a separate step to avoid repeated getTradesWithMetrics calls
    setTimeout(() => {
      if (isMounted.current) {
        const reflectionsWithButtons = addDownloadButtonsToReflections(initialReflections);
        setReflections(reflectionsWithButtons);
        setIsLoading(false);
      }
    }, 100);
    
    return () => {
      isMounted.current = false;
    };
  }, [handleDownloadReport]);
  
  // Function to add download buttons to reflections
  const addDownloadButtonsToReflections = useCallback((reflectionsList: WeeklyReflection[]) => {
    return reflectionsList.map(reflection => ({
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
  }, [handleDownloadReport]);
  
  // Look for weeks with trades that don't have reflections yet - but only once on mount
  useEffect(() => {
    // A helper to check the current generation set for specific weeks
    const isWeekBeingProcessed = (weekKey: string) => {
      return processingWeekIds.current.has(weekKey);
    };
    
    const addWeekWithTradesIfMissing = (weekStart: Date, weekEnd: Date) => {
      const normalizedWeekKey = `${format(weekStart, 'yyyy-MM-dd')}_${format(weekEnd, 'yyyy-MM-dd')}`;
      
      // Skip if this week is already being processed
      if (isWeekBeingProcessed(normalizedWeekKey)) {
        return;
      }
      
      // Mark this week as being processed
      processingWeekIds.current.add(normalizedWeekKey);
      
      // Check if there are any trades for this week
      getTradesForWeek(weekStart, weekEnd)
        .then(weekTrades => {
          if (!isMounted.current) return;
          
          if (weekTrades.length > 0) {
            // Calculate metrics for the trades
            const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
            const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
            
            // Create a placeholder reflection with trade info
            const weekId = format(weekStart, 'yyyy-MM-dd');
            const placeholderReflection: WeeklyReflection = {
              id: weekId,
              date: weekStart.toISOString(),
              weekId: weekId,
              weekStart: weekStart.toISOString(),
              weekEnd: weekEnd.toISOString(),
              reflection: '',
              weeklyPlan: '',
              grade: '',
              tradeIds: weekTrades.map(trade => trade.id),
              isPlaceholder: true,
              totalPnL,
              totalR
            };
            
            // Add the download button
            const reflectionWithButton = {
              ...placeholderReflection,
              actions: (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadReport(placeholderReflection);
                  }}
                  title="Download weekly report as PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )
            };
            
            // Check if this week already exists in our array
            setReflections(prev => {
              const existingIndex = prev.findIndex(r => 
                r.weekId === placeholderReflection.weekId || 
                (r.weekStart === placeholderReflection.weekStart && r.weekEnd === placeholderReflection.weekEnd));
                
              if (existingIndex >= 0) {
                return prev; // Don't add duplicate
              }
              
              // Add new entry and sort
              const newReflections = [...prev, reflectionWithButton];
              return newReflections.sort((a, b) => {
                if (!a.weekStart || !b.weekStart) return 0;
                return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
              });
            });
          }
        })
        .catch(error => {
          console.error("Error adding placeholder week:", error);
        })
        .finally(() => {
          // Remove from processing set when done
          processingWeekIds.current.delete(normalizedWeekKey);
        });
    };
    
    // Only run once on initial mount
    const generatePlaceholderWeeks = () => {
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      let currentDate = startOfWeek(start, { weekStartsOn: 1 });
      
      // Generate one week at a time with small delay to prevent overloading
      const processNextWeek = () => {
        if (!isMounted.current || currentDate > today) return;
        
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        
        addWeekWithTradesIfMissing(weekStart, weekEnd);
        
        // Move to next week
        currentDate = addWeeks(currentDate, 1);
        
        // Process next week with a small delay
        setTimeout(processNextWeek, 50);
      };
      
      // Start processing
      processNextWeek();
    };
    
    // Delay the generation of placeholder weeks slightly to let the main UI render first
    const timerId = setTimeout(generatePlaceholderWeeks, 500);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [handleDownloadReport]);
  
  // Set up event listeners for storage updates
  useEffect(() => {
    // Update handler function
    const handleStorageUpdate = () => {
      if (!isMounted.current) return;
      
      console.log("Journal update detected - refreshing reflections list");
      
      // Get the latest reflections from storage
      const existingReflections = getAllWeeklyReflections();
      
      if (!existingReflections || typeof existingReflections !== 'object') {
        return;
      }
      
      // Update existing reflections with new data
      setReflections(prev => {
        const updatedReflections = [...prev];
        let hasChanges = false;
        
        // Update existing reflections with new data
        Object.values(existingReflections).forEach(reflection => {
          if (reflection && typeof reflection === 'object' && 'id' in reflection) {
            const reflectionObj = reflection as WeeklyReflection;
            
            if (!reflectionObj.weekId) return;
            
            // Check if this reflection already exists in our array
            const existingIndex = updatedReflections.findIndex(r => r.weekId === reflectionObj.weekId);
            
            if (existingIndex >= 0) {
              // Check if this reflection is newer
              if (reflectionObj.lastUpdated && updatedReflections[existingIndex].lastUpdated &&
                  new Date(reflectionObj.lastUpdated) > new Date(updatedReflections[existingIndex].lastUpdated)) {
                
                // Update with the newer reflection data but keep the actions
                updatedReflections[existingIndex] = {
                  ...reflectionObj,
                  actions: updatedReflections[existingIndex].actions
                };
                hasChanges = true;
              }
            } else {
              // Add new reflection with download button
              updatedReflections.push({
                ...reflectionObj,
                actions: (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadReport(reflectionObj);
                    }}
                    title="Download weekly report as PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )
              });
              hasChanges = true;
            }
          }
        });
        
        // Only trigger re-render if changes were found
        if (hasChanges) {
          // Sort by date (most recent first)
          return updatedReflections.sort((a, b) => {
            if (!a.weekStart || !b.weekStart) return 0;
            return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
          });
        }
        
        return prev;
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
      // Correctly determine if the reflection has content
      hasContent: !!(reflection.reflection || reflection.weeklyPlan) && !reflection.isPlaceholder
    };
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading reflections...</p>
        </div>
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
