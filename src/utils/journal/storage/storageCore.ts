
// Storage keys
export const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
export const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Debug flag
let DEBUG_STORAGE = false;

/**
 * Enable or disable storage debugging
 */
export function setStorageDebug(debug: boolean) {
  DEBUG_STORAGE = debug;
}

/**
 * Debug log for storage operations
 */
export function debugStorage(...args: any[]) {
  if (DEBUG_STORAGE) {
    console.log('[Storage]', ...args);
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return null;
  }
}

/**
 * Notify the application about journal updates
 */
export function notifyJournalUpdate(source: string): void {
  try {
    window.dispatchEvent(new CustomEvent('journal-updated', { 
      detail: { source, timestamp: new Date().toISOString() } 
    }));
    debugStorage(`Journal updated notification sent (source: ${source})`);
  } catch (error) {
    console.error('Error dispatching journal update event:', error);
  }
}

/**
 * Dispatch a storage event to notify other tabs
 */
export function dispatchStorageEvent(): void {
  try {
    window.dispatchEvent(new Event('storage'));
    debugStorage('Storage event dispatched');
  } catch (error) {
    console.error('Error dispatching storage event:', error);
  }
}
