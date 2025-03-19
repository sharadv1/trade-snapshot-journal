
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
};

// Synchronous version for components that can't use async/await
export const getTradesSync = (): Trade[] => {
  try {
    const tradesJson = localStorage.getItem(TRADES_STORAGE_KEY);
    if (!tradesJson) return [];
    return JSON.parse(tradesJson);
  } catch (error) {
    console.error('Error getting trades from localStorage:', error);
    return [];
  }
};

// Save trades to storage (localStorage and/or server)
export const saveTrades = async (trades: Trade[]): Promise<void> => {
  try {
    // Always save to localStorage as a fallback
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    
    // If server sync is enabled, also save to server
    if (useServerSync && serverUrl) {
      try {
        const response = await fetch(serverUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trades),
        });
        
        if (!response.ok) {
          console.error('Error saving trades to server:', response.statusText);
          toast.error('Failed to sync trades with server');
        } else {
          console.log('Trades synced with server successfully');
        }
      } catch (serverError) {
        console.error('Error syncing with server:', serverError);
        toast.error('Server sync failed, but trades saved locally');
      }
    }
    
    // Dispatch a storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));
    console.log('Trades saved successfully');
  } catch (error) {
    console.error('Error saving trades to localStorage:', error);
    toast.error('Failed to save trades');
  }
};

// Get trades from storage (server or localStorage)
export const getTrades = async (): Promise<Trade[]> => {
  try {
    // Try to get from server first if server sync is enabled
    if (useServerSync && serverUrl) {
      try {
        const response = await fetch(serverUrl);
        if (response.ok) {
          const serverTrades = await response.json();
          console.log('Loaded trades from server');
          // Update localStorage with server data
          localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(serverTrades));
          return serverTrades;
        } else {
          console.error('Server returned an error status', response.status);
          toast.error('Failed to load trades from server, using local storage');
        }
      } catch (serverError) {
        console.error('Error fetching from server:', serverError);
        toast.error('Server connection failed, using local storage');
      }
    }
    
    // Fallback to localStorage
    const tradesJson = localStorage.getItem(TRADES_STORAGE_KEY);
    if (!tradesJson) return [];
    return JSON.parse(tradesJson);
  } catch (error) {
    console.error('Error getting trades:', error);
    toast.error('Failed to load trades');
    return [];
  }
};
