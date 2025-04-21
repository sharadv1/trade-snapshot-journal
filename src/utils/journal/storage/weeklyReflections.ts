
import { WeeklyReflection } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { 
  WEEKLY_REFLECTIONS_KEY, 
  notifyJournalUpdate, 
  dispatchStorageEvent,
  safeParse,
  debugStorage
} from './storageCore';
import { toast } from '@/utils/toast';

/**
 * Get all weekly reflections
 */
export async function getWeeklyReflections(): Promise<WeeklyReflection[]> {
  try {
    debugStorage('Getting weekly reflections', WEEKLY_REFLECTIONS_KEY);
    const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    
    if (!reflectionsJson) {
      console.log('No weekly reflections found in storage');
      return [];
    }
    
    let parsed;
    try {
      parsed = JSON.parse(reflectionsJson);
      console.log('Weekly reflections parsed from storage:', typeof parsed);
    } catch (e) {
      console.error('Failed to parse weekly reflections JSON:', e);
      return [];
    }
    
    // Handle both array and object formats
    if (Array.isArray(parsed)) {
      return parsed.filter(r => r && typeof r === 'object' && 'id' in r);
    } else if (parsed && typeof parsed === 'object') {
      // Convert object to array for consistency
      const reflections = Object.values(parsed).filter(r => r && typeof r === 'object' && 'id' in r) as WeeklyReflection[];
      console.log(`Converted ${reflections.length} weekly reflections from object to array`);
      return reflections;
    }
    
    console.log('Unknown format for weekly reflections, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting weekly reflections:', error);
    return [];
  }
}

/**
 * Get a specific weekly reflection by its weekId
 */
export async function getWeeklyReflection(weekId: string): Promise<WeeklyReflection | null> {
  try {
    const reflections = await getWeeklyReflections();
    return reflections.find(r => r.weekId === weekId) || null;
  } catch (error) {
    console.error(`Error getting weekly reflection for ${weekId}:`, error);
    return null;
  }
}

// Alias function to maintain compatibility with older code
export const getWeeklyReflectionById = getWeeklyReflection;

/**
 * Add or update a weekly reflection
 */
export async function addWeeklyReflection(reflection: WeeklyReflection): Promise<void> {
  try {
    // Ensure reflection has required fields
    if (!reflection.id) {
      reflection.id = generateUUID();
    }
    
    if (!reflection.lastUpdated) {
      reflection.lastUpdated = new Date().toISOString();
    }
    
    const reflections = await getWeeklyReflections();
    const existingIndex = reflections.findIndex(r => r.weekId === reflection.weekId);
    
    if (existingIndex >= 0) {
      // Update existing reflection
      reflections[existingIndex] = {
        ...reflections[existingIndex],
        ...reflection,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Add new reflection
      reflections.push(reflection);
    }
    
    // Save all reflections
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    // Notify of update
    notifyJournalUpdate('addWeeklyReflection');
  } catch (error) {
    console.error('Error adding weekly reflection:', error);
    throw error;
  }
}

/**
 * Update an existing weekly reflection
 */
export async function updateWeeklyReflection(reflection: WeeklyReflection): Promise<void> {
  try {
    const reflections = await getWeeklyReflections();
    const index = reflections.findIndex(r => r.id === reflection.id);
    
    if (index !== -1) {
      reflections[index] = {
        ...reflections[index],
        ...reflection,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
      notifyJournalUpdate('updateWeeklyReflection');
    } else {
      throw new Error('Reflection not found');
    }
  } catch (error) {
    console.error('Error updating weekly reflection:', error);
    throw error;
  }
}

/**
 * Delete a weekly reflection
 */
export async function deleteWeeklyReflection(id: string): Promise<void> {
  try {
    const reflections = await getWeeklyReflections();
    const updatedReflections = reflections.filter(r => r.id !== id);
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(updatedReflections));
    notifyJournalUpdate('deleteWeeklyReflection');
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
    throw error;
  }
}

/**
 * Save a weekly reflection object directly
 */
export function saveWeeklyReflectionObject(reflection: WeeklyReflection): void {
  try {
    if (!reflection) {
      console.error('Cannot save null reflection object');
      return;
    }
    
    const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    const reflections = safeParse(reflectionsJson, {});
    const weekId = reflection.weekId || reflection.id || '';
    
    if (!weekId) {
      console.error('Cannot save reflection without id or weekId');
      return;
    }
    
    reflections[weekId] = {
      ...reflection,
      id: weekId,
      weekId: weekId,
      lastUpdated: new Date().toISOString(),
      isPlaceholder: false
    };
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    console.log(`Weekly reflection object saved successfully for ${weekId}`);
  } catch (error) {
    console.error('Error saving weekly reflection object:', error);
  }
}

/**
 * Save a weekly reflection with text content
 */
export function saveWeeklyReflection(
  weekId: string, 
  reflection: string, 
  grade?: string, 
  weeklyPlan?: string, 
  isFutureWeek?: boolean
): void {
  if (!weekId) {
    console.error('Cannot save weekly reflection: weekId is empty');
    return;
  }
  
  debugStorage('Saving weekly reflection', weekId, {
    reflection: reflection.substring(0, 50) + '...', 
    grade, 
    weeklyPlan: weeklyPlan?.substring(0, 50) + '...',
    isFutureWeek
  });
  
  try {
    const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    const reflections = safeParse(reflectionsJson, {});
    
    const currentDate = new Date(weekId);
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Check if it's a future week
    const today = new Date();
    const isFutureDate = weekStart > today;
    
    // Use the provided isFutureWeek flag if available, otherwise check the date
    const isActuallyFutureWeek = typeof isFutureWeek !== 'undefined' ? isFutureWeek : isFutureDate;
    
    reflections[weekId] = {
      ...reflections[weekId],
      id: weekId,
      weekId: weekId,
      weekStart: reflections[weekId]?.weekStart || weekStart.toISOString(),
      weekEnd: reflections[weekId]?.weekEnd || weekEnd.toISOString(),
      reflection,
      weeklyPlan: weeklyPlan || '',
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[weekId]?.tradeIds || [],
      isPlaceholder: false,
      isFutureWeek: isActuallyFutureWeek
    };
    
    const reflectionsJson2 = JSON.stringify(reflections);
    
    try {
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, reflectionsJson2);
      
      const savedData = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
      if (!savedData) {
        throw new Error('Failed to retrieve data after saving');
      }
      
      if (savedData.indexOf('"' + weekId + '"') === -1) {
        throw new Error(`Saved data doesn't contain the weekId: ${weekId}`);
      }
      
      debugStorage('Weekly reflection saved successfully', weekId);
    } catch (error) {
      console.error('Error saving weekly reflection:', error);
      
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        const dataSize = reflectionsJson2.length / 1024;
        console.error(`Storage limit reached! Attempted to save ${dataSize.toFixed(2)}KB`);
        toast.error('Storage limit reached. Try removing some old entries or images.');
      } else {
        toast.error('Failed to save reflection. Please try again or check console for errors.');
      }
      return;
    }
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error in saveWeeklyReflection:', error);
    toast.error('Failed to save weekly reflection');
  }
}

/**
 * Get all weekly reflections as an object
 * Used by getWeeklyReflectionsForMonth
 */
export function getAllWeeklyReflections() {
  try {
    console.log('[JOURNAL STORAGE] Getting ALL weekly reflections for key "trade-journal-weekly-reflections"');
    const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    
    if (!reflectionsJson) {
      console.log('No weekly reflections found in local storage');
      return {};
    }
    
    console.log('Data:', reflectionsJson.substring(0, 100) + '...');
    
    try {
      const data = JSON.parse(reflectionsJson);
      return data || {};
    } catch (e) {
      console.error('Failed to parse weekly reflections JSON:', e);
      return {};
    }
  } catch (error) {
    console.error('Error getting all weekly reflections:', error);
    return {};
  }
}

/**
 * Get weekly reflections for a specified month
 */
export function getWeeklyReflectionsForMonth(monthId: string): WeeklyReflection[] {
  if (!monthId) {
    console.error('Cannot get weekly reflections: monthId is empty');
    return [];
  }

  try {
    let formattedMonthId = monthId;
    if (!monthId.match(/^\d{4}-\d{2}$/)) {
      const date = new Date(monthId);
      if (!isNaN(date.getTime())) {
        formattedMonthId = date.toISOString().slice(0, 7);
      }
    }

    const allWeeklyReflections = getAllWeeklyReflections();
    
    const weeklyReflectionMap = new Map<string, WeeklyReflection>();

    Object.values(allWeeklyReflections).forEach((reflection: WeeklyReflection) => {
      if (reflection && reflection.weekStart) {
        try {
          const weekStart = new Date(reflection.weekStart);
          const weekMonth = weekStart.toISOString().slice(0, 7);
          
          if (weekMonth === formattedMonthId) {
            const existingReflection = weeklyReflectionMap.get(reflection.weekId);
            
            if (!existingReflection || 
                (reflection.lastUpdated && existingReflection.lastUpdated && 
                 new Date(reflection.lastUpdated) > new Date(existingReflection.lastUpdated))) {
              weeklyReflectionMap.set(reflection.weekId, reflection);
            }
          }
        } catch (e) {
          console.error('Error parsing date in getWeeklyReflectionsForMonth:', e);
        }
      }
    });

    const monthlyReflections = Array.from(weeklyReflectionMap.values());

    monthlyReflections.sort((a, b) => {
      if (!a.weekStart || !b.weekStart) return 0;
      return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
    });

    return monthlyReflections;
  } catch (e) {
    console.error('Error in getWeeklyReflectionsForMonth:', e);
    return [];
  }
}
