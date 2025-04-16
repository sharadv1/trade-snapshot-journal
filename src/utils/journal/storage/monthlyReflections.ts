
import { MonthlyReflection } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { 
  MONTHLY_REFLECTIONS_KEY, 
  notifyJournalUpdate, 
  dispatchStorageEvent,
  safeParse,
  debugStorage
} from './storageCore';
import { toast } from '@/utils/toast';

/**
 * Get all monthly reflections
 */
export async function getMonthlyReflections(): Promise<MonthlyReflection[]> {
  try {
    const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    
    if (!reflectionsJson) {
      return [];
    }
    
    const parsed = JSON.parse(reflectionsJson);
    
    // Handle both array and object formats
    if (Array.isArray(parsed)) {
      return parsed.filter(r => r && typeof r === 'object' && 'id' in r);
    } else if (parsed && typeof parsed === 'object') {
      // Convert object to array for consistency
      return Object.values(parsed).filter(r => r && typeof r === 'object' && 'id' in r) as MonthlyReflection[];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting monthly reflections:', error);
    return [];
  }
}

/**
 * Get a specific monthly reflection by its monthId
 */
export async function getMonthlyReflection(monthId: string): Promise<MonthlyReflection | null> {
  try {
    const reflections = await getMonthlyReflections();
    return reflections.find(r => r.monthId === monthId) || null;
  } catch (error) {
    console.error(`Error getting monthly reflection for ${monthId}:`, error);
    return null;
  }
}

/**
 * Add or update a monthly reflection
 */
export async function addMonthlyReflection(reflection: MonthlyReflection): Promise<void> {
  try {
    // Ensure reflection has required fields
    if (!reflection.id) {
      reflection.id = generateUUID();
    }
    
    if (!reflection.lastUpdated) {
      reflection.lastUpdated = new Date().toISOString();
    }
    
    const reflections = await getMonthlyReflections();
    const existingIndex = reflections.findIndex(r => r.monthId === reflection.monthId);
    
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
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    // Notify of update
    notifyJournalUpdate('addMonthlyReflection');
  } catch (error) {
    console.error('Error adding monthly reflection:', error);
    throw error;
  }
}

/**
 * Update an existing monthly reflection
 */
export async function updateMonthlyReflection(reflection: MonthlyReflection): Promise<void> {
  try {
    const reflections = await getMonthlyReflections();
    const index = reflections.findIndex(r => r.id === reflection.id);
    
    if (index !== -1) {
      reflections[index] = {
        ...reflections[index],
        ...reflection,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
      notifyJournalUpdate('updateMonthlyReflection');
    } else {
      throw new Error('Reflection not found');
    }
  } catch (error) {
    console.error('Error updating monthly reflection:', error);
    throw error;
  }
}

/**
 * Delete a monthly reflection
 */
export async function deleteMonthlyReflection(id: string): Promise<void> {
  try {
    const reflections = await getMonthlyReflections();
    const updatedReflections = reflections.filter(r => r.id !== id);
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(updatedReflections));
    notifyJournalUpdate('deleteMonthlyReflection');
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
    throw error;
  }
}

/**
 * Get all monthly reflections as an object keyed by monthId
 */
export function getAllMonthlyReflections() {
  try {
    console.log('[JOURNAL STORAGE] Getting ALL monthly reflections for key "trade-journal-monthly-reflections"');
    const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    
    if (!reflectionsJson) {
      console.log('No monthly reflections found in local storage');
      return {};
    }
    
    console.log('Data:', reflectionsJson.substring(0, 100) + '...');
    
    try {
      const data = JSON.parse(reflectionsJson);
      return data || {};
    } catch (e) {
      console.error('Failed to parse monthly reflections JSON:', e);
      return {};
    }
  } catch (error) {
    console.error('Error getting all monthly reflections:', error);
    return {};
  }
}

/**
 * Check if a monthly reflection exists
 */
export function monthlyReflectionExists(monthId: string): boolean {
  if (!monthId) return false;
  const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
  if (!reflectionsJson) return false;
  
  try {
    const reflections = JSON.parse(reflectionsJson);
    return !!reflections[monthId];
  } catch {
    return false;
  }
}

/**
 * Save a monthly reflection object directly
 */
export function saveMonthlyReflectionObject(reflection: MonthlyReflection): void {
  try {
    if (!reflection) {
      console.error('Cannot save null reflection object');
      return;
    }
    
    const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    const reflections = safeParse(reflectionsJson, {});
    const monthId = reflection.monthId || reflection.id || '';
    
    if (!monthId) {
      console.error('Cannot save reflection without id or monthId');
      return;
    }
    
    reflections[monthId] = {
      ...reflection,
      id: monthId,
      monthId: monthId,
      lastUpdated: new Date().toISOString(),
      isPlaceholder: false
    };
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    console.log(`Monthly reflection object saved successfully for ${monthId}`);
  } catch (error) {
    console.error('Error saving monthly reflection object:', error);
  }
}

/**
 * Save a monthly reflection with text content
 */
export function saveMonthlyReflection(monthId: string, reflection: string, grade?: string): void {
  if (!monthId) {
    console.error('Cannot save monthly reflection: monthId is empty');
    return;
  }
  
  debugStorage('Saving monthly reflection', monthId, {reflection: reflection.substring(0, 50) + '...', grade});
  
  try {
    const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    const reflections = safeParse(reflectionsJson, {});
    
    let year: number;
    let month: number;
    
    if (monthId.match(/^\d{4}-\d{2}$/)) {
      year = parseInt(monthId.split('-')[0], 10);
      month = parseInt(monthId.split('-')[1], 10) - 1;
    } else {
      const date = new Date(monthId);
      year = date.getFullYear();
      month = date.getMonth();
    }
    
    if (isNaN(year) || isNaN(month)) {
      console.error(`Invalid monthId format: ${monthId}, expected 'YYYY-MM'`);
      return;
    }
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const exactMonthId = monthId;
    
    reflections[exactMonthId] = {
      ...reflections[exactMonthId],
      id: exactMonthId,
      monthId: exactMonthId,
      monthStart: reflections[exactMonthId]?.monthStart || monthStart.toISOString(),
      monthEnd: reflections[exactMonthId]?.monthEnd || monthEnd.toISOString(),
      reflection,
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[exactMonthId]?.tradeIds || [],
      isPlaceholder: false
    };
    
    debugStorage("Saving monthly reflection object", exactMonthId, reflections[exactMonthId]);
    
    const reflectionsJson2 = JSON.stringify(reflections);
    
    try {
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, reflectionsJson2);
      
      const savedData = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
      if (!savedData) {
        throw new Error('Failed to retrieve data after saving');
      }
      
      const parsedData = JSON.parse(savedData);
      if (!parsedData[exactMonthId]) {
        throw new Error(`Saved data doesn't contain the monthId: ${exactMonthId}`);
      }
      
      debugStorage('Monthly reflection saved successfully', exactMonthId);
    } catch (error) {
      console.error('Error saving monthly reflection:', error);
      
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
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error in saveMonthlyReflection:', error);
    toast.error('Failed to save monthly reflection');
  }
}
