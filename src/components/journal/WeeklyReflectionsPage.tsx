
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
      const weekMap = new Map<string, WeeklyReflection>(); // Use a map to prevent duplicates
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      
      // First, collect all existing reflections from storage
      const existingReflections = getAllWeeklyReflections();
      
      Object.values(existingReflections).forEach(reflection => {
        if (reflection && typeof reflection === 'object' && 'id' in reflection) {
          const reflectionObj = reflection as WeeklyReflection;
          
          // Skip placeholders or empty reflections
          if (!reflectionObj.weekId) return;
          
          // Calculate metrics for this reflection
          const weekTrades = getTradesWithMetrics().filter(trade => {
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
          
          // Add to map with enriched data - this prevents duplicates by weekId
          weekMap.set(reflectionObj.weekId, {
            ...reflectionObj,
            totalPnL,
            totalR,
            tradeIds: weekTrades.map(trade => trade.id),
            // Make sure we properly identify non-placeholder reflections
            isPlaceholder: false
          });
        }
      });
      
      // Then, generate placeholder reflections for weeks that don't exist yet
      let currentDate = startOfWeek(start, { weekStartsOn: 1 });
      
      while (currentDate <= today) {
        const weekId = format(currentDate, 'yyyy-MM-dd');
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        
        // Only add a placeholder if this week doesn't already exist in our map
        if (!weekMap.has(weekId)) {
          // Check if there are any trades for this week
          const weekTrades = getTradesWithMetrics().filter(trade => {
            if (trade.exitDate) {
              const exitDate = new Date(trade.exitDate);
              return exitDate >= currentDate && exitDate <= weekEnd;
            }
            return false;
          });
          
          const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
          const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
          
          // Create a placeholder reflection with trade info
          weekMap.set(weekId, {
            id: weekId,
            weekId: weekId,
            weekStart: currentDate.toISOString(),
            weekEnd: weekEnd.toISOString(),
            reflection: '',
            weeklyPlan: '',
            grade: '',
            tradeIds: weekTrades.map(trade => trade.id),
            isPlaceholder: true, // Explicitly mark as placeholder
            totalPnL,
            totalR
          });
        }
        
        currentDate = addWeeks(currentDate, 1);
      }
      
      // Convert map to array and sort by date (most recent first)
      return Array.from(weekMap.values()).sort((a, b) => {
        if (!a.weekStart || !b.weekStart) return 0;
        return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      });
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
    
    return () => {
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
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
