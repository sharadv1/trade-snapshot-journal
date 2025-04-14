
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
      console.log("Generating months list for MonthlyReflectionsPage");
      const start = new Date(2025, 0, 1); // January 1, 2025
      const today = new Date();
      const allTrades = getTradesWithMetrics();
      
      // Map to track months by their actual date range to prevent duplicates
      const monthsByRange = new Map<string, MonthlyReflection>();
      
      // First, collect all existing reflections from storage
      const existingReflections = getAllMonthlyReflections();
      
      // First pass: Process all existing reflections
      Object.values(existingReflections).forEach(reflection => {
        if (reflection && typeof reflection === 'object' && 'id' in reflection) {
          const reflectionObj = reflection as MonthlyReflection;
          
          // Skip placeholders or empty reflections
          if (!reflectionObj.monthId) return;
          
          // Generate a normalized month key that represents the actual month range
          let normalizedMonthKey = "";
          
          if (reflectionObj.monthStart && reflectionObj.monthEnd) {
            const startDate = new Date(reflectionObj.monthStart);
            normalizedMonthKey = format(startDate, 'yyyy-MM');
          } else if (reflectionObj.monthId) {
            // Try to parse the ID as a month
            if (reflectionObj.monthId.match(/^\d{4}-\d{2}$/)) {
              normalizedMonthKey = reflectionObj.monthId;
            } else {
              try {
                const monthDate = new Date(reflectionObj.monthId);
                if (!isNaN(monthDate.getTime())) {
                  normalizedMonthKey = format(monthDate, 'yyyy-MM');
                } else {
                  normalizedMonthKey = reflectionObj.monthId;
                }
              } catch (e) {
                normalizedMonthKey = reflectionObj.monthId;
              }
            }
          }
          
          if (!normalizedMonthKey) {
            console.log(`Skipping reflection due to missing month data:`, reflectionObj);
            return;
          }
          
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
          
          // Check if we already have a reflection for this month
          const existingEntry = monthsByRange.get(normalizedMonthKey);
          
          // If no existing entry or this one is newer (non-placeholder or has content), use this one
          const hasContent = !!reflectionObj.reflection;
          const isPlaceholder = reflectionObj.isPlaceholder === true;
          
          if (!existingEntry || 
              // Prefer entries with content over empty ones
              (hasContent && !existingEntry.reflection) ||
              // Prefer non-placeholder entries
              (!isPlaceholder && existingEntry.isPlaceholder) ||
              // If both have content and same placeholder status, use the one with latest update
              (hasContent && !!existingEntry.reflection && 
               (isPlaceholder === existingEntry.isPlaceholder) && 
               reflectionObj.lastUpdated && existingEntry.lastUpdated && 
               new Date(reflectionObj.lastUpdated) > new Date(existingEntry.lastUpdated))) {
            
            // Include additional metrics in the reflection object
            monthsByRange.set(normalizedMonthKey, {
              ...reflectionObj,
              date: reflectionObj.monthStart || reflectionObj.date || new Date().toISOString(),
              monthId: reflectionObj.monthId,
              totalPnL,
              totalR,
              tradeIds: monthTrades.map(trade => trade.id),
              isPlaceholder: isPlaceholder
            });
            
            console.log(`Selected reflection for month ${normalizedMonthKey}:`, reflectionObj.monthId);
          } else {
            console.log(`Skipping duplicate reflection for month ${normalizedMonthKey}:`, reflectionObj.monthId);
          }
        }
      });
      
      // Second pass: Generate placeholder reflections ONLY for months with trades that don't have reflections yet
      let currentDate = startOfMonth(start);
      
      while (currentDate <= today) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const normalizedMonthKey = format(monthStart, 'yyyy-MM');
        const monthId = normalizedMonthKey;
        
        // Only add a placeholder if this month doesn't already exist in our map
        if (!monthsByRange.has(normalizedMonthKey)) {
          // Check if there are any trades for this month
          const monthTrades = allTrades.filter(trade => {
            if (trade.exitDate) {
              const exitDate = new Date(trade.exitDate);
              return exitDate >= monthStart && exitDate <= monthEnd;
            }
            return false;
          });
          
          // Only create a placeholder if there are trades for this month
          if (monthTrades.length > 0) {
            const totalPnL = monthTrades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
            const totalR = monthTrades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
            
            // Create a placeholder reflection with trade info
            monthsByRange.set(normalizedMonthKey, {
              id: monthId,
              date: monthStart.toISOString(), // Add a date property to avoid TypeScript errors
              monthId: monthId,
              monthStart: monthStart.toISOString(),
              monthEnd: monthEnd.toISOString(),
              reflection: '',
              grade: '',
              tradeIds: monthTrades.map(trade => trade.id),
              isPlaceholder: true,
              totalPnL,
              totalR
            });
            
            console.log(`Created placeholder for month with trades: ${normalizedMonthKey}`);
          }
        }
        
        currentDate = addMonths(currentDate, 1);
      }
      
      // Convert map to array and sort by date (most recent first)
      const uniqueReflections = Array.from(monthsByRange.values()).sort((a, b) => {
        if (!a.monthStart || !b.monthStart) return 0;
        return new Date(b.monthStart).getTime() - new Date(a.monthStart).getTime();
      });
      
      console.log(`Generated ${uniqueReflections.length} unique monthly reflections`);
      return uniqueReflections;
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
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('journal-updated', handleUpdate);
      window.removeEventListener('journalUpdated', handleUpdate);
      window.removeEventListener('trades-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
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
