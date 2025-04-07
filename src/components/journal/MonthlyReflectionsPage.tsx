
import React, { useEffect, useState } from 'react';
import { ReflectionsList } from './ReflectionsList';
import { MonthlyReflection } from '@/types';
import { 
  getAllMonthlyReflections,
  getMonthlyReflection 
} from '@/utils/journalStorage';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';

export function MonthlyReflectionsPage() {
  const [reflections, setReflections] = useState<MonthlyReflection[]>([]);
  
  useEffect(() => {
    // Generate all months from start of 2025
    const generateAllMonths = () => {
      const allMonths: MonthlyReflection[] = [];
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      
      let currentDate = startOfMonth(start);
      
      while (currentDate <= today) {
        const monthId = format(currentDate, 'yyyy-MM');
        const monthEnd = endOfMonth(currentDate);
        
        // Check if a reflection already exists for this month
        const existingReflection = getMonthlyReflection(monthId);
        
        if (existingReflection) {
          allMonths.push(existingReflection);
        } else {
          // Create a placeholder reflection
          allMonths.push({
            id: monthId,
            monthId: monthId,
            monthStart: currentDate.toISOString(),
            monthEnd: monthEnd.toISOString(),
            reflection: '',
            grade: '',
            tradeIds: [],
            isPlaceholder: true
          });
        }
        
        currentDate = addMonths(currentDate, 1);
      }
      
      return allMonths.sort((a, b) => {
        // Sort by month start date (most recent first)
        if (!a.monthStart || !b.monthStart) return 0;
        return new Date(b.monthStart).getTime() - new Date(a.monthStart).getTime();
      });
    };
    
    const allMonths = generateAllMonths();
    setReflections(allMonths);
    
    // Listen for updates to reflections
    const handleUpdate = () => {
      const updatedMonths = generateAllMonths();
      setReflections(updatedMonths);
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
      tradeCount: tradeIds.length,
      hasContent: !!reflection.reflection
    };
  };
  
  return (
    <div className="w-full container mx-auto">
      <ReflectionsList 
        reflections={reflections}
        type="monthly"
        getStats={getMonthlyStats}
      />
    </div>
  );
}
