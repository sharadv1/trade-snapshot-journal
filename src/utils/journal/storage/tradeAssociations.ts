import { 
  WEEKLY_REFLECTIONS_KEY, 
  MONTHLY_REFLECTIONS_KEY,
  dispatchStorageEvent, 
  safeParse 
} from './storageCore';

// Keeping track of processed trades to prevent duplicate operations
const processedTradeMap = new Map<string, Set<string>>();

/**
 * Associate a trade with its corresponding weekly and monthly reflections
 * This function is now optimized to prevent duplicate operations on the same trade
 */
export function associateTradeWithReflections(tradeId: string, tradeDate: string | Date): void {
  if (!tradeId || !tradeDate) {
    console.error('Cannot associate trade: missing trade ID or date');
    return;
  }
  
  const tradeDateTime = new Date(tradeDate);
  if (isNaN(tradeDateTime.getTime())) {
    console.error('Cannot associate trade: invalid date format', tradeDate);
    return;
  }
  
  const weekStart = new Date(tradeDateTime);
  weekStart.setDate(tradeDateTime.getDate() - tradeDateTime.getDay() + (tradeDateTime.getDay() === 0 ? -6 : 1));
  const weekId = weekStart.toISOString().slice(0, 10);
  
  const monthId = tradeDateTime.toISOString().slice(0, 7);
  
  // Check if this trade has already been processed for these reflections
  const tradeMapKey = `${tradeId}-${weekId}-${monthId}`;
  if (processedTradeMap.has(tradeMapKey)) {
    return;
  }
  
  // Track this operation to prevent repeated processing
  if (!processedTradeMap.has(tradeMapKey)) {
    processedTradeMap.set(tradeMapKey, new Set([weekId, monthId]));
  }
  
  console.log(`Associating trade ${tradeId} with week ${weekId} and month ${monthId}`);
  
  let updatedWeekly = false;
  let updatedMonthly = false;
  
  // Get weekly reflections
  try {
    const weeklyReflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    const weeklyReflections = safeParse(weeklyReflectionsJson, {});
    
    if (weeklyReflections[weekId]) {
      if (!weeklyReflections[weekId].tradeIds) {
        weeklyReflections[weekId].tradeIds = [];
      }
      
      if (!weeklyReflections[weekId].tradeIds.includes(tradeId)) {
        weeklyReflections[weekId].tradeIds.push(tradeId);
        localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(weeklyReflections));
        updatedWeekly = true;
        console.log(`Added trade ${tradeId} to weekly reflection ${weekId}`);
      }
    }
  } catch (error) {
    console.error('Error associating trade with weekly reflection:', error);
  }
  
  // Get monthly reflections
  try {
    const monthlyReflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    const monthlyReflections = safeParse(monthlyReflectionsJson, {});
    
    if (monthlyReflections[monthId]) {
      if (!monthlyReflections[monthId].tradeIds) {
        monthlyReflections[monthId].tradeIds = [];
      }
      
      if (!monthlyReflections[monthId].tradeIds.includes(tradeId)) {
        monthlyReflections[monthId].tradeIds.push(tradeId);
        localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(monthlyReflections));
        updatedMonthly = true;
        console.log(`Added trade ${tradeId} to monthly reflection ${monthId}`);
      }
    }
  } catch (error) {
    console.error('Error associating trade with monthly reflection:', error);
  }
  
  // Only dispatch events if we actually updated something
  if (updatedWeekly) {
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
  }
  
  if (updatedMonthly) {
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
  }
}

/**
 * Clear the processed trade cache - useful for testing or when storage is reset
 */
export function clearTradeAssociationCache(): void {
  processedTradeMap.clear();
}
