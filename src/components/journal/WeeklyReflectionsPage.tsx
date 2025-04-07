
import React, { useEffect, useState } from 'react';
import { ReflectionsList } from './ReflectionsList';
import { WeeklyReflection } from '@/types';
import { 
  getAllWeeklyReflections, 
  weeklyReflectionExists,
  getWeeklyReflection
} from '@/utils/journalStorage';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';

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
          allWeeks.push(existingReflection);
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
            isPlaceholder: true
          });
        }
        
        currentDate = addWeeks(currentDate, 1);
      }
      
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
    return () => {
      window.removeEventListener('journal-updated', handleUpdate);
    };
  }, []);
  
  // Get stats function for weekly reflections
  const getWeeklyStats = (reflection: WeeklyReflection) => {
    // Calculate stats based on tradeIds
    const tradeIds = reflection.tradeIds || [];
    return {
      pnl: reflection.totalPnL || 0,
      rValue: reflection.totalR || 0,
      tradeCount: tradeIds.length,
      hasContent: !!reflection.reflection || !!reflection.weeklyPlan
    };
  };
  
  return (
    <div className="w-full max-w-full">
      <ReflectionsList 
        reflections={reflections}
        type="weekly"
        getStats={getWeeklyStats}
      />
    </div>
  );
}
