
// This file is kept for backward compatibility
// Re-export everything from the new modular structure
export * from './storage/tradeOperations';

// Add any functions that are only in tradeOperations and not in storage/tradeOperations
export { getTradeIdea } from './tradeOperations';

// Also need to re-export addDummyTrades for Analytics page
export { addDummyTrades } from './storage/demoData';

// Re-export storage core functions used by dataTransfer
export { getTrades, saveTrades, getTradesSync } from './storage/storageCore';

// Re-export these functions explicitly to avoid import issues
export { getTradeById, updateTrade } from './tradeOperations';
