
/**
 * Reflection Storage API - Stable version
 * 
 * This file maintains the original stable API for reflections storage
 * to ensure backward compatibility with existing journal functionality.
 */

// Re-export all the storage utilities from their original locations
export { 
  notifyJournalUpdate,
  safeParse,
  debugStorage,
  WEEKLY_REFLECTIONS_KEY,
  MONTHLY_REFLECTIONS_KEY,
  dispatchStorageEvent
} from './storage/storageCore';

// Direct re-exports of the original functions to maintain compatibility
export { 
  getWeeklyReflections,
  getWeeklyReflection,
  getWeeklyReflectionById,
  addWeeklyReflection,
  updateWeeklyReflection,
  deleteWeeklyReflection,
  getAllWeeklyReflections,
  weeklyReflectionExists,
  saveWeeklyReflectionObject,
  saveWeeklyReflection,
  getWeeklyReflectionsForMonth
} from './storage/weeklyReflections';

export { 
  getMonthlyReflections,
  getMonthlyReflection,
  addMonthlyReflection,
  updateMonthlyReflection,
  deleteMonthlyReflection,
  getAllMonthlyReflections,
  monthlyReflectionExists,
  saveMonthlyReflectionObject,
  saveMonthlyReflection
} from './storage/monthlyReflections';

export { 
  associateTradeWithReflections
} from './storage/tradeAssociations';

// Export a compatible version of the duplicate removal utility
export const removeDuplicateReflections = async () => {
  const { removeDuplicateReflections } = await import('./storage/duplicateReflections');
  return removeDuplicateReflections();
};

// Import old APIs and re-export with consistent names
export * from './storage/weeklyReflections';
export * from './storage/monthlyReflections';
