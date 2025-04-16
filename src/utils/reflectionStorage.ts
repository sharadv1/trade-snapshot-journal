
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { generateUUID } from './generateUUID';

// Storage keys
const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Type guards
function isValidReflection(obj: any): boolean {
  return obj && typeof obj === 'object' && 'id' in obj;
}

// Weekly Reflections
export const getWeeklyReflections = async (): Promise<WeeklyReflection[]> => {
  try {
    console.log('Getting weekly reflections from storage');
    const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    if (!reflectionsJson) {
      console.log('No weekly reflections found in storage');
      return [];
    }
    
    let parsed;
    try {
      parsed = JSON.parse(reflectionsJson);
      console.log('Parsed weekly reflections:', typeof parsed);
    } catch (e) {
      console.error('Failed to parse weekly reflections JSON:', e);
      return [];
    }
    
    // Ensure we're returning an array
    if (Array.isArray(parsed)) {
      return parsed.filter(isValidReflection);
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Convert object with reflection entries to array
      const reflections = Object.values(parsed).filter(isValidReflection) as WeeklyReflection[];
      console.log(`Converted ${reflections.length} weekly reflections from object to array`);
      return reflections;
    }
    
    console.log('Unknown format for weekly reflections, returning empty array');
    return [];
  } catch (error) {
    console.error('Error getting weekly reflections:', error);
    return [];
  }
};

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
    
    // Dispatch events to notify of changes
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source: 'deleteWeeklyReflection' } }));
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
    throw error;
  }
};

// Monthly Reflections
export const getMonthlyReflections = async (): Promise<MonthlyReflection[]> => {
  try {
    const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    if (!reflectionsJson) return [];
    
    let parsed;
    try {
      parsed = JSON.parse(reflectionsJson);
    } catch (e) {
      console.error('Failed to parse monthly reflections JSON:', e);
      return [];
    }
    
    // Ensure we're returning an array
    if (Array.isArray(parsed)) {
      return parsed.filter(isValidReflection);
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Convert object with reflection entries to array
      const reflections = Object.values(parsed).filter(isValidReflection) as MonthlyReflection[];
      console.log(`Converted ${reflections.length} monthly reflections from object to array`);
      return reflections;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting monthly reflections:', error);
    return [];
  }
};

export const addMonthlyReflection = async (reflection: MonthlyReflection): Promise<void> => {
  try {
    const reflections = await getMonthlyReflections();
    
    // Ensure the reflection has an ID
    if (!reflection.id) {
      reflection.id = generateUUID();
    }
    
    // Check if a reflection with this monthId already exists
    const existingIndex = reflections.findIndex(r => r.monthId === reflection.monthId);
    
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
    const reflectionsObject: Record<string, MonthlyReflection> = {};
    reflections.forEach(r => {
      const key = r.monthId || r.id;
      if (key) {
        reflectionsObject[key] = r;
      }
    });
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObject));
    
    // Dispatch events to notify of changes
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source: 'addMonthlyReflection' } }));
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error adding monthly reflection:', error);
    throw error;
  }
};

export const updateMonthlyReflection = async (reflection: MonthlyReflection): Promise<void> => {
  try {
    const reflections = await getMonthlyReflections();
    const index = reflections.findIndex(r => r.id === reflection.id);
    
    if (index !== -1) {
      reflections[index] = {
        ...reflections[index],
        ...reflection,
        lastUpdated: new Date().toISOString()
      };
      
      // Convert array back to object format for storage
      const reflectionsObject: Record<string, MonthlyReflection> = {};
      reflections.forEach(r => {
        const key = r.monthId || r.id;
        if (key) {
          reflectionsObject[key] = r;
        }
      });
      
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObject));
      
      // Dispatch events to notify of changes
      window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source: 'updateMonthlyReflection' } }));
      window.dispatchEvent(new Event('storage'));
    } else {
      throw new Error('Reflection not found');
    }
  } catch (error) {
    console.error('Error updating monthly reflection:', error);
    throw error;
  }
};

export const deleteMonthlyReflection = async (id: string): Promise<void> => {
  try {
    const reflections = await getMonthlyReflections();
    const filteredReflections = reflections.filter(r => r.id !== id);
    
    // Convert array back to object format for storage
    const reflectionsObject: Record<string, MonthlyReflection> = {};
    filteredReflections.forEach(r => {
      const key = r.monthId || r.id;
      if (key) {
        reflectionsObject[key] = r;
      }
    });
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflectionsObject));
    
    // Dispatch events to notify of changes
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source: 'deleteMonthlyReflection' } }));
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
    throw error;
  }
};
