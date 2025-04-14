
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { generateUUID } from './generateUUID';

// Storage keys
const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Weekly Reflections
export const getWeeklyReflections = async (): Promise<WeeklyReflection[]> => {
  try {
    const reflectionsJson = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    return reflectionsJson ? JSON.parse(reflectionsJson) : [];
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
      // Add a new reflection
      reflections.push({
        ...reflection,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
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
      
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
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
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(filteredReflections));
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
    throw error;
  }
};

// Monthly Reflections
export const getMonthlyReflections = async (): Promise<MonthlyReflection[]> => {
  try {
    const reflectionsJson = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    return reflectionsJson ? JSON.parse(reflectionsJson) : [];
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
      // Add a new reflection
      reflections.push({
        ...reflection,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
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
      
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
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
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(filteredReflections));
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
    throw error;
  }
};
