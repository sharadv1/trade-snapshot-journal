
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

export const saveWeeklyReflection = async (
  weekId: string,
  reflection: string, 
  grade?: string, 
  weeklyPlan?: string
) => {
  try {
    // Get the start and end of the week
    const weekDate = new Date(weekId);
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 }); // Start on Monday
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 }); // End on Sunday
    
    // Format dates as ISO strings
    const weekStartISO = weekStart.toISOString();
    const weekEndISO = weekEnd.toISOString();
    
    // Create reflection object
    const reflectionObj: WeeklyReflection = {
      id: generateUUID(),
      weekId: weekId,
      weekStart: weekStartISO,
      weekEnd: weekEndISO,
      reflection,
      grade,
      weeklyPlan,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    
    // Use the custom reflectionStorage
    const { addWeeklyReflection } = await import('@/utils/journal/storage/weeklyReflections');
    await addWeeklyReflection(reflectionObj);
    
    // Dispatch event to notify changes
    window.dispatchEvent(new CustomEvent('journal-updated'));
    
    return reflectionObj;
  } catch (error) {
    console.error("Error saving weekly reflection:", error);
    throw error;
  }
};

export const getWeeklyReflection = async (weekId: string): Promise<WeeklyReflection | null> => {
  try {
    // Use the custom reflectionStorage
    const { getWeeklyReflectionByWeekId } = await import('@/utils/journal/storage/weeklyReflections');
    return await getWeeklyReflectionByWeekId(weekId);
  } catch (error) {
    console.error("Error getting weekly reflection:", error);
    throw error;
  }
};

export const deleteWeeklyReflection = async (id: string): Promise<void> => {
  try {
    // Use the custom reflectionStorage
    const { deleteWeeklyReflectionById } = await import('@/utils/journal/storage/weeklyReflections');
    await deleteWeeklyReflectionById(id);
    
    // Dispatch event to notify changes
    window.dispatchEvent(new CustomEvent('journal-updated'));
  } catch (error) {
    console.error("Error deleting weekly reflection:", error);
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
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    
    // Use the custom reflectionStorage
    const { addMonthlyReflection } = await import('@/utils/journal/storage/monthlyReflections');
    await addMonthlyReflection(reflectionObj);
    
    // Dispatch event to notify changes
    window.dispatchEvent(new CustomEvent('journal-updated'));
    
    return reflectionObj;
  } catch (error) {
    console.error("Error saving monthly reflection:", error);
    throw error;
  }
};

export const getMonthlyReflection = async (monthId: string): Promise<MonthlyReflection | null> => {
  try {
    // Use the custom reflectionStorage
    const { getMonthlyReflectionByMonthId } = await import('@/utils/journal/storage/monthlyReflections');
    return await getMonthlyReflectionByMonthId(monthId);
  } catch (error) {
    console.error("Error getting monthly reflection:", error);
    throw error;
  }
};

export const deleteMonthlyReflection = async (id: string): Promise<void> => {
  try {
    // Use the custom reflectionStorage
    const { deleteMonthlyReflectionById } = await import('@/utils/journal/storage/monthlyReflections');
    await deleteMonthlyReflectionById(id);
    
    // Dispatch event to notify changes
    window.dispatchEvent(new CustomEvent('journal-updated'));
  } catch (error) {
    console.error("Error deleting monthly reflection:", error);
    throw error;
  }
};

export const removeDuplicateReflections = () => {
  try {
    const { removeDuplicates } = require('@/utils/journal/storage/duplicateReflections');
    return removeDuplicates();
  } catch (error) {
    console.error("Error removing duplicate reflections:", error);
    throw error;
  }
};
