/**
 * Reflection Storage API - Re-exports from modular storage system
 */

// Core storage utilities
export { 
  notifyJournalUpdate 
} from './storage/storageCore';

// Weekly reflection operations
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

// Trade association operations
export {
  associateTradeWithReflections
} from './storage/tradeAssociations';

// Duplicate removal utilities
export {
  removeDuplicateReflections
} from './storage/duplicateReflections';

// For backward compatibility - ensure all functions return the same values
// and behave exactly as they did in the original file
