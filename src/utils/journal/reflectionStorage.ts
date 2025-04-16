
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { generateUUID } from '../generateUUID';

// Storage keys
const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

/**
 * Get all weekly reflections
 */
export async function getWeeklyReflections(): Promise<WeeklyReflection[]> {
  try {
    const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    
    if (!reflectionsJson) {
      return [];
    }
    
    const parsed = JSON.parse(reflectionsJson);
    
    // Handle both array and object formats
    if (Array.isArray(parsed)) {
      return parsed.filter(r => r && typeof r === 'object' && r.id);
    } else if (parsed && typeof parsed === 'object') {
      // Convert object to array for consistency
      return Object.values(parsed).filter(r => r && typeof r === 'object' && r.id) as WeeklyReflection[];
    }
    
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
      return parsed.filter(r => r && typeof r === 'object' && r.id);
    } else if (parsed && typeof parsed === 'object') {
      // Convert object to array for consistency
      return Object.values(parsed).filter(r => r && typeof r === 'object' && r.id) as MonthlyReflection[];
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
 * Dispatches events to notify of journal updates
 */
function notifyJournalUpdate(source: string): void {
  window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source } }));
  window.dispatchEvent(new Event('storage'));
}
