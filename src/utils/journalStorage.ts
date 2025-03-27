
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
  console.log('Retrieved weekly reflections from storage:', storedReflections);
  return safeParse(storedReflections) as { [weekId: string]: WeeklyReflection };
};

export const getMonthlyReflections = (): { [monthId: string]: MonthlyReflection } => {
  const storedReflections = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
  console.log('Retrieved monthly reflections from storage:', storedReflections);
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

// Helper function to dispatch storage event
const dispatchStorageEvent = (key: string) => {
  // Create a custom event that mimics the storage event
  const event = new Event('storage');
  window.dispatchEvent(event);
};

export const saveWeeklyReflection = (weekId: string, reflection: string, grade?: string): void => {
  console.log(`Saving weekly reflection for ${weekId}:`, reflection);
  try {
    const reflections = getWeeklyReflections();
    
    // Create the start and end dates for the current week
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1)); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    
    // Create or update the reflection
    reflections[weekId] = {
      ...reflections[weekId],
      id: weekId, // Ensure id is always set
      weekId: weekId, // Ensure weekId is always set
      weekStart: reflections[weekId]?.weekStart || weekStart.toISOString(),
      weekEnd: reflections[weekId]?.weekEnd || weekEnd.toISOString(),
      reflection,
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[weekId]?.tradeIds || []
    };
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    // Dispatch a storage event to notify other components
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    console.log('Weekly reflection saved successfully');
  } catch (error) {
    console.error('Error saving weekly reflection:', error);
  }
};

export const saveMonthlyReflection = (monthId: string, reflection: string, grade?: string): void => {
  console.log(`Saving monthly reflection for ${monthId}:`, reflection);
  try {
    const reflections = getMonthlyReflections();
    
    // Create the start and end dates for the current month
    const currentDate = new Date();
    const year = parseInt(monthId.split('-')[0], 10);
    const month = parseInt(monthId.split('-')[1], 10) - 1; // JS months are 0-based
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    // Create or update the reflection
    reflections[monthId] = {
      ...reflections[monthId],
      id: monthId, // Ensure id is always set
      monthId: monthId, // Ensure monthId is always set
      monthStart: reflections[monthId]?.monthStart || monthStart.toISOString(),
      monthEnd: reflections[monthId]?.monthEnd || monthEnd.toISOString(),
      reflection,
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[monthId]?.tradeIds || []
    };
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    // Dispatch a storage event to notify other components
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    console.log('Monthly reflection saved successfully');
  } catch (error) {
    console.error('Error saving monthly reflection:', error);
  }
};

// Update full reflection object functions
export const saveWeeklyReflectionObject = (reflection: WeeklyReflection): void => {
  try {
    const reflections = getWeeklyReflections();
    const weekId = reflection.weekId || reflection.id || '';
    
    if (!weekId) {
      console.error('Cannot save reflection without id or weekId');
      return;
    }
    
    reflections[weekId] = {
      ...reflection,
      id: weekId, // Ensure id is always set
      weekId: weekId, // Ensure weekId is always set
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    // Dispatch a storage event to notify other components
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error saving weekly reflection object:', error);
  }
};

export const saveMonthlyReflectionObject = (reflection: MonthlyReflection): void => {
  try {
    const reflections = getMonthlyReflections();
    const monthId = reflection.monthId || reflection.id || '';
    
    if (!monthId) {
      console.error('Cannot save reflection without id or monthId');
      return;
    }
    
    reflections[monthId] = {
      ...reflection,
      id: monthId, // Ensure id is always set
      monthId: monthId, // Ensure monthId is always set
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    // Dispatch a storage event to notify other components
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error saving monthly reflection object:', error);
  }
};

export const deleteWeeklyReflection = (weekId: string): void => {
  try {
    const reflections = getWeeklyReflections();
    delete reflections[weekId];
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    // Dispatch a storage event to notify other components
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
  }
};

export const deleteMonthlyReflection = (monthId: string): void => {
  try {
    const reflections = getMonthlyReflections();
    delete reflections[monthId];
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    // Dispatch a storage event to notify other components
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
  }
};
