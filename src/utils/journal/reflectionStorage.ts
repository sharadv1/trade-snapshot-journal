
/**
 * Reflection Storage API - Re-exports from modular storage system
 * 
 * This file serves as the main entry point for reflection storage operations
 * and re-exports all the necessary functions from the modular storage system.
 * 
 * This approach keeps the API consistent while allowing for better modularization
 * and performance optimization.
 */

// Core storage utilities - minimizing what we expose to prevent circular imports
export { 
  notifyJournalUpdate,
  safeParse,
  debugStorage,
  WEEKLY_REFLECTIONS_KEY,
  MONTHLY_REFLECTIONS_KEY,
  dispatchStorageEvent
} from './storage/storageCore';

// Weekly reflection operations - with optimized implementations
export { 
  getWeeklyReflections,
  getWeeklyReflection,
  addWeeklyReflection,
  updateWeeklyReflection,
  deleteWeeklyReflection,
  getAllWeeklyReflections,
  weeklyReflectionExists,
  saveWeeklyReflectionObject,
  saveWeeklyReflection,
  getWeeklyReflectionsForMonth
} from './storage/weeklyReflections';

// Monthly reflection operations
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

// Trade association operations - now with memory caching and optimized processing
export {
  associateTradeWithReflections,
  clearTradeAssociationCache
} from './storage/tradeAssociations';

// Duplicate removal utilities
export {
  removeDuplicateReflections
} from './storage/duplicateReflections';

// Note: We've optimized the performance by reducing event dispatches and implementing
// caching in key areas of the storage system.
