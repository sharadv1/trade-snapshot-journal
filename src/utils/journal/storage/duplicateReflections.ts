import { 
  getWeeklyReflections, 
  getMonthlyReflections,
  deleteWeeklyReflection,
  deleteMonthlyReflection
} from '@/utils/journal/reflectionStorage';
import { toast } from '@/utils/toast';

export async function removeDuplicateReflections() {
  console.log('Removing duplicate reflections - improved version');
  
  try {
    // Process weekly reflections - using weekId as the unique identifier
    const weeklyReflections = await getWeeklyReflections();
    const weeklyMap = new Map();
    let weeklyDuplicates = [];
    
    console.log(`Processing ${weeklyReflections.length} weekly reflections`);
    
    // First pass - organize by weekId and identify duplicates
    for (const reflection of weeklyReflections) {
      if (!reflection || !reflection.weekId) {
        console.log('Skipping invalid reflection without weekId:', reflection);
        continue;
      }
      
      console.log(`Processing reflection for weekId: ${reflection.weekId}`);
      
      if (!weeklyMap.has(reflection.weekId)) {
        weeklyMap.set(reflection.weekId, reflection);
      } else {
        // Compare dates to keep the newest one
        const existing = weeklyMap.get(reflection.weekId);
        const existingDate = existing.lastUpdated ? new Date(existing.lastUpdated) : new Date(0);
        const currentDate = reflection.lastUpdated ? new Date(reflection.lastUpdated) : new Date(0);
        
        console.log(`Found duplicate for weekId ${reflection.weekId}:`);
        console.log(`  Existing: id=${existing.id}, lastUpdated=${existingDate}`);
        console.log(`  Current: id=${reflection.id}, lastUpdated=${currentDate}`);
        
        if (currentDate > existingDate) {
          // Current reflection is newer, mark the existing one as duplicate
          console.log(`  Current is newer, marking existing as duplicate`);
          weeklyDuplicates.push(existing.id);
          weeklyMap.set(reflection.weekId, reflection);
        } else {
          // Existing reflection is newer or same age, mark the current one as duplicate
          console.log(`  Existing is newer, marking current as duplicate`);
          weeklyDuplicates.push(reflection.id);
        }
      }
    }
    
    // Process monthly reflections - similar approach
    const monthlyReflections = await getMonthlyReflections();
    const monthlyMap = new Map();
    let monthlyDuplicates = [];
    
    // Find duplicates
    for (const reflection of monthlyReflections) {
      if (!reflection || !reflection.monthId) continue;
      
      if (!monthlyMap.has(reflection.monthId)) {
        monthlyMap.set(reflection.monthId, reflection);
      } else {
        // Compare dates to keep the newest one
        const existing = monthlyMap.get(reflection.monthId);
        const existingDate = existing.lastUpdated ? new Date(existing.lastUpdated) : new Date(0);
        const currentDate = reflection.lastUpdated ? new Date(reflection.lastUpdated) : new Date(0);
        
        if (currentDate > existingDate) {
          // Current reflection is newer, mark the existing one as duplicate
          monthlyDuplicates.push(existing.id);
          monthlyMap.set(reflection.monthId, reflection);
        } else {
          // Existing reflection is newer, mark the current one as duplicate
          monthlyDuplicates.push(reflection.id);
        }
      }
    }
    
    // Delete the identified duplicates one by one
    console.log(`Found ${weeklyDuplicates.length} weekly duplicates to remove`);
    let weeklyRemoved = 0;
    let monthlyRemoved = 0;
    
    for (const id of weeklyDuplicates) {
      console.log(`Deleting weekly duplicate with id: ${id}`);
      try {
        await deleteWeeklyReflection(id);
        weeklyRemoved++;
      } catch (err) {
        console.error(`Failed to delete weekly reflection ${id}:`, err);
      }
    }
    
    for (const id of monthlyDuplicates) {
      try {
        await deleteMonthlyReflection(id);
        monthlyRemoved++;
      } catch (err) {
        console.error(`Failed to delete monthly reflection ${id}:`, err);
      }
    }
    
    console.log(`Successfully removed ${weeklyRemoved} weekly and ${monthlyRemoved} monthly duplicate reflections`);
    
    // Force update UI and storage
    window.dispatchEvent(new CustomEvent('journal-updated', { 
      detail: { source: 'removeDuplicateReflections', count: weeklyRemoved + monthlyRemoved } 
    }));
    window.dispatchEvent(new Event('storage'));
    
    return { weeklyRemoved, monthlyRemoved };
  } catch (error) {
    console.error('Error removing duplicates:', error);
    toast.error('Failed to remove duplicate reflections');
    return { weeklyRemoved: 0, monthlyRemoved: 0 };
  }
}

// Helper function to clean up reflections with no content
export async function cleanupEmptyReflections() {
  try {
    const weeklyReflections = await getWeeklyReflections();
    let emptyCount = 0;
    
    for (const reflection of weeklyReflections) {
      // Check if reflection is empty (no content or just whitespace)
      const isEmpty = !reflection.reflection || 
                     reflection.reflection.trim() === '' || 
                     reflection.reflection === '<p></p>';
                     
      const hasNoGrade = !reflection.grade || reflection.grade.trim() === '';
      const hasNoPlan = !reflection.weeklyPlan || 
                       reflection.weeklyPlan.trim() === '' || 
                       reflection.weeklyPlan === '<p></p>';
      
      // If reflection has no content AND no trades associated with it, delete it
      if (isEmpty && hasNoGrade && hasNoPlan && 
          (!reflection.tradeIds || reflection.tradeIds.length === 0)) {
        await deleteWeeklyReflection(reflection.id);
        emptyCount++;
      }
    }
    
    if (emptyCount > 0) {
      console.log(`Cleaned up ${emptyCount} empty reflections`);
      window.dispatchEvent(new CustomEvent('journal-updated'));
      window.dispatchEvent(new Event('storage'));
    }
    
    return emptyCount;
  } catch (error) {
    console.error('Error cleaning up empty reflections:', error);
    return 0;
  }
}
