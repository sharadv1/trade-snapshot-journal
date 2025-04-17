import { WeeklyReflection, MonthlyReflection } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { weeklyReflectionsKey, monthlyReflectionsKey } from './storage/storageCore';
import { getAllWeeklyReflections, saveWeeklyReflection as saveWeeklyReflectionToStorage } from './storage/weeklyReflections'; 

// Storage keys for backward compatibility
const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Memory cache to avoid excessive localStorage reads
const reflectionCache = {
  weekly: null as WeeklyReflection[] | null,
  monthly: null as MonthlyReflection[] | null,
  weeklyTimestamp: 0,
  monthlyTimestamp: 0,
  isRefreshing: false
};

// Helper to prevent concurrent fetches
const withFetchLock = async <T>(operation: () => Promise<T>): Promise<T> => {
  if (reflectionCache.isRefreshing) {
    // Wait for existing refresh to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return withFetchLock(operation);
  }
  
  try {
    reflectionCache.isRefreshing = true;
    return await operation();
  } finally {
    reflectionCache.isRefreshing = false;
  }
};

// Type guards
function isValidReflection(obj: any): boolean {
  return obj && typeof obj === 'object' && 'id' in obj;
}

// Weekly Reflections
export const getWeeklyReflections = async (): Promise<WeeklyReflection[]> => {
  return withFetchLock(async () => {
    try {
      // Check if cache is fresh (less than 10 seconds old)
      const now = Date.now();
      if (reflectionCache.weekly && now - reflectionCache.weeklyTimestamp < 10000) {
        console.log('Using cached weekly reflections');
        return reflectionCache.weekly;
      }
      
      console.log('Getting weekly reflections from storage');
      const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
      if (!reflectionsJson) {
        console.log('No weekly reflections found in storage');
        reflectionCache.weekly = [];
        reflectionCache.weeklyTimestamp = now;
        return [];
      }
      
      let parsed;
      try {
        parsed = JSON.parse(reflectionsJson);
        console.log('Parsed weekly reflections:', typeof parsed);
      } catch (e) {
        console.error('Failed to parse weekly reflections JSON:', e);
        reflectionCache.weekly = [];
        reflectionCache.weeklyTimestamp = now;
        return [];
      }
      
      // Ensure we're returning an array
      if (Array.isArray(parsed)) {
        const reflections = parsed.filter(isValidReflection);
        reflectionCache.weekly = reflections;
        reflectionCache.weeklyTimestamp = now;
        return reflections;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Convert object with reflection entries to array
        const reflections = Object.values(parsed).filter(isValidReflection) as WeeklyReflection[];
        console.log(`Converted ${reflections.length} weekly reflections from object to array`);
        reflectionCache.weekly = reflections;
        reflectionCache.weeklyTimestamp = now;
        return reflections;
      }
      
      console.log('Unknown format for weekly reflections, returning empty array');
      reflectionCache.weekly = [];
      reflectionCache.weeklyTimestamp = now;
      return [];
    } catch (error) {
      console.error('Error getting weekly reflections:', error);
      return reflectionCache.weekly || [];
    }
  });
};

// Get a specific weekly reflection by weekId
export const getWeeklyReflection = async (weekId: string): Promise<WeeklyReflection | null> => {
  try {
    // Try to get from cache first
    if (reflectionCache.weekly) {
      const cachedReflection = reflectionCache.weekly.find(r => r.weekId === weekId);
      if (cachedReflection) {
        return cachedReflection;
      }
    }
    
    // Otherwise get all reflections and find the one we want
    const reflections = await getWeeklyReflections();
    return reflections.find(r => r.weekId === weekId) || null;
  } catch (error) {
    console.error(`Error getting weekly reflection for ${weekId}:`, error);
    return null;
  }
};

// Weekly reflection storage functions
export const saveWeeklyReflection = (weekId: string, reflection: string, grade?: string, weeklyPlan?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!weekId) {
        console.error('Cannot save weekly reflection: weekId is empty');
        reject(new Error('Invalid weekId'));
        return;
      }
      
      console.log(`Saving weekly reflection for ${weekId}`);
      
      // Use the storage module function
      saveWeeklyReflectionToStorage(weekId, reflection, grade, weeklyPlan);
      
      // Invalidate cache after save
      reflectionCache.weekly = null;
      reflectionCache.weeklyTimestamp = 0;
      
      resolve();
    } catch (error) {
      console.error('Error in saveWeeklyReflection:', error);
      reject(error);
    }
  });
};

// Other weekly reflection functions
export const addWeeklyReflection = async (reflection: WeeklyReflection): Promise<void> => {
  try {
    const reflections = await getWeeklyReflections();
    
    // Ensure the reflection has an ID
    if (!reflection.id) {
      reflection.id = generateUUID();
    }
    
    // Check if a reflection with this weekId already exists
    const existingIndex = reflections.findIndex(r => r.weekId === reflection.weekId);
    
    if (existingIndex >= 0) {
      // Update the existing reflection
      reflections[existingIndex] = {
        ...reflections[existingIndex],
        ...reflection,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Add a new reflection with lastUpdated
      const newReflection = {
        ...reflection,
        lastUpdated: new Date().toISOString()
      };
      reflections.push(newReflection);
    }
    
    // Convert array back to object format for storage
    const reflectionsObject: Record<string, WeeklyReflection> = {};
    reflections.forEach(r => {
      const key = r.weekId || r.id;
      if (key) {
        reflectionsObject[key] = r;
      }
    });
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObject));
    
    // Invalidate cache
    reflectionCache.weekly = null;
    reflectionCache.weeklyTimestamp = 0;
    
    // Dispatch events to notify of changes
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source: 'addWeeklyReflection' } }));
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error adding weekly reflection:', error);
    throw error;
  }
};

export const updateWeeklyReflection = async (reflection: WeeklyReflection): Promise<void> => {
  try {
    const reflections = await getWeeklyReflections();
    const index = reflections.findIndex(r => r.id === reflection.id);
    
    if (index !== -1) {
      reflections[index] = {
        ...reflections[index],
        ...reflection,
        lastUpdated: new Date().toISOString()
      };
      
      // Convert array back to object format for storage
      const reflectionsObject: Record<string, WeeklyReflection> = {};
      reflections.forEach(r => {
        const key = r.weekId || r.id;
        if (key) {
          reflectionsObject[key] = r;
        }
      });
      
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObject));
      
      // Invalidate cache
      reflectionCache.weekly = null;
      reflectionCache.weeklyTimestamp = 0;
      
      // Dispatch events to notify of changes
      window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source: 'updateWeeklyReflection' } }));
      window.dispatchEvent(new Event('storage'));
    } else {
      throw new Error('Reflection not found');
    }
  } catch (error) {
    console.error('Error updating weekly reflection:', error);
    throw error;
  }
};

export const deleteWeeklyReflection = async (id: string): Promise<void> => {
  try {
    const reflections = await getWeeklyReflections();
    const filteredReflections = reflections.filter(r => r.id !== id);
    
    // Convert array back to object format for storage
    const reflectionsObject: Record<string, WeeklyReflection> = {};
    filteredReflections.forEach(r => {
      const key = r.weekId || r.id;
      if (key) {
        reflectionsObject[key] = r;
      }
    });
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObject));
    
    // Invalidate cache
    reflectionCache.weekly = null;
    reflectionCache.weeklyTimestamp = 0;
    
    // Dispatch events to notify of changes
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source: 'deleteWeeklyReflection' } }));
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
    throw error;
  }
};

// Monthly Reflections (same implementations but with monthly cache)
export const getMonthlyReflections = async (): Promise<MonthlyReflection[]> => {
  return withFetchLock(async () => {
    try {
      // Check if cache is fresh (less than 10 seconds old)
      const now = Date.now();
      if (reflectionCache.monthly && now - reflectionCache.monthlyTimestamp < 10000) {
        return reflectionCache.monthly;
      }
      
      const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
      if (!reflectionsJson) {
        reflectionCache.monthly = [];
        reflectionCache.monthlyTimestamp = now;
        return [];
      }
      
      let parsed;
      try {
        parsed = JSON.parse(reflectionsJson);
      } catch (e) {
        console.error('Failed to parse monthly reflections JSON:', e);
        reflectionCache.monthly = [];
        reflectionCache.monthlyTimestamp = now;
        return [];
      }
      
      // Ensure we're returning an array
      if (Array.isArray(parsed)) {
        const reflections = parsed.filter(isValidReflection);
        reflectionCache.monthly = reflections;
        reflectionCache.monthlyTimestamp = now;
        return reflections;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Convert object with reflection entries to array
        const reflections = Object.values(parsed).filter(isValidReflection) as MonthlyReflection[];
        reflectionCache.monthly = reflections;
        reflectionCache.monthlyTimestamp = now;
        return reflections;
      }
      
      reflectionCache.monthly = [];
      reflectionCache.monthlyTimestamp = now;
      return [];
    } catch (error) {
      console.error('Error getting monthly reflections:', error);
      return reflectionCache.monthly || [];
    }
  });
};

export const getMonthlyReflection = async (monthId: string): Promise<MonthlyReflection | null> => {
  try {
    // Use the monthly reflections storage
    const { getMonthlyReflection: getMonthlyReflectionImpl } = await import('@/utils/journal/storage/monthlyReflections');
    return await getMonthlyReflectionImpl(monthId);
  } catch (error) {
    console.error("Error getting monthly reflection:", error);
    throw error;
  }
};

export const saveMonthlyReflection = async (
  monthId: string,
  reflection: string, 
  grade?: string
) => {
  try {
    // Parse the month
    const [year, month] = monthId.split('-').map(n => parseInt(n));
    const monthDate = new Date(year, month - 1, 1); // Month is 0-based in Date
    
    // Get the start and end of the month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // Last day of the month
    
    // Format dates as ISO strings
    const monthStartISO = monthStart.toISOString();
    const monthEndISO = monthEnd.toISOString();
    
    // Create reflection object
    const reflectionObj: MonthlyReflection = {
      id: generateUUID(),
      monthId: monthId,
      monthStart: monthStartISO,
      monthEnd: monthEndISO,
      reflection,
      grade,
      lastUpdated: new Date().toISOString(),
    };
    
    // Use the monthly reflections storage
    const { saveMonthlyReflection: saveMonthlyReflectionImpl } = await import('@/utils/journal/storage/monthlyReflections');
    await saveMonthlyReflectionImpl(monthId, reflection, grade);
    
    // Dispatch event to notify changes
    window.dispatchEvent(new CustomEvent('journal-updated'));
    
    return reflectionObj;
  } catch (error) {
    console.error("Error saving monthly reflection:", error);
    throw error;
  }
};

export const deleteMonthlyReflection = async (id: string): Promise<void> => {
  try {
    // Use the monthly reflections storage
    const { deleteMonthlyReflection: deleteMonthlyReflectionImpl } = await import('@/utils/journal/storage/monthlyReflections');
    await deleteMonthlyReflectionImpl(id);
    
    // Dispatch event to notify changes
    window.dispatchEvent(new CustomEvent('journal-updated'));
  } catch (error) {
    console.error("Error deleting monthly reflection:", error);
    throw error;
  }
};

export const saveWeeklyReflectionObject = async (reflection: WeeklyReflection): Promise<void> => {
  try {
    const { saveWeeklyReflectionObject: saveWeeklyReflectionObjectImpl } = await import('@/utils/journal/storage/weeklyReflections');
    await saveWeeklyReflectionObjectImpl(reflection);
  } catch (error) {
    console.error("Error saving weekly reflection object:", error);
    throw error;
  }
};

export const saveMonthlyReflectionObject = async (reflection: MonthlyReflection): Promise<void> => {
  try {
    const { saveMonthlyReflectionObject: saveMonthlyReflectionObjectImpl } = await import('@/utils/journal/storage/monthlyReflections');
    await saveMonthlyReflectionObjectImpl(reflection);
  } catch (error) {
    console.error("Error saving monthly reflection object:", error);
    throw error;
  }
};

export const removeDuplicateReflections = async () => {
  try {
    const { removeDuplicateReflections: removeDuplicatesImpl } = await import('@/utils/journal/storage/duplicateReflections');
    return await removeDuplicatesImpl();
  } catch (error) {
    console.error("Error removing duplicate reflections:", error);
    throw error;
  }
};
