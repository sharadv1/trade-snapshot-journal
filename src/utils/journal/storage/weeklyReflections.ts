
import { WeeklyReflection } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { 
  WEEKLY_REFLECTIONS_KEY, 
  notifyJournalUpdate, 
  dispatchStorageEvent,
  safeParse,
  debugStorage,
  getDataFromStorage,
  saveDataToStorage
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
    
    // Ensure we're returning an array
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Convert object with reflection entries to array
      return Object.values(parsed) as WeeklyReflection[];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting weekly reflections:', error);
    return [];
  }
}

/**
 * Get a specific weekly reflection by weekId
 */
export async function getWeeklyReflection(weekId: string): Promise<WeeklyReflection | null> {
  try {
    const reflections = await getWeeklyReflections();
    const reflection = reflections.find(r => r.weekId === weekId);
    return reflection || null;
  } catch (error) {
    console.error(`Error getting weekly reflection for ${weekId}:`, error);
    return null;
  }
}

/**
 * Save a weekly reflection
 */
export async function saveWeeklyReflection(
  weekId: string, 
  reflection: string, 
  grade?: string, 
  weeklyPlan?: string,
  isFutureWeek?: boolean
): Promise<void> {
  try {
    const allReflections = await getWeeklyReflections();
    
    // First check if we already have a reflection with this weekId
    const existingIndex = allReflections.findIndex(r => r.weekId === weekId);
    
    const now = new Date();
    
    if (existingIndex >= 0) {
      // Update existing reflection
      allReflections[existingIndex] = {
        ...allReflections[existingIndex],
        reflection,
        grade,
        weeklyPlan,
        isFutureWeek,
        lastUpdated: now.toISOString()
      };
    } else {
      // Create new reflection
      const newReflection: WeeklyReflection = {
        id: generateUUID(),
        weekId,
        reflection,
        grade,
        weeklyPlan,
        isFutureWeek,
        lastUpdated: now.toISOString()
      };
      
      allReflections.push(newReflection);
    }
    
    // Convert to object format for storage
    const reflectionsObj: Record<string, WeeklyReflection> = {};
    allReflections.forEach(r => {
      if (r.weekId) {
        reflectionsObj[r.weekId] = r;
      } else {
        reflectionsObj[r.id] = r;
      }
    });
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObj));
    
    notifyJournalUpdate('saveWeeklyReflection');
    dispatchStorageEvent();
    
    console.log(`Weekly reflection for ${weekId} saved successfully`);
  } catch (error) {
    console.error(`Error saving weekly reflection for ${weekId}:`, error);
    throw error;
  }
}

/**
 * Save a complete weekly reflection object
 */
export async function saveWeeklyReflectionObject(reflection: WeeklyReflection): Promise<void> {
  try {
    const allReflections = await getWeeklyReflections();
    
    // Check if we're updating or creating
    const existingIndex = allReflections.findIndex(r => r.id === reflection.id);
    
    const now = new Date();
    const updatedReflection = {
      ...reflection,
      lastUpdated: now.toISOString()
    };
    
    if (existingIndex >= 0) {
      // Update existing reflection
      allReflections[existingIndex] = updatedReflection;
    } else {
      // Create new reflection
      allReflections.push(updatedReflection);
    }
    
    // Convert to object format for storage
    const reflectionsObj: Record<string, WeeklyReflection> = {};
    allReflections.forEach(r => {
      if (r.weekId) {
        reflectionsObj[r.weekId] = r;
      } else {
        reflectionsObj[r.id] = r;
      }
    });
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObj));
    
    notifyJournalUpdate('saveWeeklyReflectionObject');
    dispatchStorageEvent();
    
    console.log(`Weekly reflection object saved successfully`);
  } catch (error) {
    console.error('Error saving weekly reflection object:', error);
    throw error;
  }
}

/**
 * Delete a weekly reflection
 */
export async function deleteWeeklyReflection(id: string): Promise<void> {
  try {
    const allReflections = await getWeeklyReflections();
    const filteredReflections = allReflections.filter(r => r.id !== id);
    
    // Convert to object format for storage
    const reflectionsObj: Record<string, WeeklyReflection> = {};
    filteredReflections.forEach(r => {
      if (r.weekId) {
        reflectionsObj[r.weekId] = r;
      } else {
        reflectionsObj[r.id] = r;
      }
    });
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObj));
    
    notifyJournalUpdate('deleteWeeklyReflection');
    dispatchStorageEvent();
    
    console.log(`Weekly reflection ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting weekly reflection ${id}:`, error);
    throw error;
  }
}

/**
 * Get all weekly reflections with trades
 */
export async function getAllWeeklyReflections(): Promise<WeeklyReflection[]> {
  return getWeeklyReflections();
}
