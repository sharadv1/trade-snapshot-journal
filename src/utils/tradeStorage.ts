
// This file is kept for backward compatibility
// Re-export everything from the new modular structure
export * from './storage/tradeOperations';

// Also need to re-export addDummyTrades for Analytics page
export { addDummyTrades } from './storage/demoData';

// Re-export storage core functions used by dataTransfer
export { getTrades, saveTrades, getTradesSync } from './storage/storageOperations';

// Explicitly export the most commonly used functions to ensure type safety
export {
  getTradeById,
  updateTrade,
  addTrade,
  deleteTrade,
  getTradesWithMetrics
} from './storage/tradeOperations';

// Add any functions that are only in tradeOperations and not in storage/tradeOperations
export const getTradeIdea = (ideaId: string | undefined) => {
  if (!ideaId) return null;
  
  // Import from ideaStorage to avoid circular references
  const { getIdeaById } = require('./ideaStorage');
  return getIdeaById(ideaId);
};
