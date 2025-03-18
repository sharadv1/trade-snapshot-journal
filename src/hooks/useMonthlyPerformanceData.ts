
import { useMemo } from 'react';
import { format } from 'date-fns';
import { TradeWithMetrics } from '@/types';

interface CategoryData {
  totalDollarValue: number;
  totalR: number;
  count: number;
}

export interface MonthPerformanceData {
  month: string;
  rawMonth: Date;
  monthlyTotal: CategoryData;
  [key: string]: any;
}

export interface Category {
  id: string;
  name: string;
  type: 'strategy' | 'instrument';
}

export interface MonthlyPerformanceData {
  monthlyData: MonthPerformanceData[];
  categories: Category[];
  activeCategories: Category[];
  totals: CategoryData;
}

export function useMonthlyPerformanceData(trades: TradeWithMetrics[]): MonthlyPerformanceData {
  return useMemo(() => {
    // Get unique months from trades
    const months = new Map<string, Date>();
    
    // Get unique categories (strategies and instruments)
    const uniqueStrategies = new Set<string>();
    const uniqueInstruments = new Set<string>();
    
    // Process all trades
    trades.forEach(trade => {
      // Get month and year from entry date
      const entryDate = new Date(trade.entryDate);
      const monthYear = format(entryDate, 'MMM yyyy');
      
      // Store the month
      if (!months.has(monthYear)) {
        months.set(monthYear, entryDate);
      }
      
      // Add strategy and instrument type
      if (trade.strategy) {
        uniqueStrategies.add(trade.strategy);
      }
      uniqueInstruments.add(trade.type);
    });
    
    // Convert months to array and sort chronologically
    const sortedMonths = Array.from(months.entries())
      .sort((a, b) => a[1].getTime() - b[1].getTime())
      .map(([monthYear, date]) => ({ 
        month: monthYear, 
        rawMonth: date 
      }));
    
    // Create categories for both strategies and instruments
    const strategyCategories = Array.from(uniqueStrategies).map(strategy => ({
      id: `strategy-${strategy}`,
      name: strategy,
      type: 'strategy' as const
    }));
    
    const instrumentCategories = Array.from(uniqueInstruments).map(instrument => ({
      id: `instrument-${instrument}`,
      name: instrument,
      type: 'instrument' as const
    }));
    
    // Combine all categories
    const allCategories = [
      ...strategyCategories,
      ...instrumentCategories
    ];
    
    // Fix: Create a direct mapping of monthly data for debugging and validation
    const monthlyDataMap = new Map();
    
    // Calculate performance metrics for each month and category
    const monthlyPerformance = sortedMonths.map(({ month, rawMonth }) => {
      const monthData: MonthPerformanceData = { month, rawMonth };
      
      // Monthly totals for all categories combined - only tracking instruments
      let monthlyDollarTotal = 0;
      let monthlyRTotal = 0;
      let monthlyTradeCount = 0;
      
      // For each category, calculate metrics
      allCategories.forEach(category => {
        const monthStart = new Date(rawMonth.getFullYear(), rawMonth.getMonth(), 1);
        const monthEnd = new Date(rawMonth.getFullYear(), rawMonth.getMonth() + 1, 0);
        
        // Filter trades that are in this month and belong to this category
        let tradesInCategory;
        
        if (category.type === 'strategy') {
          tradesInCategory = trades.filter(trade => {
            const tradeDate = new Date(trade.entryDate);
            const isInMonth = tradeDate >= monthStart && tradeDate <= monthEnd;
            return isInMonth && trade.strategy === category.name;
          });
        } else {
          tradesInCategory = trades.filter(trade => {
            const tradeDate = new Date(trade.entryDate);
            const isInMonth = tradeDate >= monthStart && tradeDate <= monthEnd;
            return isInMonth && trade.type === category.name;
          });
        }
        
        if (tradesInCategory.length > 0) {
          // Calculate total dollar value (sum of all profit/loss)
          const totalDollarValue = tradesInCategory.reduce(
            (sum, trade) => sum + (trade.metrics?.profitLoss || 0), 
            0
          );
          
          // Fix: Calculate total R value directly from closed trades
          let totalR = 0;
          tradesInCategory.forEach(trade => {
            if (trade.status === 'closed' && trade.metrics && trade.metrics.riskRewardRatio) {
              totalR += trade.metrics.riskRewardRatio;
            }
          });
          
          // Store metrics in month data
          monthData[category.id] = {
            totalDollarValue,
            totalR: parseFloat(totalR.toFixed(2)),
            count: tradesInCategory.length
          };
          
          // Only add to monthly totals for instrument categories
          if (category.type === 'instrument') {
            monthlyDollarTotal += totalDollarValue;
            monthlyRTotal += totalR;
            monthlyTradeCount += tradesInCategory.length;
          }
        } else {
          monthData[category.id] = { 
            totalDollarValue: 0, 
            totalR: 0, 
            count: 0 
          };
        }
      });
      
      // Add monthly total for all categories
      monthData.monthlyTotal = {
        totalDollarValue: monthlyDollarTotal,
        totalR: parseFloat(monthlyRTotal.toFixed(2)),
        count: monthlyTradeCount
      };
      
      // Fix: Store monthly data in map for validation
      monthlyDataMap.set(month, {
        dollarTotal: monthlyDollarTotal,
        rTotal: monthlyRTotal,
        tradeCount: monthlyTradeCount
      });
      
      return monthData;
    });
    
    // Debug monthly totals calculation
    console.log('Monthly Performance - Monthly data detailed:', 
      Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
        month,
        dollarTotal: data.dollarTotal,
        rTotal: data.rTotal,
        tradeCount: data.tradeCount
      }))
    );
    
    // Fix: Direct calculation of total R from all trades
    let directTotalR = 0;
    trades.forEach(trade => {
      if (trade.status === 'closed' && trade.metrics && trade.metrics.riskRewardRatio) {
        directTotalR += trade.metrics.riskRewardRatio;
      }
    });
    
    console.log('Monthly Performance - Direct total R from all trades:', directTotalR);
    
    // Filter out empty categories (no trades for any month)
    const activeCategories = allCategories.filter(category => 
      monthlyPerformance.some(month => month[category.id]?.count > 0)
    );
    
    return {
      monthlyData: monthlyPerformance,
      categories: allCategories,
      activeCategories: activeCategories,
      totals: {
        totalDollarValue: calculateTotalDollarValue(trades),
        // Fix: Use direct calculation for total R to avoid any accumulation errors
        totalR: parseFloat(directTotalR.toFixed(2)),
        count: calculateTotalTradeCount(trades)
      }
    };
  }, [trades]);
}

// Helper functions
function calculateTotalDollarValue(trades: TradeWithMetrics[]): number {
  return trades.reduce((total, trade) => {
    return total + (trade.metrics?.profitLoss || 0);
  }, 0);
}

function calculateTotalTradeCount(trades: TradeWithMetrics[]): number {
  return trades.filter(trade => trade.type !== 'strategy').length;
}
