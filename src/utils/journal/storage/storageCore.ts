import { toast } from '@/utils/toast';

// Storage keys - keep these consistent across files
export const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
export const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Event notification utilities
let lastEventDispatchTime: Record<string, number> = {};
const MIN_EVENT_INTERVAL = 500;

// Debounce management for events
interface DebouncedEvent {
  timer: NodeJS.Timeout | null;
  lastFired: number;
}

const debouncedEvents: Record<string, DebouncedEvent> = {};

/**
 * Dispatches events to notify of journal updates with rate limiting and debouncing
 */
export function notifyJournalUpdate(source: string): void {
  const debounceKey = `journal-updated-${source}`;
  const now = Date.now();
  
  // Cancel any pending updates for this source
  if (debouncedEvents[debounceKey] && debouncedEvents[debounceKey].timer) {
    clearTimeout(debouncedEvents[debounceKey].timer);
  }
  
  // If we've dispatched this event recently, debounce it
  if (debouncedEvents[debounceKey] && now - debouncedEvents[debounceKey].lastFired < MIN_EVENT_INTERVAL) {
    debouncedEvents[debounceKey].timer = setTimeout(() => {
      dispatchJournalEvents(source);
      debouncedEvents[debounceKey].lastFired = Date.now();
      debouncedEvents[debounceKey].timer = null;
    }, MIN_EVENT_INTERVAL);
    return;
  }
  
  // Otherwise dispatch immediately
  dispatchJournalEvents(source);
  
  // Update the debounce tracking
  debouncedEvents[debounceKey] = {
    timer: null,
    lastFired: now
  };
}

/**
 * Helper to actually dispatch events safely
 */
function dispatchJournalEvents(source: string): void {
  try {
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source } }));
    
    // Only dispatch the storage event once - this is the most expensive
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error dispatching storage event:', error);
    }
  } catch (error) {
    console.error('Error dispatching journal update events:', error);
  }
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
  
  try {
    // Only dispatch one type of event to reduce cascading updates
    const customEvent = new CustomEvent('journal-updated', { detail: { key } });
    window.dispatchEvent(customEvent);
    
    // Don't dispatch these redundant events which cause cascading updates
    // window.dispatchEvent(new CustomEvent('journalUpdated', { detail: { key } }));
    // window.dispatchEvent(new StorageEvent('storage', { key }));
  } catch (e) {
    console.error('Error dispatching events:', e);
  }
  
  console.log(`Storage event dispatched for key: ${key}`);
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
}
