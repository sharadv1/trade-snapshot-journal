
import React, { useEffect, useState } from 'react';
import { ReflectionsList } from './ReflectionsList';
import { MonthlyReflection } from '@/types';
import { 
  getAllMonthlyReflections, 
  monthlyReflectionExists,
  getMonthlyReflection
} from '@/utils/journalStorage';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';

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
          // Pre-calculate metrics for existing reflection
          const monthTrades = getTradesWithMetrics().filter(trade => {
            if (trade.exitDate) {
              const exitDate = new Date(trade.exitDate);
              const monthStart = new Date(existingReflection.monthStart);
              const monthEndDate = new Date(existingReflection.monthEnd);
              return exitDate >= monthStart && exitDate <= monthEndDate;
            }
            return false;
          });
          
          // Calculate metrics based on actual trade metrics
          const totalPnL = monthTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
          const totalR = monthTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
          
          // Include additional metrics in the reflection object
          allMonths.push({
            ...existingReflection,
            totalPnL,
            totalR,
            tradeIds: monthTrades.map(trade => trade.id)
          });
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
            isPlaceholder: true,
            totalPnL: 0,
            totalR: 0
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
    window.addEventListener('journalUpdated', handleUpdate);
    window.addEventListener('trades-updated', handleUpdate);
    
    return () => {
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
    };
  }, []);
  
  // Get stats function for monthly reflections
  const getMonthlyStats = (reflection: MonthlyReflection) => {
    return {
      pnl: reflection.totalPnL || 0,
      rValue: reflection.totalR || 0,
      tradeCount: reflection.tradeIds?.length || 0,
      hasContent: !!reflection.reflection
    };
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto">
      <ReflectionsList 
        reflections={reflections}
        type="monthly"
        getStats={getMonthlyStats}
      />
    </div>
  );
}
