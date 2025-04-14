
/**
 * Core storage utilities for the application
 */

import { Trade } from '@/types';

// Storage keys
export const TRADES_STORAGE_KEY = 'trade-journal-trades';
export const STRATEGIES_STORAGE_KEY = 'trade-journal-strategies';
export const SYMBOLS_STORAGE_KEY = 'trade-journal-symbols';
export const IDEAS_STORAGE_KEY = 'trade-journal-ideas';
export const LESSONS_STORAGE_KEY = 'trade-journal-lessons';
export const MAX_RISK_KEY = 'trade-journal-max-risk';

// Generic storage functions
export const getItemFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item from storage (${key}):`, error);
    return defaultValue;
  }
};

export const saveItemToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving item to storage (${key}):`, error);
    throw error;
  }
};

// Trade-specific functions
export const getTrades = async (): Promise<Trade[]> => {
  return getItemFromStorage<Trade[]>(TRADES_STORAGE_KEY, []);
};

export const getTradesSync = (): Trade[] => {
  return getItemFromStorage<Trade[]>(TRADES_STORAGE_KEY, []);
};

export const saveTrades = async (trades: Trade[]): Promise<void> => {
  saveItemToStorage(TRADES_STORAGE_KEY, trades);
};
