import React, { useEffect, useState, useCallback } from 'react';
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

  // Load reflections once on component mount
  useEffect(() => {
    setIsLoading(true);
    
    // Generate all weeks from start of 2025
    const generateAllWeeks = () => {
      console.log("Generating weeks list for WeeklyReflectionsPage");
      
      // Map to track weeks by their actual date range to prevent duplicates of the same week
      const weeksByRange = new Map<string, WeeklyReflection>();
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      
      try {
        // First, collect all existing reflections from storage (already saved by user)
        const existingReflections = getAllWeeklyReflections();
        
        // Ensure existingReflections is an object
        if (!existingReflections || typeof existingReflections !== 'object') {
          console.error('Expected object of reflections but got:', typeof existingReflections);
          setIsLoading(false);
          return [];
        }
        
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
        
        // Second pass: Look for weeks with trades that don't have reflections yet
        let currentDate = startOfWeek(start, { weekStartsOn: 1 });
        
        while (currentDate <= today) {
          const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
          const normalizedWeekKey = `${format(weekStart, 'yyyy-MM-dd')}_${format(weekEnd, 'yyyy-MM-dd')}`;
          const weekId = format(weekStart, 'yyyy-MM-dd');
          
          // Only add a placeholder if this week doesn't already exist in our map
          if (!weeksByRange.has(normalizedWeekKey)) {
            // Check if there are any trades for this week
            getTradesForWeek(weekStart, weekEnd)
              .then(weekTrades => {
                if (weekTrades.length > 0) {
                  // Calculate metrics for the trades
                  const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
                  const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
                  
                  // Create placeholder only if we don't already have one for this week
                  if (!weeksByRange.has(normalizedWeekKey)) {
                    // Create a placeholder reflection with trade info
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
                      totalR,
                      actions: (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadReport({
                              id: weekId,
                              date: weekStart.toISOString(),
                              weekId: weekId,
                              weekStart: weekStart.toISOString(),
                              weekEnd: weekEnd.toISOString(),
                              reflection: '',
                              weeklyPlan: '',
                              tradeIds: weekTrades.map(trade => trade.id),
                              totalPnL,
                              totalR
                            });
                          }}
                          title="Download weekly report as PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )
                    };
                    
                    setReflections(prev => {
                      const newReflections = [...prev];
                      
                      // Check if this week already exists in our array
                      const existingIndex = newReflections.findIndex(r => 
                        r.weekId === placeholderReflection.weekId);
                        
                      if (existingIndex >= 0) {
                        // Update existing entry
                        newReflections[existingIndex] = placeholderReflection;
                      } else {
                        // Add new entry
                        newReflections.push(placeholderReflection);
                      }
                      
                      // Sort by date (most recent first)
                      return newReflections.sort((a, b) => {
                        if (!a.weekStart || !b.weekStart) return 0;
                        return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
                      });
                    });
                  }
                }
              })
              .catch(error => {
                console.error("Error fetching trades for placeholder generation:", error);
              });
          }
          
          currentDate = addWeeks(currentDate, 1);
        }
        
        // Convert map to array and sort by date (most recent first)
        const uniqueReflections = Array.from(weeksByRange.values()).sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
        });
        
        console.log(`Generated ${uniqueReflections.length} unique weekly reflections`);
        
        // Add download buttons to reflections
        const reflectionsWithDownload = uniqueReflections.map(reflection => ({
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
        
        return reflectionsWithDownload;
      } catch (error) {
        console.error("Error generating weeks:", error);
        return [];
      }
    };
    
    const initialReflections = generateAllWeeks();
    setReflections(initialReflections);
    setIsLoading(false);
    
  }, [handleDownloadReport]);
  
  // Set up event listeners for storage updates - in a separate effect to avoid re-running initial load
  useEffect(() => {
    // Update handler function
    const handleStorageUpdate = () => {
      console.log("Journal update detected - refreshing reflections list");
      setReflections(prev => {
        // Fetch the latest reflections from storage
        const existingReflections = getAllWeeklyReflections();
        
        if (!existingReflections || typeof existingReflections !== 'object') {
          return prev;
        }
        
        // Process reflections
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
