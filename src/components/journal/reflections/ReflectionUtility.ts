
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { startOfWeek, format } from 'date-fns';

// Function to count words in a string, handling HTML content
export const countWords = (htmlString: string = ''): number => {
  if (!htmlString) return 0;
  
  // Remove HTML tags
  const text = htmlString.replace(/<[^>]*>/g, ' ');
  
  // Remove extra spaces and split by spaces
  const words = text.trim().replace(/\s+/g, ' ').split(' ');
  
  // Filter out empty strings
  return words.filter(word => word.length > 0).length;
};

// Check if a reflection has actual content - respecting the isPlaceholder flag
export const hasContent = (
  reflection: WeeklyReflection | MonthlyReflection, 
  type: 'weekly' | 'monthly',
  statsHasContent: boolean
): boolean => {
  // Check for isPlaceholder flag
  if ('isPlaceholder' in reflection && reflection.isPlaceholder === true) {
    return false;
  }
  
  if (type === 'weekly') {
    const weeklyReflection = reflection as WeeklyReflection;
    return !!(weeklyReflection.reflection || weeklyReflection.weeklyPlan) && statsHasContent;
  } else {
    const monthlyReflection = reflection as MonthlyReflection;
    return !!monthlyReflection.reflection && statsHasContent;
  }
};

// Get current week/month ID for the "New" button
export const getCurrentPeriodId = (type: 'weekly' | 'monthly'): string => {
  const today = new Date();
  if (type === 'weekly') {
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return format(currentWeekStart, 'yyyy-MM-dd');
  } else {
    return format(today, 'yyyy-MM');
  }
};
