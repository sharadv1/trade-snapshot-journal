
import React, { useEffect, useState } from 'react';
import { ReflectionsList } from './ReflectionsList';
import { WeeklyReflection } from '@/types';
import { 
  getAllWeeklyReflections, 
  weeklyReflectionExists,
  getWeeklyReflection
} from '@/utils/journalStorage';
import { startOfWeek, endOfWeek, addWeeks, format, parseISO, isBefore, isEqual, isWithinInterval } from 'date-fns';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  
  useEffect(() => {
    // Generate all weeks from start of 2025
    const generateAllWeeks = () => {
      console.log("Generating weeks list for WeeklyReflectionsPage");
      const weekMap = new Map<string, WeeklyReflection>(); // Use a map to prevent duplicates
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      
      // First, collect all existing reflections from storage (already saved by user)
      const existingReflections = getAllWeeklyReflections();
      const allTrades = getTradesWithMetrics();
      
      // Map to track weeks by their actual date range to prevent duplicates of the same week
      const weeksByRange = new Map<string, WeeklyReflection>();
      
      // First pass: Process all existing reflections
      Object.values(existingReflections).forEach(reflection => {
        if (reflection && typeof reflection === 'object' && 'id' in reflection) {
          const reflectionObj = reflection as WeeklyReflection;
          
          // Skip reflections without proper ID
          if (!reflectionObj.weekId) return;
          
          // Generate a normalized week key that represents the actual week range
          // This helps identify duplicates regardless of their stored ID
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
          
          // Calculate metrics for this reflection
          const weekTrades = allTrades.filter(trade => {
            if (trade.exitDate && reflectionObj.weekStart && reflectionObj.weekEnd) {
              const exitDate = new Date(trade.exitDate);
              const weekStart = new Date(reflectionObj.weekStart);
              const weekEnd = new Date(reflectionObj.weekEnd);
              return exitDate >= weekStart && exitDate <= weekEnd;
            }
            return false;
          });
          
          const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
          const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);

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
              weekId: reflectionObj.weekId,
              totalPnL,
              totalR,
              tradeIds: weekTrades.map(trade => trade.id),
              // Make sure we properly identify non-placeholder reflections
              isPlaceholder: isPlaceholder
            });
            
            console.log(`Selected reflection for week ${normalizedWeekKey}:`, reflectionObj.weekId);
          } else {
            console.log(`Skipping duplicate reflection for week ${normalizedWeekKey}:`, reflectionObj.weekId);
          }
        }
      });
      
      // Second pass: Generate placeholder reflections ONLY for weeks with trades that don't already have reflections
      let currentDate = startOfWeek(start, { weekStartsOn: 1 });
      
      while (currentDate <= today) {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        const normalizedWeekKey = `${format(weekStart, 'yyyy-MM-dd')}_${format(weekEnd, 'yyyy-MM-dd')}`;
        const weekId = format(weekStart, 'yyyy-MM-dd');
        
        // Only add a placeholder if this week doesn't already exist in our map
        if (!weeksByRange.has(normalizedWeekKey)) {
          // Check if there are any trades for this week
          const weekTrades = allTrades.filter(trade => {
            if (trade.exitDate) {
              const exitDate = new Date(trade.exitDate);
              return exitDate >= weekStart && exitDate <= weekEnd;
            }
            return false;
          });
          
          // Only create a placeholder if there are trades for this week
          if (weekTrades.length > 0) {
            const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
            const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
            
            // Create a placeholder reflection with trade info
            weeksByRange.set(normalizedWeekKey, {
              id: weekId,
              weekId: weekId,
              weekStart: weekStart.toISOString(),
              weekEnd: weekEnd.toISOString(),
              reflection: '',
              weeklyPlan: '',
              grade: '',
              tradeIds: weekTrades.map(trade => trade.id),
              isPlaceholder: true, // Explicitly mark as placeholder
              totalPnL,
              totalR
            });
            
            console.log(`Created placeholder for week with trades: ${normalizedWeekKey}`);
          }
        }
        
        currentDate = addWeeks(currentDate, 1);
      }
      
      // Convert map to array and sort by date (most recent first)
      const uniqueReflections = Array.from(weeksByRange.values()).sort((a, b) => {
        if (!a.weekStart || !b.weekStart) return 0;
        return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      });
      
      console.log(`Generated ${uniqueReflections.length} unique weekly reflections`);
      return uniqueReflections;
    };
    
    const allWeeks = generateAllWeeks();
    setReflections(allWeeks);
    
    // Listen for updates to reflections
    const handleUpdate = () => {
      const updatedWeeks = generateAllWeeks();
      setReflections(updatedWeeks);
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
  }, []);
  
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
      <ReflectionsList 
        reflections={reflections}
        type="weekly"
        getStats={getWeeklyStats}
      />
    </div>
  );
}
