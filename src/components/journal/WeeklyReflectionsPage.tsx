
import React, { useEffect, useState } from 'react';
import { ReflectionsList } from './ReflectionsList';
import { WeeklyReflection } from '@/types';
import { getAllWeeklyReflections } from '@/utils/journalStorage';

export function WeeklyReflectionsPage() {
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  
  useEffect(() => {
    // Load weekly reflections
    const allReflections = getAllWeeklyReflections();
    const reflectionsList = Object.values(allReflections)
      .sort((a, b) => {
        // Sort by week start date (most recent first)
        if (!a.weekStart || !b.weekStart) return 0;
        return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      });
    
    setReflections(reflectionsList);
    
    // Listen for updates to reflections
    const handleUpdate = () => {
      const updatedReflections = getAllWeeklyReflections();
      const updatedList = Object.values(updatedReflections)
        .sort((a, b) => {
          if (!a.weekStart || !b.weekStart) return 0;
          return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
        });
      setReflections(updatedList);
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
      tradeCount: tradeIds.length
    };
  };
  
  return (
    <ReflectionsList 
      reflections={reflections}
      type="weekly"
      getStats={getWeeklyStats}
    />
  );
}
