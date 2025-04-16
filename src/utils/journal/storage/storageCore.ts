import { toast } from '@/utils/toast';

// Storage keys - keep these consistent across files
export const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
export const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

// Event notification utilities
let lastEventDispatchTime: Record<string, number> = {};
const MIN_EVENT_INTERVAL = 750; // Increased to reduce event frequency

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
  
  // If we've dispatched this event recently, debounce it with longer interval
  if (debouncedEvents[debounceKey] && now - debouncedEvents[debounceKey].lastFired < MIN_EVENT_INTERVAL) {
    debouncedEvents[debounceKey].timer = setTimeout(() => {
      dispatchJournalEvents(source);
      debouncedEvents[debounceKey].lastFired = Date.now();
      debouncedEvents[debounceKey].timer = null;
    }, MIN_EVENT_INTERVAL);
    return;
  }
  
  // Otherwise dispatch with a small delay to allow batching
  setTimeout(() => {
    dispatchJournalEvents(source);
  }, 50);
  
  // Update the debounce tracking
  debouncedEvents[debounceKey] = {
    timer: null,
    lastFired: now
  };
}

/**
 * Helper to actually dispatch events safely, preventing redundancy
 */
function dispatchJournalEvents(source: string): void {
  try {
    // Only dispatch one type of event to reduce cascading updates
    window.dispatchEvent(new CustomEvent('journal-updated', { detail: { source } }));
  } catch (error) {
    console.error('Error dispatching journal update events:', error);
  }
}

/**
 * Dispatches storage events with rate limiting, using a more focused approach
 */
export function dispatchStorageEvent(key: string): void {
  const now = Date.now();
  if (lastEventDispatchTime[key] && (now - lastEventDispatchTime[key] < MIN_EVENT_INTERVAL)) {
    // Skip dispatching if too recent, but don't log to reduce console noise
    return;
  }
  
  lastEventDispatchTime[key] = now;
  
  try {
    // Use a small timeout to batch potential multiple updates
    setTimeout(() => {
      try {
        const customEvent = new CustomEvent('journal-updated', { detail: { key } });
        window.dispatchEvent(customEvent);
      } catch (err) {
        console.error('Error in delayed event dispatch:', err);
      }
    }, 50);
  } catch (e) {
    console.error('Error setting up event dispatch:', e);
  }
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
  // Only log in development environment to reduce console noise
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[JOURNAL STORAGE] ${action} for key "${key}"`);
    if (data) {
      console.log('Data:', typeof data === 'string' ? data.substring(0, 50) + '...' : data);
    }
  }
}
