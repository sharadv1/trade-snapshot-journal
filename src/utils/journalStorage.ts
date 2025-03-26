
import { safeGetItem, safeSetItem } from './storage/storageUtils';
import { generateUUID } from './generateUUID';

// Storage keys
const REFLECTIONS_STORAGE_KEY = 'trade-journal-reflections';
const MONTHLY_REFLECTIONS_STORAGE_KEY = 'trade-journal-monthly-reflections';

// Weekly reflection type
export interface WeeklyReflection {
  id: string;
  weekStart: string; // ISO date string for start of week (Sunday)
  weekEnd: string;   // ISO date string for end of week (Saturday)
  reflection: string;
  grade: string;     // Keeping this in the type for backward compatibility
  tradeIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Monthly reflection type
export interface MonthlyReflection {
  id: string;
  monthStart: string; // ISO date string for start of month
  monthEnd: string;   // ISO date string for end of month
  reflection: string;
  grade: string;
  tradeIds: string[];
  createdAt: string;
  updatedAt: string;
}

// WEEKLY REFLECTION FUNCTIONS

// Get all weekly reflections
export const getWeeklyReflections = (): WeeklyReflection[] => {
  try {
    const reflectionsJson = safeGetItem(REFLECTIONS_STORAGE_KEY);
    if (!reflectionsJson) return [];
    
    const parsed = JSON.parse(reflectionsJson);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch (error) {
    console.error('Error loading weekly reflections:', error);
    return [];
  }
};

// Get reflection for a specific week
export const getWeeklyReflection = (weekId: string): WeeklyReflection | null => {
  const reflections = getWeeklyReflections();
  return reflections.find(r => r.id === weekId) || null;
};

// Save a weekly reflection
export const saveWeeklyReflection = (reflection: WeeklyReflection): boolean => {
  try {
    const reflections = getWeeklyReflections();
    
    // Update existing or add new
    const existingIndex = reflections.findIndex(r => r.id === reflection.id);
    if (existingIndex >= 0) {
      reflection.updatedAt = new Date().toISOString(); // Update timestamp
      reflections[existingIndex] = reflection;
    } else {
      if (!reflection.id) {
        reflection.id = generateUUID();
      }
      reflection.createdAt = new Date().toISOString();
      reflection.updatedAt = reflection.createdAt;
      reflections.push(reflection);
    }
    
    // Save to storage
    const saved = safeSetItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(reflections));
    return saved;
  } catch (error) {
    console.error('Error saving weekly reflection:', error);
    return false;
  }
};

// Delete a weekly reflection
export const deleteWeeklyReflection = (weekId: string): boolean => {
  try {
    const reflections = getWeeklyReflections();
    const filteredReflections = reflections.filter(r => r.id !== weekId);
    
    if (filteredReflections.length === reflections.length) {
      // Nothing was removed
      return false;
    }
    
    // Save updated list
    const saved = safeSetItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(filteredReflections));
    return saved;
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
    return false;
  }
};

// MONTHLY REFLECTION FUNCTIONS

// Get all monthly reflections
export const getMonthlyReflections = (): MonthlyReflection[] => {
  try {
    const reflectionsJson = safeGetItem(MONTHLY_REFLECTIONS_STORAGE_KEY);
    if (!reflectionsJson) return [];
    
    const parsed = JSON.parse(reflectionsJson);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch (error) {
    console.error('Error loading monthly reflections:', error);
    return [];
  }
};

// Get reflection for a specific month
export const getMonthlyReflection = (monthId: string): MonthlyReflection | null => {
  const reflections = getMonthlyReflections();
  return reflections.find(r => r.id === monthId) || null;
};

// Save a monthly reflection
export const saveMonthlyReflection = (reflection: MonthlyReflection): boolean => {
  try {
    const reflections = getMonthlyReflections();
    
    // Update existing or add new
    const existingIndex = reflections.findIndex(r => r.id === reflection.id);
    if (existingIndex >= 0) {
      reflection.updatedAt = new Date().toISOString(); // Update timestamp
      reflections[existingIndex] = reflection;
    } else {
      if (!reflection.id) {
        reflection.id = generateUUID();
      }
      reflection.createdAt = new Date().toISOString();
      reflection.updatedAt = reflection.createdAt;
      reflections.push(reflection);
    }
    
    // Save to storage
    const saved = safeSetItem(MONTHLY_REFLECTIONS_STORAGE_KEY, JSON.stringify(reflections));
    return saved;
  } catch (error) {
    console.error('Error saving monthly reflection:', error);
    return false;
  }
};

// Delete a monthly reflection
export const deleteMonthlyReflection = (monthId: string): boolean => {
  try {
    const reflections = getMonthlyReflections();
    const filteredReflections = reflections.filter(r => r.id !== monthId);
    
    if (filteredReflections.length === reflections.length) {
      // Nothing was removed
      return false;
    }
    
    // Save updated list
    const saved = safeSetItem(MONTHLY_REFLECTIONS_STORAGE_KEY, JSON.stringify(filteredReflections));
    return saved;
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
    return false;
  }
};
