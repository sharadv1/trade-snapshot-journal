
import { TradeWithMetrics, WeeklyReflection, MonthlyReflection } from '@/types';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  format,
  isWithinInterval
} from 'date-fns';
import { generateUUID } from '../generateUUID';
import { toast } from '../toast';

// Generation state tracking to prevent multiple simultaneous generations
const generationState = {
  isGenerating: false,
  lastGeneration: 0,
  weekIdsGenerated: new Set<string>(),
  monthIdsGenerated: new Set<string>()
};

/**
 * Generates a weekly reflection for a specific week based on trades
 */
export function generateWeeklyReflection(
  weekStart: Date, 
  weekEnd: Date, 
  trades: TradeWithMetrics[]
): WeeklyReflection {
  const weekId = format(weekStart, 'yyyy-MM-dd');
  
  // Filter trades for this week
  const weekTrades = trades.filter(trade => {
    if (!trade || !trade.exitDate) return false;
    
    try {
      const exitDate = new Date(trade.exitDate);
      return isWithinInterval(exitDate, { start: weekStart, end: weekEnd });
    } catch (error) {
      console.error('Error filtering trade for week:', error);
      return false;
    }
  });
  
  const tradeIds = weekTrades.map(trade => trade.id);
  const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
  const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
  
  // Create basic reflection template
  const reflection = weekTrades.length > 0 
    ? `This week I took ${weekTrades.length} trades.` 
    : 'No trades were taken this week.';
  
  const weeklyPlan = 'My plan for next week is to focus on...';
  const grade = weekTrades.length > 0 ? 'B' : 'A';

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

/**
 * Generates a monthly reflection for a specific month based on trades
 */
export function generateMonthlyReflection(
  monthStart: Date, 
  monthEnd: Date, 
  trades: TradeWithMetrics[]
): MonthlyReflection {
  const monthId = format(monthStart, 'yyyy-MM');
  
  // Filter trades for this month
  const monthTrades = trades.filter(trade => {
    if (!trade || !trade.exitDate) return false;
    
    try {
      const exitDate = new Date(trade.exitDate);
      return isWithinInterval(exitDate, { start: monthStart, end: monthEnd });
    } catch (error) {
      console.error('Error filtering trade for month:', error);
      return false;
    }
  });
  
  const tradeIds = monthTrades.map(trade => trade.id);
  const totalPnL = monthTrades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
  const totalR = monthTrades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
  
  // Create basic reflection template
  const reflection = monthTrades.length > 0 
    ? `This month I took ${monthTrades.length} trades.` 
    : 'No trades were taken this month.';
  
  const grade = monthTrades.length > 0 ? 'B' : 'A';

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

/**
 * Creates missing reflections for weeks and months with trades
 * Optimized to prevent multiple simultaneous generations
 */
export async function generateMissingReflections(trades: TradeWithMetrics[]): Promise<void> {
  // Prevent multiple simultaneous generations
  if (generationState.isGenerating) {
    console.log('Generation already in progress, skipping');
    return;
  }
  
  // Throttle generation to once per 30 seconds
  const now = Date.now();
  if (now - generationState.lastGeneration < 30000) {
    console.log('Generation attempted too recently, skipping');
    return;
  }
  
  generationState.isGenerating = true;
  generationState.lastGeneration = now;
  
  try {
    if (!trades || trades.length === 0) {
      console.log('No trades found, skipping reflection generation');
      return;
    }
    
    console.log(`Starting reflection generation for ${trades.length} trades`);
    
    // Import the storage functions asynchronously to avoid circular dependencies
    const { saveWeeklyReflectionObject, saveMonthlyReflectionObject } = await import('../journal/reflectionStorage');
    const { getWeeklyReflection, getMonthlyReflection } = await import('../journal/reflectionStorage');
    
    // Process trades in batches to prevent UI freezing
    await processTradesInBatches(trades, async (tradeBatch) => {
      // Extract unique weeks from trades
      const weekStartDates = new Set<string>();
      const monthStartDates = new Set<string>();
      
      tradeBatch.forEach(trade => {
        if (trade.exitDate) {
          try {
            const exitDate = new Date(trade.exitDate);
            
            // Get week
            const weekStart = startOfWeek(exitDate, { weekStartsOn: 1 });
            const weekId = format(weekStart, 'yyyy-MM-dd');
            if (!generationState.weekIdsGenerated.has(weekId)) {
              weekStartDates.add(weekId);
            }
            
            // Get month
            const monthStart = startOfMonth(exitDate);
            const monthId = format(monthStart, 'yyyy-MM');
            if (!generationState.monthIdsGenerated.has(monthId)) {
              monthStartDates.add(monthId);
            }
          } catch (error) {
            console.error('Error processing trade date:', error);
          }
        }
      });
      
      // Process each week
      for (const weekStartStr of weekStartDates) {
        try {
          // Check if this week was already processed
          if (generationState.weekIdsGenerated.has(weekStartStr)) {
            continue;
          }
          
          const weekStart = new Date(weekStartStr);
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          
          // Check if reflection already exists
          const existingReflection = await getWeeklyReflection(weekStartStr);
          
          if (!existingReflection) {
            // Create new reflection
            const newReflection = generateWeeklyReflection(weekStart, weekEnd, trades);
            await saveWeeklyReflectionObject(newReflection);
            generationState.weekIdsGenerated.add(weekStartStr);
            console.log(`Created weekly reflection for ${weekStartStr}`);
            
            // Allow UI to breathe
            await new Promise(resolve => setTimeout(resolve, 50));
          } else {
            generationState.weekIdsGenerated.add(weekStartStr);
          }
        } catch (error) {
          console.error(`Error processing week ${weekStartStr}:`, error);
        }
      }
      
      // Process each month
      for (const monthIdStr of monthStartDates) {
        try {
          // Check if this month was already processed
          if (generationState.monthIdsGenerated.has(monthIdStr)) {
            continue;
          }
          
          const [year, month] = monthIdStr.split('-').map(num => parseInt(num));
          const monthStart = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
          const monthEnd = endOfMonth(monthStart);
          
          // Check if reflection already exists
          const existingReflection = await getMonthlyReflection(monthIdStr);
          
          if (!existingReflection) {
            // Create new reflection
            const newReflection = generateMonthlyReflection(monthStart, monthEnd, trades);
            await saveMonthlyReflectionObject(newReflection);
            generationState.monthIdsGenerated.add(monthIdStr);
            console.log(`Created monthly reflection for ${monthIdStr}`);
            
            // Allow UI to breathe
            await new Promise(resolve => setTimeout(resolve, 50));
          } else {
            generationState.monthIdsGenerated.add(monthIdStr);
          }
        } catch (error) {
          console.error(`Error processing month ${monthIdStr}:`, error);
        }
      }
    });
    
    // Notify UI of completion
    console.log('Reflection generation completed');
    window.dispatchEvent(new CustomEvent('journal-updated', { 
      detail: { source: 'reflectionGenerator', success: true } 
    }));
  } catch (error) {
    console.error('Error generating reflections:', error);
    toast.error('Failed to generate reflections');
  } finally {
    generationState.isGenerating = false;
  }
}

/**
 * Process trades in smaller batches to prevent UI freezing
 */
async function processTradesInBatches(trades: TradeWithMetrics[], processor: (batch: TradeWithMetrics[]) => Promise<void>): Promise<void> {
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < trades.length; i += BATCH_SIZE) {
    const batch = trades.slice(i, i + BATCH_SIZE);
    await processor(batch);
    
    // Allow UI thread to breathe between batches
    if (i + BATCH_SIZE < trades.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
