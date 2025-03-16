
import { Trade, TradeWithMetrics } from '@/types';
import { calculateTradeMetrics } from './tradeCalculations';
import { toast } from './toast';
import { markIdeaAsTaken } from './ideaStorage';

// Local storage keys
const TRADES_STORAGE_KEY = 'trade-journal-trades';

// Server URL storage key
const SERVER_URL_KEY = 'trade-journal-server-url';

// Flag to determine if using server sync or just localStorage
let useServerSync = false;
let serverUrl = '';

// Initialize server connection
export const initializeServerSync = (url: string): Promise<boolean> => {
  // Update the server URL
  serverUrl = url;
  
  if (serverUrl) {
    return fetch(`${serverUrl}/ping`)
      .then(response => {
        if (response.ok) {
          console.log('Successfully connected to trade server');
          useServerSync = true;
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
  
  // If there's an ideaId, mark the idea as taken
  if (trade.ideaId) {
    markIdeaAsTaken(trade.ideaId);
  }
  
  trades.push(trade);
  await saveTrades(trades);
};

// Update an existing trade
export const updateTrade = async (updatedTrade: Trade): Promise<void> => {
  const trades = await getTrades();
  const index = trades.findIndex(trade => trade.id === updatedTrade.id);
  
  if (index !== -1) {
    // If the idea has changed, mark the new idea as taken
    if (updatedTrade.ideaId && trades[index].ideaId !== updatedTrade.ideaId) {
      markIdeaAsTaken(updatedTrade.ideaId);
    }
    
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

// Get a single trade by ID - non-Promise version to fix TS errors
export const getTradeById = (tradeId: string): Trade | undefined => {
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
  const trade = getTradeById(tradeId);
  
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
  const trade = getTradeById(tradeId);
  
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
  // Sample trades for testing
  const dummyTrades: Trade[] = [
    {
      id: crypto.randomUUID(),
      symbol: 'AAPL',
      direction: 'long',
      type: 'equity',
      status: 'closed',
      entryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 150.25,
      exitDate: new Date().toISOString(),
      exitPrice: 165.75,
      quantity: 10,
      fees: 9.99,
      strategy: 'Trend Following',
      notes: 'Strong earnings report',
      tags: ['tech', 'earnings'],
      images: [],
      partialExits: []
    },
    {
      id: crypto.randomUUID(),
      symbol: 'MSFT',
      direction: 'long',
      type: 'equity',
      status: 'open',
      entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 310.20,
      quantity: 5,
      fees: 9.99,
      strategy: 'Momentum',
      notes: 'Following tech uptrend',
      tags: ['tech'],
      images: [],
      partialExits: []
    },
    {
      id: crypto.randomUUID(),
      symbol: 'ES',
      direction: 'short',
      type: 'futures',
      status: 'closed',
      entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      entryPrice: 4580.25,
      exitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice: 4530.50,
      quantity: 1,
      fees: 4.50,
      strategy: 'Reversal',
      notes: 'Short-term overbought',
      tags: ['index', 'overnight'],
      images: [],
      partialExits: [],
      contractDetails: {
        exchange: 'CME',
        contractSize: 1,
        tickSize: 0.25,
        tickValue: 12.50
      }
    }
  ];
  
  // Remove any existing trades
  localStorage.removeItem(TRADES_STORAGE_KEY);
  
  // Save the dummy trades
  await saveTrades(dummyTrades);
  console.log('Added dummy trades for testing');
  toast.success('Added dummy trades for testing');
};

// Force sync with server (pull server data)
export const syncWithServer = async (): Promise<boolean> => {
  if (!useServerSync || !serverUrl) {
    toast.error('Server sync is not enabled');
    return false;
  }
  
  try {
    const response = await fetch(serverUrl);
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

// Configure server connection
export const configureServerConnection = async (url: string): Promise<boolean> => {
  if (!url) {
    useServerSync = false;
    serverUrl = '';
    localStorage.removeItem(SERVER_URL_KEY);
    toast.info('Server sync disabled');
    return false;
  }
  
  localStorage.setItem(SERVER_URL_KEY, url);
  return initializeServerSync(url);
};

// On app initialization, try to restore server connection
export const restoreServerConnection = (): void => {
  const savedServerUrl = localStorage.getItem(SERVER_URL_KEY);
  if (savedServerUrl) {
    serverUrl = savedServerUrl;
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
