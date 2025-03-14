
import { Trade, TradeWithMetrics } from '@/types';
import { calculateTradeMetrics, generateDummyTrades } from './tradeCalculations';

// Local storage keys
const TRADES_STORAGE_KEY = 'trade-journal-trades';

// Save trades to localStorage
export const saveTrades = (trades: Trade[]): void => {
  try {
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    // Dispatch a storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));
    console.log('Trades saved successfully');
  } catch (error) {
    console.error('Error saving trades to localStorage:', error);
  }
};

// Get trades from localStorage
export const getTrades = (): Trade[] => {
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
export const addTrade = (trade: Trade): void => {
  const trades = getTrades();
  trades.push(trade);
  saveTrades(trades);
};

// Update an existing trade
export const updateTrade = (updatedTrade: Trade): void => {
  const trades = getTrades();
  const index = trades.findIndex(trade => trade.id === updatedTrade.id);
  
  if (index !== -1) {
    trades[index] = updatedTrade;
    saveTrades(trades);
  }
};

// Delete a trade
export const deleteTrade = (tradeId: string): void => {
  const trades = getTrades();
  const filteredTrades = trades.filter(trade => trade.id !== tradeId);
  saveTrades(filteredTrades);
};

// Get a single trade by ID
export const getTradeById = (tradeId: string): Trade | undefined => {
  const trades = getTrades();
  return trades.find(trade => trade.id === tradeId);
};

// Get trades with metrics calculated
export const getTradesWithMetrics = (): TradeWithMetrics[] => {
  const trades = getTrades();
  return trades.map(trade => ({
    ...trade,
    metrics: calculateTradeMetrics(trade)
  }));
};

// Save image to a trade
export const saveImageToTrade = (tradeId: string, imageBase64: string): void => {
  const trade = getTradeById(tradeId);
  
  if (trade) {
    const updatedTrade = {
      ...trade,
      images: [...trade.images, imageBase64]
    };
    updateTrade(updatedTrade);
  }
};

// Delete image from a trade
export const deleteImageFromTrade = (tradeId: string, imageIndex: number): void => {
  const trade = getTradeById(tradeId);
  
  if (trade) {
    const updatedImages = [...trade.images];
    updatedImages.splice(imageIndex, 1);
    
    const updatedTrade = {
      ...trade,
      images: updatedImages
    };
    updateTrade(updatedTrade);
  }
};

// Add dummy trades for testing
export const addDummyTrades = (): void => {
  const dummyTrades = generateDummyTrades();
  
  // Remove any existing trades
  localStorage.removeItem(TRADES_STORAGE_KEY);
  
  // Save the dummy trades
  saveTrades(dummyTrades);
  console.log('Added 10 dummy trades for testing');
};
