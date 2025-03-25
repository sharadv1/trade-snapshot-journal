
import { Trade } from '@/types';
import { toast } from '@/utils/toast';

// Local storage keys
export const TRADES_STORAGE_KEY = 'trade-journal-trades';

// Server URL storage key
export const SERVER_URL_KEY = 'trade-journal-server-url';

// Flag to determine if using server sync or just localStorage
let useServerSync = false;
let serverUrl = '';

// Get the server connection status
export const isUsingServerSync = (): boolean => {
  return useServerSync;
};

export const getServerUrl = (): string => {
  return serverUrl;
};

export const setServerSync = (enabled: boolean, url: string = ''): void => {
  useServerSync = enabled;
  serverUrl = url;
  
  // Log to help with debugging
  console.log(`Server sync ${enabled ? 'enabled' : 'disabled'}${enabled ? ' with URL: ' + url : ''}`);
};

// Safe localStorage getter with error handling
const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage is not available in this environment');
      return null;
    }
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error);
    return null;
  }
};

// Safe localStorage setter with error handling
const safeSetItem = (key: string, value: string): boolean => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage is not available in this environment');
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting localStorage for key ${key}:`, error);
    return false;
  }
};

// Checks if a value is a valid trade object
const isValidTrade = (trade: any): boolean => {
  return (
    trade && 
    typeof trade === 'object' &&
    typeof trade.id === 'string' &&
    typeof trade.symbol === 'string'
  );
};

// Synchronous version for components that can't use async/await
export const getTradesSync = (): Trade[] => {
  try {
    console.log('Getting trades from localStorage synchronously');
    const tradesJson = safeGetItem(TRADES_STORAGE_KEY);
    if (!tradesJson) {
      console.info('No trades found in localStorage');
      return [];
    }
    
    let parsed;
    try {
      parsed = JSON.parse(tradesJson);
    } catch (parseError) {
      console.error('Failed to parse trades JSON:', parseError);
      return [];
    }
    
    if (!Array.isArray(parsed)) {
      console.error('Invalid trades data format in localStorage, expected array but got:', typeof parsed);
      return [];
    }
    
    // Filter out invalid trades and ensure all trades have required fields
    const validTrades = parsed
      .filter(isValidTrade)
      .map(trade => ({
        ...trade,
        direction: trade.direction || 'long', // Default to 'long' if direction is missing
        type: trade.type || 'equity',         // Ensure type exists
        status: trade.status || 'closed',     // Ensure status exists
        partialExits: Array.isArray(trade.partialExits) ? trade.partialExits : [],
        tags: Array.isArray(trade.tags) ? trade.tags : [],
        images: Array.isArray(trade.images) ? trade.images : []
      }));
    
    // Log the count of valid trades found
    console.info(`Found ${validTrades.length} valid trades in localStorage`);
    return validTrades;
  } catch (error) {
    console.error('Error getting trades from localStorage:', error);
    return [];
  }
};

// Enhanced save trades function with better error handling
export const saveTrades = async (trades: Trade[]): Promise<void> => {
  if (!trades || !Array.isArray(trades)) {
    console.error('Invalid trades data:', trades);
    toast.error('Invalid trade data format');
    return;
  }
  
  // Ensure all trades have required fields to prevent rendering errors
  const validatedTrades = trades.map(trade => ({
    ...trade,
    id: trade.id || crypto.randomUUID(),
    direction: trade.direction || 'long', // Default to 'long' if direction is missing
    type: trade.type || 'equity',         // Ensure type exists
    status: trade.status || 'closed',     // Ensure status exists
    partialExits: Array.isArray(trade.partialExits) ? trade.partialExits : [],
    tags: Array.isArray(trade.tags) ? trade.tags : [],
    images: Array.isArray(trade.images) ? trade.images : []
  }));
  
  try {
    // Always save to localStorage as a fallback
    const stringified = JSON.stringify(validatedTrades);
    const saved = safeSetItem(TRADES_STORAGE_KEY, stringified);
    
    if (!saved) {
      toast.error('Could not save to local storage. Storage might be full or disabled.');
      return;
    }
    
    console.log(`Saved ${validatedTrades.length} trades to local storage`);
    
    // If server sync is enabled, also save to server
    if (useServerSync && serverUrl) {
      try {
        console.log('Saving trades to server:', serverUrl);
        const response = await fetch(serverUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: stringified,
        });
        
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        } else {
          console.log('Trades synced with server successfully');
        }
      } catch (serverError) {
        console.error('Error syncing with server:', serverError);
        toast.error('Server sync failed, but trades saved locally');
      }
    }
    
    // Dispatch a storage event to notify other tabs/components
    try {
      if (typeof window !== 'undefined') {
        // Use a more reliable method to notify components
        window.dispatchEvent(new Event('storage'));
        // Also dispatch a custom event for components listening specifically for trade updates
        window.dispatchEvent(new CustomEvent('trades-updated'));
        console.log('Trades saved successfully and storage event dispatched');
      }
    } catch (eventError) {
      console.error('Error dispatching storage event:', eventError);
    }
  } catch (error) {
    console.error('Error saving trades to localStorage:', error);
    toast.error('Failed to save trades');
  }
};

// Enhanced get trades function with improved error handling
export const getTrades = async (): Promise<Trade[]> => {
  try {
    console.log('Getting trades asynchronously');
    // Try to get from server first if server sync is enabled
    if (useServerSync && serverUrl) {
      try {
        console.log('Attempting to load trades from server:', serverUrl);
        const response = await fetch(serverUrl);
        if (response.ok) {
          const serverTrades = await response.json();
          console.log(`Loaded ${serverTrades.length} trades from server`);
          
          // Validate the data is an array before saving
          if (Array.isArray(serverTrades)) {
            // Ensure all trades have required fields
            const validatedTrades = serverTrades.map(trade => ({
              ...trade,
              id: trade.id || crypto.randomUUID(),
              direction: trade.direction || 'long',
              type: trade.type || 'equity',
              status: trade.status || 'closed',
              partialExits: Array.isArray(trade.partialExits) ? trade.partialExits : [],
              tags: Array.isArray(trade.tags) ? trade.tags : [],
              images: Array.isArray(trade.images) ? trade.images : []
            }));
            
            // Update localStorage with server data
            safeSetItem(TRADES_STORAGE_KEY, JSON.stringify(validatedTrades));
            return validatedTrades;
          } else {
            throw new Error('Server returned invalid data format (not an array)');
          }
        } else {
          throw new Error(`Server returned an error status: ${response.status}`);
        }
      } catch (serverError) {
        console.error('Error fetching from server:', serverError);
        toast.error('Server connection failed, using local storage');
      }
    }
    
    // Fallback to localStorage
    return getTradesSync();
  } catch (error) {
    console.error('Error getting trades:', error);
    toast.error('Failed to load trades');
    return [];
  }
};
