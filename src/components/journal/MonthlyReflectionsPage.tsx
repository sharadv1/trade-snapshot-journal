
import React, { useEffect, useState } from 'react';
import { ReflectionsList } from './ReflectionsList';
import { MonthlyReflection } from '@/types';
import { getAllMonthlyReflections } from '@/utils/journalStorage';

export function MonthlyReflectionsPage() {
  const [reflections, setReflections] = useState<MonthlyReflection[]>([]);
  
  useEffect(() => {
    // Load monthly reflections
    const allReflections = getAllMonthlyReflections();
    const reflectionsList = Object.values(allReflections)
      .sort((a, b) => {
        // Sort by month start date (most recent first)
        if (!a.monthStart || !b.monthStart) return 0;
        return new Date(b.monthStart).getTime() - new Date(a.monthStart).getTime();
      });
    
    setReflections(reflectionsList);
    
    // Listen for updates to reflections
    const handleUpdate = () => {
      const updatedReflections = getAllMonthlyReflections();
      const updatedList = Object.values(updatedReflections)
        .sort((a, b) => {
          if (!a.monthStart || !b.monthStart) return 0;
          return new Date(b.monthStart).getTime() - new Date(a.monthStart).getTime();
        });
      setReflections(updatedList);
    };
    
    window.addEventListener('journal-updated', handleUpdate);
    return () => {
      window.removeEventListener('journal-updated', handleUpdate);
    };
  }, []);
  
  // Get stats function for monthly reflections
  const getMonthlyStats = (reflection: MonthlyReflection) => {
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
      type="monthly"
      getStats={getMonthlyStats}
    />
  );
}
