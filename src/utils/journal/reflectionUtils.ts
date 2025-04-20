
import { format, addDays } from 'date-fns';

/**
 * Get the current period ID for weekly or monthly reflections
 */
export const getCurrentPeriodId = (type: 'weekly' | 'monthly') => {
  const today = new Date();
  
  if (type === 'weekly') {
    // Ensure we're always getting the current week or future week, never past week
    const nextWeek = addDays(today, 1); // Add a day to ensure we're in the current week
    return format(nextWeek, 'yyyy-MM-dd');
  } else {
    return format(today, 'yyyy-MM');
  }
};

/**
 * Count words in a text string, handling HTML content
 */
export const countWords = (text: string): number => {
  if (!text) return 0;

  // Remove HTML tags
  const textOnly = text.replace(/<[^>]*>/g, ' ');
  
  // Remove special chars and collapse whitespace
  const cleanText = textOnly.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Count words
  return cleanText ? cleanText.split(' ').length : 0;
};
