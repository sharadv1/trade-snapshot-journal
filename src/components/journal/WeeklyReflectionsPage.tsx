
import React, { useEffect, useState } from 'react';
import { ReflectionsList } from './ReflectionsList';
import { WeeklyReflection } from '@/types';
import { 
  getAllWeeklyReflections, 
  weeklyReflectionExists,
  getWeeklyReflection
} from '@/utils/journalStorage';
import { startOfWeek, endOfWeek, addWeeks, format, parseISO, isBefore, isEqual } from 'date-fns';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  
  useEffect(() => {
    // Generate all weeks from start of 2025
    const generateAllWeeks = () => {
      const allWeeks: WeeklyReflection[] = [];
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      
      let currentDate = startOfWeek(start, { weekStartsOn: 1 });
      
      while (currentDate <= today) {
        const weekId = format(currentDate, 'yyyy-MM-dd');
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        
        // Check if a reflection already exists for this week
        const existingReflection = getWeeklyReflection(weekId);
        
        if (existingReflection) {
          // Pre-calculate metrics for existing reflection
          const weekTrades = getTradesWithMetrics().filter(trade => {
            if (trade.exitDate) {
              const exitDate = new Date(trade.exitDate);
              const weekStart = new Date(existingReflection.weekStart);
              const weekEndDate = new Date(existingReflection.weekEnd);
              return exitDate >= weekStart && exitDate <= weekEndDate;
            }
            return false;
          });
          
          // Calculate metrics using pre-calculated trade metrics
          const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
          const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
          
          // Include additional metrics in the reflection object
          allWeeks.push({
            ...existingReflection,
            totalPnL,
            totalR,
            tradeIds: weekTrades.map(trade => trade.id)
          });
        } else {
          // Create a placeholder reflection
          allWeeks.push({
            id: weekId,
            weekId: weekId,
            weekStart: currentDate.toISOString(),
            weekEnd: weekEnd.toISOString(),
            reflection: '',
            weeklyPlan: '',
            grade: '',
            tradeIds: [],
            isPlaceholder: true,
            totalPnL: 0,
            totalR: 0
          });
        }
        
        currentDate = addWeeks(currentDate, 1);
      }
      
      // Check for additional reflections that might not be in the date range
      const existingReflections = getAllWeeklyReflections();
      Object.values(existingReflections).forEach(reflection => {
        if (reflection && typeof reflection === 'object' && 'id' in reflection) {
          // Skip reflections that are already in the list
          if (allWeeks.some(w => w.id === reflection.id)) {
            return;
          }
          
          // Add any reflection that has content but wasn't included in the date range
          if ('reflection' in reflection && 'weeklyPlan' in reflection &&
              (reflection.reflection || reflection.weeklyPlan)) {
            // Calculate metrics for this reflection
            const reflectionObj = reflection as WeeklyReflection;
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
            
            allWeeks.push({
              ...reflectionObj,
              totalPnL,
              totalR,
              tradeIds: weekTrades.map(trade => trade.id)
            });
          }
        }
      });
      
      return allWeeks.sort((a, b) => {
        // Sort by week start date (most recent first)
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
      hasContent: !!reflection.reflection || !!reflection.weeklyPlan
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
