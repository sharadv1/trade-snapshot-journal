
import { Trade, TradeWithMetrics } from '@/types';
import { calculateTradeMetrics, generateDummyTrades } from './tradeCalculations';
import { toast } from './toast';

// Local storage keys
const TRADES_STORAGE_KEY = 'trade-journal-trades';

// Server URL - replace with your Docker server URL
const SERVER_URL = 'http://your-mac-mini-ip:port/api/trades';

// Flag to determine if using server sync or just localStorage
let useServerSync = false;

// Initialize server connection
export const initializeServerSync = (serverUrl: string): Promise<boolean> => {
  // Update the server URL
  if (serverUrl) {
    useServerSync = true;
    return fetch(`${serverUrl}/ping`)
      .then(response => {
        if (response.ok) {
          console.log('Successfully connected to trade server');
          toast.success('Connected to trade server successfully');
          return true;
        } else {
          console.error('Server returned an error status', response.status);
          useServerSync = false;
          toast.error('Failed to connect to trade server');
          return false;
        }
      })
      .catch(error => {
        console.error('Error connecting to trade server:', error);
        useServerSync = false;
        toast.error('Cannot reach trade server, using local storage only');
        return false;
      });
  }
  
  useServerSync = false;
  return Promise.resolve(false);
};

// Get the server connection status
export const isUsingServerSync = (): boolean => {
  return useServerSync;
};

// Save trades to storage (localStorage and/or server)
export const saveTrades = async (trades: Trade[]): Promise<void> => {
  try {
    // Always save to localStorage as a fallback
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    
    // If server sync is enabled, also save to server
    if (useServerSync) {
      try {
        const response = await fetch(SERVER_URL, {
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
    if (useServerSync) {
      try {
        const response = await fetch(SERVER_URL);
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

// Add a new trade
export const addTrade = async (trade: Trade): Promise<void> => {
  const trades = await getTrades();
  trades.push(trade);
  await saveTrades(trades);
};

// Update an existing trade
export const updateTrade = async (updatedTrade: Trade): Promise<void> => {
  const trades = await getTrades();
  const index = trades.findIndex(trade => trade.id === updatedTrade.id);
  
  if (index !== -1) {
    trades[index] = updatedTrade;
    await saveTrades(trades);
  }
};

// Delete a trade
export const deleteTrade = async (tradeId: string): Promise<void> => {
  const trades = await getTrades();
  const filteredTrades = trades.filter(trade => trade.id !== tradeId);
  await saveTrades(filteredTrades);
};

// Get a single trade by ID
export const getTradeById = async (tradeId: string): Promise<Trade | undefined> => {
  const trades = await getTrades();
  return trades.find(trade => trade.id === tradeId);
};

// Synchronous version for components that can't use async/await
export const getTradeByIdSync = (tradeId: string): Trade | undefined => {
  const trades = getTradesSync();
  return trades.find(trade => trade.id === tradeId);
};

// Get trades with metrics calculated
export const getTradesWithMetrics = (): TradeWithMetrics[] => {
  const trades = getTradesSync();
  return trades.map(trade => ({
    ...trade,
    metrics: calculateTradeMetrics(trade)
  }));
};

// Save image to a trade
export const saveImageToTrade = async (tradeId: string, imageBase64: string): Promise<void> => {
  const trade = await getTradeById(tradeId);
  
  if (trade) {
    const updatedTrade = {
      ...trade,
      images: [...trade.images, imageBase64]
    };
    await updateTrade(updatedTrade);
  }
};

// Delete image from a trade
export const deleteImageFromTrade = async (tradeId: string, imageIndex: number): Promise<void> => {
  const trade = await getTradeById(tradeId);
  
  if (trade) {
    const updatedImages = [...trade.images];
    updatedImages.splice(imageIndex, 1);
    
    const updatedTrade = {
      ...trade,
      images: updatedImages
    };
    await updateTrade(updatedTrade);
  }
};

// Add dummy trades for testing
export const addDummyTrades = async (): Promise<void> => {
  const dummyTrades = generateDummyTrades();
  
  // Remove any existing trades
  localStorage.removeItem(TRADES_STORAGE_KEY);
  
  // Save the dummy trades
  await saveTrades(dummyTrades);
  console.log('Added dummy trades for testing');
  toast.success('Added dummy trades for testing');
};

// Force sync with server (pull server data)
export const syncWithServer = async (): Promise<boolean> => {
  if (!useServerSync) {
    toast.error('Server sync is not enabled');
    return false;
  }
  
  try {
    const response = await fetch(SERVER_URL);
    if (response.ok) {
      const serverTrades = await response.json();
      localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(serverTrades));
      window.dispatchEvent(new Event('storage'));
      toast.success('Successfully synced with server');
      return true;
    } else {
      console.error('Server returned an error status', response.status);
      toast.error('Failed to sync with server');
      return false;
    }
  } catch (error) {
    console.error('Error syncing with server:', error);
    toast.error('Failed to connect to server');
    return false;
  }
};

// Create a settings component to configure server connection
export const configureServerConnection = async (serverUrl: string): Promise<boolean> => {
  if (!serverUrl) {
    useServerSync = false;
    localStorage.removeItem('trade-journal-server-url');
    toast.info('Server sync disabled');
    return false;
  }
  
  localStorage.setItem('trade-journal-server-url', serverUrl);
  return initializeServerSync(serverUrl);
};

// On app initialization, try to restore server connection
export const restoreServerConnection = (): void => {
  const savedServerUrl = localStorage.getItem('trade-journal-server-url');
  if (savedServerUrl) {
    initializeServerSync(savedServerUrl)
      .then(success => {
        if (success) {
          console.log('Restored server connection to:', savedServerUrl);
        }
      })
      .catch(err => {
        console.error('Failed to restore server connection:', err);
      });
  }
};
