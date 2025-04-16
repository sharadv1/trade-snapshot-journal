
import { 
  WEEKLY_REFLECTIONS_KEY, 
  MONTHLY_REFLECTIONS_KEY,
  dispatchStorageEvent, 
  safeParse 
} from './storageCore';

/**
 * Associate a trade with its corresponding weekly and monthly reflections
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
  
  console.log(`Associating trade ${tradeId} with week ${weekId} and month ${monthId}`);
  
  // Get weekly reflections
  const weeklyReflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
  const weeklyReflections = safeParse(weeklyReflectionsJson, {});
  
  if (weeklyReflections[weekId]) {
    if (!weeklyReflections[weekId].tradeIds) {
      weeklyReflections[weekId].tradeIds = [];
    }
    
    if (!weeklyReflections[weekId].tradeIds.includes(tradeId)) {
      weeklyReflections[weekId].tradeIds.push(tradeId);
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(weeklyReflections));
      dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
      console.log(`Added trade ${tradeId} to weekly reflection ${weekId}`);
    }
  }
  
  // Get monthly reflections
  const monthlyReflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
  const monthlyReflections = safeParse(monthlyReflectionsJson, {});
  
  if (monthlyReflections[monthId]) {
    if (!monthlyReflections[monthId].tradeIds) {
      monthlyReflections[monthId].tradeIds = [];
    }
    
    if (!monthlyReflections[monthId].tradeIds.includes(tradeId)) {
      monthlyReflections[monthId].tradeIds.push(tradeId);
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(monthlyReflections));
      dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
      console.log(`Added trade ${tradeId} to monthly reflection ${monthId}`);
    }
  }
}
