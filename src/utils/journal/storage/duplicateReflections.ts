
import { 
  getWeeklyReflections, 
  getMonthlyReflections, 
  saveWeeklyReflectionObject, 
  saveMonthlyReflectionObject
} from '@/utils/journal/reflectionStorage';
import { toast } from '@/utils/toast';

export async function removeDuplicateReflections() {
  console.log('Removing duplicate reflections');
  
  try {
    // Process weekly reflections
    const weeklyReflections = await getWeeklyReflections();
    const weeklyMap = new Map();
    let weeklyRemoved = 0;
    
    // Find duplicates
    weeklyReflections.forEach(reflection => {
      if (!reflection || !reflection.weekId) return;
      
      if (!weeklyMap.has(reflection.weekId) || 
          (reflection.lastUpdated && 
           new Date(reflection.lastUpdated) > new Date(weeklyMap.get(reflection.weekId).lastUpdated))) {
        weeklyMap.set(reflection.weekId, reflection);
      } else {
        weeklyRemoved++;
      }
    });
    
    // Process monthly reflections
    const monthlyReflections = await getMonthlyReflections();
    const monthlyMap = new Map();
    let monthlyRemoved = 0;
    
    // Find duplicates
    monthlyReflections.forEach(reflection => {
      if (!reflection || !reflection.monthId) return;
      
      if (!monthlyMap.has(reflection.monthId) || 
          (reflection.lastUpdated && 
           new Date(reflection.lastUpdated) > new Date(monthlyMap.get(reflection.monthId).lastUpdated))) {
        monthlyMap.set(reflection.monthId, reflection);
      } else {
        monthlyRemoved++;
      }
    });
    
    // If there are duplicates, save the clean data
    if (weeklyRemoved > 0) {
      for (const reflection of weeklyMap.values()) {
        saveWeeklyReflectionObject(reflection);
      }
    }
    
    if (monthlyRemoved > 0) {
      for (const reflection of monthlyMap.values()) {
        saveMonthlyReflectionObject(reflection);
      }
    }
    
    console.log(`Removed ${weeklyRemoved} weekly and ${monthlyRemoved} monthly duplicate reflections`);
    return { weeklyRemoved, monthlyRemoved };
  } catch (error) {
    console.error('Error removing duplicates:', error);
    toast.error('Failed to remove duplicate reflections');
    return { weeklyRemoved: 0, monthlyRemoved: 0 };
  }
}
