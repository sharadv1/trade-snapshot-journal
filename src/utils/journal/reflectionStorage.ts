
import { WeeklyReflection, MonthlyReflection } from '@/types';
import { generateUUID } from '@/utils/generateUUID';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

// Export functions to get all reflections
export const getWeeklyReflections = async (): Promise<WeeklyReflection[]> => {
  try {
    const { getWeeklyReflections: getWeeklyReflectionsImpl } = await import('@/utils/journal/storage/weeklyReflections');
    return await getWeeklyReflectionsImpl();
  } catch (error) {
    console.error("Error getting weekly reflections:", error);
    return [];
  }
};

export const getMonthlyReflections = async (): Promise<MonthlyReflection[]> => {
  try {
    const { getMonthlyReflections: getMonthlyReflectionsImpl } = await import('@/utils/journal/storage/monthlyReflections');
    return await getMonthlyReflectionsImpl();
  } catch (error) {
    console.error("Error getting monthly reflections:", error);
    return [];
  }
};

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
      lastUpdated: new Date().toISOString(),
    };
    
    // Use the weekly reflections storage
    const { saveWeeklyReflection: saveWeeklyReflectionImpl } = await import('@/utils/journal/storage/weeklyReflections');
    await saveWeeklyReflectionImpl(weekId, reflection, grade, weeklyPlan);
    
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
    // Use the weekly reflections storage
    const { getWeeklyReflection: getWeeklyReflectionImpl } = await import('@/utils/journal/storage/weeklyReflections');
    return await getWeeklyReflectionImpl(weekId);
  } catch (error) {
    console.error("Error getting weekly reflection:", error);
    throw error;
  }
};

export const deleteWeeklyReflection = async (id: string): Promise<void> => {
  try {
    // Use the weekly reflections storage
    const { deleteWeeklyReflection: deleteWeeklyReflectionImpl } = await import('@/utils/journal/storage/weeklyReflections');
    await deleteWeeklyReflectionImpl(id);
    
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
