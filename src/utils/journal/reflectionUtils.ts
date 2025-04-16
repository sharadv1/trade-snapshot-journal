
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { startOfWeek, format } from 'date-fns';

/**
 * Count words in a string, handling HTML content
 */
export function countWords(text: string = ''): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, ' ');
  
  // Remove extra spaces and split by spaces
  const words = plainText.trim().replace(/\s+/g, ' ').split(' ');
  
  // Filter out empty strings
  return words.filter(word => word.length > 0).length;
}

/**
 * Format a grade for display with appropriate color class
 */
export function getGradeColorClass(grade?: string): string {
  if (!grade) return 'bg-gray-100 text-gray-800';
  
  if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
  if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

/**
 * Check if a reflection has content
 */
export function hasContent(reflection: WeeklyReflection | MonthlyReflection): boolean {
  if (!reflection) return false;
  
  // Check for isPlaceholder flag
  if (reflection.isPlaceholder === true) {
    return false;
  }
  
  // Check for weekly reflection content
  if ('weeklyPlan' in reflection) {
    return !!(reflection.reflection || reflection.weeklyPlan);
  }
  
  // Check for monthly reflection content
  return !!reflection.reflection;
}

/**
 * Get current week/month ID for the "New" button
 */
export function getCurrentPeriodId(type: 'weekly' | 'monthly'): string {
  const today = new Date();
  
  if (type === 'weekly') {
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return format(currentWeekStart, 'yyyy-MM-dd');
  } else {
    return format(today, 'yyyy-MM');
  }
}

/**
 * Get statistics for a reflection
 */
export function getReflectionStats(reflection: WeeklyReflection | MonthlyReflection) {
  return {
    pnl: typeof reflection.totalPnL === 'number' ? reflection.totalPnL : 0,
    rValue: typeof reflection.totalR === 'number' ? reflection.totalR : 0,
    tradeCount: Array.isArray(reflection.tradeIds) ? reflection.tradeIds.length : 0,
    hasContent: hasContent(reflection)
  };
}
