
import { 
  getWeeklyReflections, 
  getMonthlyReflections,
  addWeeklyReflection,
  addMonthlyReflection
} from './reflectionStorage';
import { getTradesWithMetrics } from './storage/tradeOperations';
import { TradeWithMetrics, WeeklyReflection, MonthlyReflection } from '@/types';
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
import { generateUUID } from './generateUUID';

// Generation state tracking
const generationState = {
  isGenerating: false,
  lastCompleted: 0,
  error: null as Error | null
};

// Function to generate missing weekly reflections
export const generateMissingReflections = async (trades: TradeWithMetrics[]): Promise<void> => {
  // Prevent concurrent generation
  if (generationState.isGenerating) {
    console.log('Generation already in progress, skipping');
    return;
  }
  
  // Don't regenerate too frequently
  const now = Date.now();
  if (now - generationState.lastCompleted < 15000) {
    console.log('Reflections were recently generated, skipping');
    return;
  }
  
  try {
    generationState.isGenerating = true;
    generationState.error = null;
    console.log('Starting reflection generation process');
    
    const today = new Date();
    let currentDate = new Date(2025, 0, 1); // Start from January 1, 2025
    
    // Get existing reflections
    const existingWeeklyReflections = await getWeeklyReflections();
    const existingMonthlyReflections = await getMonthlyReflections();
    
    // Ensure we have valid arrays
    if (!Array.isArray(existingWeeklyReflections) || !Array.isArray(existingMonthlyReflections)) {
      console.error('Invalid reflection data format, expected arrays');
      throw new Error('Invalid reflection data format');
    }
    
    // Convert to maps for faster lookup
    const weeklyReflectionsMap = new Map();
    const monthlyReflectionsMap = new Map();
    
    existingWeeklyReflections.forEach(reflection => {
      if (reflection && reflection.weekId) {
        weeklyReflectionsMap.set(reflection.weekId, reflection);
      }
    });
    
    existingMonthlyReflections.forEach(reflection => {
      if (reflection && reflection.monthId) {
        monthlyReflectionsMap.set(reflection.monthId, reflection);
      }
    });
    
    // Process weekly and monthly reflections with a limit to prevent hanging
    const generatedWeeklyIds = new Set<string>();
    const generatedMonthlyIds = new Set<string>();
    
    // Process in chunks to prevent UI freezing
    await Promise.all([
      generateWeeklyReflections(currentDate, today, trades, weeklyReflectionsMap, generatedWeeklyIds),
      generateMonthlyReflections(currentDate, today, trades, monthlyReflectionsMap, generatedMonthlyIds)
    ]);
    
    console.log(`Generation complete. Created ${generatedWeeklyIds.size} weekly and ${generatedMonthlyIds.size} monthly reflections.`);
    
    // Notify the app that reflections were generated
    window.dispatchEvent(new CustomEvent('reflections-generated'));
    window.dispatchEvent(new CustomEvent('journal-updated'));
    
    // Update generation state
    generationState.lastCompleted = Date.now();
  } catch (error) {
    console.error('Error in generateMissingReflections:', error);
    generationState.error = error instanceof Error ? error : new Error('Unknown error');
    throw error;
  } finally {
    generationState.isGenerating = false;
  }
};

// Helper function to generate weekly reflections
async function generateWeeklyReflections(
  startDate: Date, 
  endDate: Date, 
  trades: TradeWithMetrics[], 
  existingReflections: Map<string, WeeklyReflection>,
  generatedIds: Set<string>
): Promise<void> {
  let currentDate = new Date(startDate);
  const maxGenerations = 10; // Limit to prevent excessive generation
  let count = 0;
  
  while (currentDate <= endDate && count < maxGenerations) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekId = format(weekStart, 'yyyy-MM-dd');
    
    // Check if a reflection already exists for this week
    if (!existingReflections.has(weekId) && !generatedIds.has(weekId)) {
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
        try {
          // Generate a reflection for the week
          const newReflection = generateWeeklyReflection(weekId, weekStart, weekEnd, weekTrades);
          
          // Save the new reflection
          await addWeeklyReflection(newReflection);
          
          // Mark as processed
          generatedIds.add(weekId);
          count++;
          console.log(`Generated weekly reflection for ${weekId} with ${weekTrades.length} trades`);
        } catch (error) {
          console.error(`Error generating reflection for week ${weekId}:`, error);
          // Continue with other weeks
        }
      }
    }
    
    currentDate = addWeeks(currentDate, 1);
  }
}

// Helper function to generate monthly reflections
async function generateMonthlyReflections(
  startDate: Date, 
  endDate: Date, 
  trades: TradeWithMetrics[], 
  existingReflections: Map<string, MonthlyReflection>,
  generatedIds: Set<string>
): Promise<void> {
  let currentDate = new Date(startDate);
  const maxGenerations = 6; // Limit to prevent excessive generation
  let count = 0;
  
  while (currentDate <= endDate && count < maxGenerations) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthId = format(monthStart, 'yyyy-MM');
    
    // Check if a reflection already exists for this month
    if (!existingReflections.has(monthId) && !generatedIds.has(monthId)) {
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
        try {
          // Generate a reflection for the month
          const newReflection = generateMonthlyReflection(monthId, monthStart, monthEnd, monthTrades);
          
          // Save the new reflection
          await addMonthlyReflection(newReflection);
          
          // Mark as processed
          generatedIds.add(monthId);
          count++;
          console.log(`Generated monthly reflection for ${monthId} with ${monthTrades.length} trades`);
        } catch (error) {
          console.error(`Error generating reflection for month ${monthId}:`, error);
          // Continue with other months
        }
      }
    }
    
    currentDate = addMonths(currentDate, 1);
  }
}

function generateWeeklyReflection(weekId: string, weekStart: Date, weekEnd: Date, trades: TradeWithMetrics[]): WeeklyReflection {
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
    totalPnL = trades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
    totalR = trades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
  } else {
    reflection = 'No trades were taken this week.';
    weeklyPlan = 'My plan for next week is to focus on...';
    grade = 'A';
  }

  return {
    id: generateUUID(),
    weekId,
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    reflection,
    weeklyPlan,
    grade,
    tradeIds,
    totalPnL,
    totalR,
    lastUpdated: new Date().toISOString(),
    isPlaceholder: false
  };
}

function generateMonthlyReflection(monthId: string, monthStart: Date, monthEnd: Date, trades: TradeWithMetrics[]): MonthlyReflection {
  let reflection = '';
  let grade = '';
  let tradeIds: string[] = [];
  let totalPnL = 0;
  let totalR = 0;
  
  if (trades.length > 0) {
    reflection = `This month I took ${trades.length} trades. `;
    grade = 'B';
    
    tradeIds = trades.map(trade => trade.id);
    totalPnL = trades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
    totalR = trades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
  } else {
    reflection = 'No trades were taken this month.';
    grade = 'A';
  }

  return {
    id: generateUUID(),
    monthId,
    monthStart: format(monthStart, 'yyyy-MM-dd'),
    monthEnd: format(monthEnd, 'yyyy-MM-dd'),
    reflection,
    grade,
    tradeIds,
    totalPnL,
    totalR,
    lastUpdated: new Date().toISOString(),
    isPlaceholder: false
  };
}
