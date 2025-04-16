
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
    if (trade.exitDate) {
      const exitDate = new Date(trade.exitDate);
      return isWithinInterval(exitDate, { start: weekStart, end: weekEnd });
    }
    return false;
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
    if (trade.exitDate) {
      const exitDate = new Date(trade.exitDate);
      return isWithinInterval(exitDate, { start: monthStart, end: monthEnd });
    }
    return false;
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
 */
export async function generateMissingReflections(trades: TradeWithMetrics[]): Promise<void> {
  try {
    if (!trades || trades.length === 0) {
      console.log('No trades found, skipping reflection generation');
      return;
    }
    
    console.log(`Starting reflection generation for ${trades.length} trades`);
    
    // Generate reflections for weeks with trades
    await generateWeeklyReflectionsForTrades(trades);
    
    // Generate reflections for months with trades
    await generateMonthlyReflectionsForTrades(trades);
    
    // Notify UI of completion
    window.dispatchEvent(new CustomEvent('journal-updated', { 
      detail: { source: 'reflectionGenerator', success: true } 
    }));
    
    console.log('Reflection generation completed');
  } catch (error) {
    console.error('Error generating reflections:', error);
    toast.error('Failed to generate reflections');
    
    // Notify UI even when there's an error
    window.dispatchEvent(new CustomEvent('journal-updated', { 
      detail: { source: 'reflectionGenerator', error: true } 
    }));
  }
}

/**
 * Generate weekly reflections for all weeks containing trades
 */
async function generateWeeklyReflectionsForTrades(trades: TradeWithMetrics[]): Promise<void> {
  // Get all unique weeks from trade dates
  const weekStartDates = new Set<string>();
  
  trades.forEach(trade => {
    if (trade.exitDate) {
      const exitDate = new Date(trade.exitDate);
      const weekStart = startOfWeek(exitDate, { weekStartsOn: 1 });
      weekStartDates.add(format(weekStart, 'yyyy-MM-dd'));
    }
  });
  
  console.log(`Found ${weekStartDates.size} unique weeks with trades`);
  
  // Import the storage functions dynamically to avoid circular dependencies
  const { getWeeklyReflection, addWeeklyReflection } = await import('../journal/reflectionStorage');
  
  // Process each week
  for (const weekStartStr of weekStartDates) {
    try {
      const weekStart = new Date(weekStartStr);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekId = format(weekStart, 'yyyy-MM-dd');
      
      // Check if reflection already exists
      const existingReflection = await getWeeklyReflection(weekId);
      
      if (!existingReflection) {
        // Create new reflection
        const newReflection = generateWeeklyReflection(weekStart, weekEnd, trades);
        await addWeeklyReflection(newReflection);
        console.log(`Created weekly reflection for ${weekId}`);
      }
    } catch (error) {
      console.error(`Error processing week ${weekStartStr}:`, error);
      // Continue with other weeks
    }
  }
}

/**
 * Generate monthly reflections for all months containing trades
 */
async function generateMonthlyReflectionsForTrades(trades: TradeWithMetrics[]): Promise<void> {
  // Get all unique months from trade dates
  const monthStartDates = new Set<string>();
  
  trades.forEach(trade => {
    if (trade.exitDate) {
      const exitDate = new Date(trade.exitDate);
      const monthStart = startOfMonth(exitDate);
      monthStartDates.add(format(monthStart, 'yyyy-MM'));
    }
  });
  
  console.log(`Found ${monthStartDates.size} unique months with trades`);
  
  // Import the storage functions dynamically to avoid circular dependencies
  const { getMonthlyReflection, addMonthlyReflection } = await import('../journal/reflectionStorage');
  
  // Process each month
  for (const monthIdStr of monthStartDates) {
    try {
      const [year, month] = monthIdStr.split('-').map(num => parseInt(num));
      const monthStart = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
      const monthEnd = endOfMonth(monthStart);
      
      // Check if reflection already exists
      const existingReflection = await getMonthlyReflection(monthIdStr);
      
      if (!existingReflection) {
        // Create new reflection
        const newReflection = generateMonthlyReflection(monthStart, monthEnd, trades);
        await addMonthlyReflection(newReflection);
        console.log(`Created monthly reflection for ${monthIdStr}`);
      }
    } catch (error) {
      console.error(`Error processing month ${monthIdStr}:`, error);
      // Continue with other months
    }
  }
}
