
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
      const monthMap = new Map<string, MonthlyReflection>(); // Use a map to prevent duplicates
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      const allTrades = getTradesWithMetrics();
      
      // First, collect all existing reflections from storage
      const existingReflections = getAllMonthlyReflections();
      
      Object.values(existingReflections).forEach(reflection => {
        if (reflection && typeof reflection === 'object' && 'id' in reflection) {
          const reflectionObj = reflection as MonthlyReflection;
          
          // Skip placeholders or empty reflections
          if (!reflectionObj.monthId) return;
          
          // Calculate metrics for this reflection
          const monthTrades = allTrades.filter(trade => {
            if (trade.exitDate && reflectionObj.monthStart && reflectionObj.monthEnd) {
              const exitDate = new Date(trade.exitDate);
              const monthStart = new Date(reflectionObj.monthStart);
              const monthEndDate = new Date(reflectionObj.monthEnd);
              return exitDate >= monthStart && exitDate <= monthEndDate;
            }
            return false;
          });
          
          // Calculate metrics using pre-calculated trade metrics
          const totalPnL = monthTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
          const totalR = monthTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
          
          // Include additional metrics in the reflection object
          monthMap.set(reflectionObj.monthId, {
            ...reflectionObj,
            totalPnL,
            totalR,
            tradeIds: monthTrades.map(trade => trade.id),
            isPlaceholder: false
          });
        }
      });
      
      // Then, generate placeholder reflections ONLY for months with trades that don't have reflections yet
      let currentDate = startOfMonth(start);
      
      while (currentDate <= today) {
        const monthId = format(currentDate, 'yyyy-MM');
        const monthEnd = endOfMonth(currentDate);
        
        // Only add a placeholder if this month doesn't already exist in our map
        if (!monthMap.has(monthId)) {
          // Check if there are any trades for this month
          const monthTrades = allTrades.filter(trade => {
            if (trade.exitDate) {
              const exitDate = new Date(trade.exitDate);
              return exitDate >= currentDate && exitDate <= monthEnd;
            }
            return false;
          });
          
          // Only create a placeholder if there are trades for this month
          if (monthTrades.length > 0) {
            const totalPnL = monthTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
            const totalR = monthTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
            
            // Create a placeholder reflection with trade info
            monthMap.set(monthId, {
              id: monthId,
              monthId: monthId,
              monthStart: currentDate.toISOString(),
              monthEnd: monthEnd.toISOString(),
              reflection: '',
              grade: '',
              tradeIds: monthTrades.map(trade => trade.id),
              isPlaceholder: true,
              totalPnL,
              totalR
            });
          }
        }
        
        currentDate = addMonths(currentDate, 1);
      }
      
      // Convert map to array and sort by date (most recent first)
      return Array.from(monthMap.values()).sort((a, b) => {
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
      // Correctly determine if the reflection has content
      hasContent: !!reflection.reflection && !reflection.isPlaceholder
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
