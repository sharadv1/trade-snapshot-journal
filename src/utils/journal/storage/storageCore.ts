
import { toast } from '@/utils/toast';

// Storage keys
export const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
export const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';
export const TRADE_ASSOCIATIONS_KEY = 'trade-journal-trade-associations';

// Debug flag (can be set via localStorage.setItem('trade-journal-debug', 'true'))
const DEBUG_STORAGE = localStorage.getItem('trade-journal-debug') === 'true';

// Utility to safely parse JSON with fallback
export function safeParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
}

// Utility to log debug information
export function debugStorage(message: string, key?: string): void {
  if (DEBUG_STORAGE) {
    console.log(`[Storage Debug] ${message}${key ? ` (${key})` : ''}`);
  }
}

// Dispatch storage event to notify components
export function dispatchStorageEvent(): void {
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error dispatching storage event:', e);
  }
}

// Notify journal updates
export function notifyJournalUpdate(source: string): void {
  try {
    debugStorage(`Journal updated from ${source}`);
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source } }));
  } catch (e) {
    console.error('Error dispatching journal-updated event:', e);
  }
}

// Generic function to get data from localStorage with error handling
export function getDataFromStorage<T>(key: string, defaultValue: T): T {
  try {
    debugStorage(`Getting data from storage`, key);
    const json = localStorage.getItem(key);
    return safeParse(json, defaultValue);
  } catch (error) {
    console.error(`Error getting data from storage (${key}):`, error);
    return defaultValue;
  }
}

// Generic function to save data to localStorage with error handling
export function saveDataToStorage<T>(key: string, data: T): boolean {
  try {
    debugStorage(`Saving data to storage`, key);
    localStorage.setItem(key, JSON.stringify(data));
    dispatchStorageEvent();
    return true;
  } catch (error) {
    console.error(`Error saving data to storage (${key}):`, error);
    
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toast.error('Storage limit exceeded. Try removing some data before saving.');
    } else {
      toast.error(`Failed to save data (${key.split('-').pop()})`);
    }
    
    return false;
  }
}
