import { 
  getWeeklyReflections, 
  getMonthlyReflections,
  deleteWeeklyReflection,
  deleteMonthlyReflection
} from '@/utils/journal/reflectionStorage';
import { toast } from '@/utils/toast';

export async function removeDuplicateReflections() {
  console.log('Removing duplicate reflections');
  
  try {
    // Process weekly reflections
    const weeklyReflections = await getWeeklyReflections();
    const weeklyMap = new Map();
    let weeklyDuplicates = [];
    
    // Find duplicates
    weeklyReflections.forEach(reflection => {
      if (!reflection || !reflection.weekId) return;
      
      if (!weeklyMap.has(reflection.weekId)) {
        weeklyMap.set(reflection.weekId, reflection);
      } else {
        // Compare dates to keep the newest one
        const existing = weeklyMap.get(reflection.weekId);
        const existingDate = existing.lastUpdated ? new Date(existing.lastUpdated) : new Date(0);
        const currentDate = reflection.lastUpdated ? new Date(reflection.lastUpdated) : new Date(0);
        
        if (currentDate > existingDate) {
          // Current reflection is newer, so mark the existing one as duplicate
          weeklyDuplicates.push(existing.id);
          weeklyMap.set(reflection.weekId, reflection);
        } else {
          // Existing reflection is newer, so mark the current one as duplicate
          weeklyDuplicates.push(reflection.id);
        }
      }
    });
    
    // Process monthly reflections
    const monthlyReflections = await getMonthlyReflections();
    const monthlyMap = new Map();
    let monthlyDuplicates = [];
    
    // Find duplicates
    monthlyReflections.forEach(reflection => {
      if (!reflection || !reflection.monthId) return;
      
      if (!monthlyMap.has(reflection.monthId)) {
        monthlyMap.set(reflection.monthId, reflection);
      } else {
        // Compare dates to keep the newest one
        const existing = monthlyMap.get(reflection.monthId);
        const existingDate = existing.lastUpdated ? new Date(existing.lastUpdated) : new Date(0);
        const currentDate = reflection.lastUpdated ? new Date(reflection.lastUpdated) : new Date(0);
        
        if (currentDate > existingDate) {
          // Current reflection is newer, so mark the existing one as duplicate
          monthlyDuplicates.push(existing.id);
          monthlyMap.set(reflection.monthId, reflection);
        } else {
          // Existing reflection is newer, so mark the current one as duplicate
          monthlyDuplicates.push(reflection.id);
        }
      }
    });
    
    // Delete the identified duplicates
    let weeklyRemoved = 0;
    let monthlyRemoved = 0;
    
    for (const id of weeklyDuplicates) {
      await deleteWeeklyReflection(id);
      weeklyRemoved++;
    }
    
    for (const id of monthlyDuplicates) {
      await deleteMonthlyReflection(id);
      monthlyRemoved++;
    }
    
    console.log(`Removed ${weeklyRemoved} weekly and ${monthlyRemoved} monthly duplicate reflections`);
    
    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('journal-updated'));
    window.dispatchEvent(new Event('storage'));
    
    return { weeklyRemoved, monthlyRemoved };
  } catch (error) {
    console.error('Error removing duplicates:', error);
    toast.error('Failed to remove duplicate reflections');
    return { weeklyRemoved: 0, monthlyRemoved: 0 };
  }
}
