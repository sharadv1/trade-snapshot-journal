
import { Trade } from '@/types';

// Checks if a value is a valid trade object
export const isValidTrade = (trade: any): boolean => {
  return (
    trade && 
    typeof trade === 'object' &&
    typeof trade.id === 'string' &&
    typeof trade.symbol === 'string'
  );
};

// Normalize trade data to ensure all required fields exist
export const normalizeTrade = (trade: Trade): Trade => {
  // Create a normalized type variable first
  let normalizedType = trade.type;
  
  // Convert legacy types to their modern equivalents
  if (normalizedType === 'equity') normalizedType = 'stock';
  if (normalizedType === 'option') normalizedType = 'options';
  
  return {
    ...trade,
    id: trade.id || crypto.randomUUID(),
    direction: trade.direction || 'long',
    // Use the normalized type
    type: normalizedType || 'stock',
    status: trade.status || 'closed',
    partialExits: Array.isArray(trade.partialExits) ? trade.partialExits : [],
    tags: Array.isArray(trade.tags) ? trade.tags : [],
    images: Array.isArray(trade.images) ? trade.images : []
  };
};
