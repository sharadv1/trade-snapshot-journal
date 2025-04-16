import { toast } from '@/utils/toast';

// Storage keys - keep these consistent across files
export const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
export const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Event notification utilities
let lastEventDispatchTime: Record<string, number> = {};
const MIN_EVENT_INTERVAL = 500;

/**
 * Dispatches events to notify of journal updates with rate limiting
 */
export function notifyJournalUpdate(source: string): void {
  window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source } }));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Dispatches storage events with rate limiting
 */
export function dispatchStorageEvent(key: string): void {
  const now = Date.now();
  if (lastEventDispatchTime[key] && (now - lastEventDispatchTime[key] < MIN_EVENT_INTERVAL)) {
    console.log(`Skipping event dispatch for ${key} - too soon after last event`);
    return;
  }
  
  lastEventDispatchTime[key] = now;
  
  const customEvent = new CustomEvent('journalUpdated', { detail: { key } });
  window.dispatchEvent(customEvent);
  
  const anotherCustomEvent = new CustomEvent('journal-updated', { detail: { key } });
  window.dispatchEvent(anotherCustomEvent);
  
  try {
    const storageEvent = new StorageEvent('storage', { key });
    window.dispatchEvent(storageEvent);
  } catch (e) {
    console.error('Error dispatching storage event:', e);
    window.dispatchEvent(new Event('storage'));
  }
  
  console.log(`Storage events dispatched for key: ${key}`);
}

/**
 * Safely parses JSON from localStorage with fallback
 */
export function safeParse<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) {
      console.error('Invalid data format in localStorage, expected object but got:', typeof parsed);
      return defaultValue;
    }
    return parsed as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Debug helper for storage operations
 */
export function debugStorage(action: string, key: string, data?: any): void {
  console.log(`[JOURNAL STORAGE] ${action} for key "${key}"`);
  if (data) {
    console.log('Data:', typeof data === 'string' ? data.substring(0, 100) + '...' : data);
  }
  
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) allKeys.push(k);
  }
  console.log('All localStorage keys:', allKeys);
}
