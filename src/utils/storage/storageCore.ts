
// Re-export everything from our refactored modules
// This ensures backward compatibility with existing code

export { TRADES_STORAGE_KEY } from './storageOperations';
export { SERVER_URL_KEY } from './serverConnection';

export { 
  isUsingServerSync,
  getServerUrl,
  setServerSync
} from './serverConnection';

export {
  getTradesSync,
  saveTrades,
  getTrades
} from './storageOperations';

// Re-export utility functions that might be used directly
export { 
  safeGetItem,
  safeSetItem,
  dispatchStorageEvents
} from './storageUtils';

// Also export validation utilities in case they're needed elsewhere
export {
  isValidTrade,
  normalizeTrade
} from './tradeValidation';
