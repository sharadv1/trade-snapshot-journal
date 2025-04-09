
import { 
  getWeeklyReflection, 
  saveWeeklyReflection, 
  getMonthlyReflection, 
  saveMonthlyReflection 
} from './journalStorage';
import { getTradesWithMetrics } from './storage/tradeOperations';
import { TradeWithMetrics } from '@/types';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  format,
  addWeeks,
  addMonths,
  isWithinInterval
} from 'date-fns';

// Function to generate missing weekly reflections
export const generateMissingReflections = (trades: TradeWithMetrics[]) => {
  const today = new Date();
  let currentDate = new Date(2025, 0, 1); // Start from January 1, 2025
  
  while (currentDate <= today) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekId = format(weekStart, 'yyyy-MM-dd');
    
    // Check if a reflection already exists for this week
    const existingReflection = getWeeklyReflection(weekId);
    
    if (!existingReflection) {
      // Filter trades for the current week
      const weekTrades = trades.filter(trade => {
        if (trade.exitDate) {
          const exitDate = new Date(trade.exitDate);
          return isWithinInterval(exitDate, { start: weekStart, end: weekEnd });
        }
        return false;
      });
      
      // Only generate a reflection if there are trades for this week
      if (weekTrades.length > 0) {
        // Generate a reflection for the week
        const newReflection = generateWeeklyReflection(weekId, weekStart, weekEnd, weekTrades);
        
        // Save the new reflection
        saveWeeklyReflection(weekId, newReflection.reflection, newReflection.grade, newReflection.weeklyPlan);
        
        console.log(`Generated and saved weekly reflection for ${weekId} with ${weekTrades.length} trades`);
      }
    }
    
    currentDate = addWeeks(currentDate, 1);
  }
  
  // Generate missing monthly reflections
  currentDate = new Date(2025, 0, 1); // Reset to January 1, 2025
  
  while (currentDate <= today) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthId = format(monthStart, 'yyyy-MM');
    
    // Check if a reflection already exists for this month
    const existingReflection = getMonthlyReflection(monthId);
    
    if (!existingReflection) {
      // Filter trades for the current month
      const monthTrades = trades.filter(trade => {
        if (trade.exitDate) {
          const exitDate = new Date(trade.exitDate);
          return isWithinInterval(exitDate, { start: monthStart, end: monthEnd });
        }
        return false;
      });
      
      // Only generate a reflection if there are trades for this month
      if (monthTrades.length > 0) {
        // Generate a reflection for the month
        const newReflection = generateMonthlyReflection(monthId, monthStart, monthEnd, monthTrades);
        
        // Save the new reflection
        saveMonthlyReflection(monthId, newReflection.reflection, newReflection.grade);
        
        console.log(`Generated and saved monthly reflection for ${monthId} with ${monthTrades.length} trades`);
      }
    }
    
    currentDate = addMonths(currentDate, 1);
  }
};

function generateWeeklyReflection(weekId: string, weekStart: Date, weekEnd: Date, trades: TradeWithMetrics[]) {
  let reflection = '';
  let weeklyPlan = '';
  let grade = '';
  let tradeIds: string[] = [];
  let totalPnL = 0;
  let totalR = 0;
  
  if (trades.length > 0) {
    reflection = `This week I took ${trades.length} trades. `;
    weeklyPlan = 'My plan for next week is to focus on...';
    grade = 'B';
    
    tradeIds = trades.map(trade => trade.id);
    totalPnL = trades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
    // Use rMultiple for R value calculation instead of riskRewardRatio
    totalR = trades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
  } else {
    reflection = 'No trades were taken this week.';
    weeklyPlan = 'My plan for next week is to focus on...';
    grade = 'A';
  }

  return {
    id: weekId,
    weekId,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    reflection,
    weeklyPlan,
    grade,
    tradeIds,
    totalPnL,
    totalR
  };
}

function generateMonthlyReflection(monthId: string, monthStart: Date, monthEnd: Date, trades: TradeWithMetrics[]) {
  let reflection = '';
  let grade = '';
  let tradeIds: string[] = [];
  let totalPnL = 0;
  let totalR = 0;
  
  if (trades.length > 0) {
    reflection = `This month I took ${trades.length} trades. `;
    grade = 'B';
    
    tradeIds = trades.map(trade => trade.id);
    totalPnL = trades.reduce((sum, trade) => sum + (trade.metrics.profitLoss || 0), 0);
    // Use rMultiple for R value calculation instead of riskRewardRatio
    totalR = trades.reduce((sum, trade) => sum + (trade.metrics.rMultiple || 0), 0);
  } else {
    reflection = 'No trades were taken this month.';
    grade = 'A';
  }

  return {
    id: monthId,
    monthId,
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    reflection,
    grade,
    tradeIds,
    totalPnL,
    totalR
  };
}
