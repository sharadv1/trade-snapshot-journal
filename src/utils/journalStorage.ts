import { WeeklyReflection, MonthlyReflection } from '@/types';

const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Helper function to safely parse JSON from localStorage
const safeParse = <T>(value: string | null): T | {} => {
  try {
    return value ? JSON.parse(value) : {};
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return {};
  }
};

export const getWeeklyReflections = (): { [weekId: string]: WeeklyReflection } => {
  const storedReflections = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
  return safeParse(storedReflections) as { [weekId: string]: WeeklyReflection };
};

export const getMonthlyReflections = (): { [monthId: string]: MonthlyReflection } => {
  const storedReflections = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
  return safeParse(storedReflections) as { [monthId: string]: MonthlyReflection };
};

export const getWeeklyReflection = (weekId: string): WeeklyReflection | undefined => {
  const reflections = getWeeklyReflections();
  return reflections[weekId];
};

export const getMonthlyReflection = (monthId: string): MonthlyReflection | undefined => {
  const reflections = getMonthlyReflections();
  return reflections[monthId];
};

export const saveWeeklyReflection = (weekId: string, reflection: string, grade?: string): void => {
  console.log(`Saving weekly reflection for ${weekId}:`, reflection);
  try {
    const reflections = getWeeklyReflections();
    
    // Create or update the reflection
    reflections[weekId] = {
      ...reflections[weekId],
      reflection,
      grade,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    console.log('Weekly reflection saved successfully');
  } catch (error) {
    console.error('Error saving weekly reflection:', error);
  }
};

export const saveMonthlyReflection = (monthId: string, reflection: string, grade?: string): void => {
  console.log(`Saving monthly reflection for ${monthId}:`, reflection);
  try {
    const reflections = getMonthlyReflections();
    
    // Create or update the reflection
    reflections[monthId] = {
      ...reflections[monthId],
      reflection,
      grade,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    console.log('Monthly reflection saved successfully');
  } catch (error) {
    console.error('Error saving monthly reflection:', error);
  }
};

export const deleteWeeklyReflection = (weekId: string): void => {
  try {
    const reflections = getWeeklyReflections();
    delete reflections[weekId];
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
  }
};

export const deleteMonthlyReflection = (monthId: string): void => {
  try {
    const reflections = getMonthlyReflections();
    delete reflections[monthId];
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
  }
};
