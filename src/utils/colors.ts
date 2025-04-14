
/**
 * Color utility functions for the application
 */

/**
 * Get a random color from a predefined palette of colors
 * suitable for strategy tags, badges, etc.
 */
export const getRandomColor = (): string => {
  const colors = [
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#F97316', // Bright Orange
    '#0EA5E9', // Ocean Blue
    '#10B981', // Emerald Green
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#A855F7'  // Purple
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};
