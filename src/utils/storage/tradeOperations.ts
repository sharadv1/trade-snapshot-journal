
import { Trade, TradeWithMetrics } from '@/types';
import { getTrades, getTradesSync, saveTrades } from './storageOperations';
import { calculateTradeMetrics } from '@/utils/calculations';
import { markIdeaAsTaken } from '@/utils/ideaStorage';
import { associateTradeWithReflections } from '@/utils/journalStorage';
import { dispatchStorageEvents } from './storageUtils';

// Add a new trade
export const addTrade = async (trade: Trade): Promise<string> => {
  console.log('storage/tradeOperations.addTrade called with trade:', trade.symbol);
  const trades = await getTrades();
  
  // If there's an ideaId, mark the idea as taken
  if (trade.ideaId) {
    markIdeaAsTaken(trade.ideaId);
  }
  
  // Add the trade
  trades.push(trade);
  const saveResult = await saveTrades(trades);
  
  if (!saveResult) {
    console.error('Failed to save trades after adding new trade');
    throw new Error('Failed to save trade');
  }
  
  // Trigger storage events
  dispatchStorageEvents();
  
  // Associate trade with weekly and monthly reflections
  if (trade.status === 'closed' && trade.exitDate) {
    associateTradeWithReflections(trade.id, trade.exitDate);
  }
  
  // Dispatch custom event to notify components
  document.dispatchEvent(new CustomEvent('trade-updated'));
  window.dispatchEvent(new Event('trades-updated'));
  
  console.log('Trade added successfully:', trade.id);
  
  // Return the trade ID for reference
  return trade.id;
};

// Update an existing trade
export const updateTrade = async (updatedTrade: Trade): Promise<void> => {
  console.log('storage/tradeOperations.updateTrade called with trade:', updatedTrade.id);
  const trades = await getTrades();
  const index = trades.findIndex(trade => trade.id === updatedTrade.id);
  
  if (index !== -1) {
    // If the idea has changed, mark the new idea as taken
    if (updatedTrade.ideaId && trades[index].ideaId !== updatedTrade.ideaId) {
      markIdeaAsTaken(updatedTrade.ideaId);
    }
    
    const wasClosedBefore = trades[index].status === 'closed';
    const isClosedNow = updatedTrade.status === 'closed';
    
    // Update the trade
    trades[index] = updatedTrade;
    const saveResult = await saveTrades(trades);
    
    if (!saveResult) {
      console.error('Failed to save trades after updating trade');
      throw new Error('Failed to update trade');
    }
    
    // Trigger storage events
    dispatchStorageEvents();
    
    // Associate trade with weekly and monthly reflections when it's closed
    if (isClosedNow && !wasClosedBefore && updatedTrade.exitDate) {
      associateTradeWithReflections(updatedTrade.id, updatedTrade.exitDate);
    }
    
    // Dispatch custom event to notify components
    document.dispatchEvent(new CustomEvent('trade-updated'));
    window.dispatchEvent(new Event('trades-updated'));
    
    console.log('Trade updated successfully:', updatedTrade.id);
  } else {
    console.error('Trade not found for update:', updatedTrade.id);
    
    // If trade not found in local array but likely exists in storage,
    // try to refetch trades and try again (to handle stale data)
    console.log('Attempting to refetch trades and retry update');
    const refreshedTrades = await getTrades();
    const refreshedIndex = refreshedTrades.findIndex(trade => trade.id === updatedTrade.id);
    
    if (refreshedIndex !== -1) {
      // Trade found after refresh, proceed with update
      refreshedTrades[refreshedIndex] = updatedTrade;
      const saveResult = await saveTrades(refreshedTrades);
      
      if (!saveResult) {
        console.error('Failed to save trades after updating trade (in retry)');
        throw new Error('Failed to update trade in retry');
      }
      
      // Trigger events
      dispatchStorageEvents();
      document.dispatchEvent(new CustomEvent('trade-updated'));
      window.dispatchEvent(new Event('trades-updated'));
      
      console.log('Trade updated successfully after refresh:', updatedTrade.id);
    } else {
      console.error('Trade still not found after refresh, cannot update:', updatedTrade.id);
      throw new Error('Trade not found for update');
    }
  }
};

// Delete a trade
export const deleteTrade = async (tradeId: string): Promise<void> => {
  console.log('storage/tradeOperations.deleteTrade called with ID:', tradeId);
  const trades = await getTrades();
  const filteredTrades = trades.filter(trade => trade.id !== tradeId);
  
  // If lengths are the same, no trade was found/deleted
  if (filteredTrades.length === trades.length) {
    console.error('Trade not found for deletion:', tradeId);
    throw new Error('Trade not found for deletion');
  }
  
  const saveResult = await saveTrades(filteredTrades);
  
  if (!saveResult) {
    console.error('Failed to save trades after deleting trade');
    throw new Error('Failed to delete trade');
  }
  
  // Trigger storage events
  dispatchStorageEvents();
  
  // Dispatch custom event to notify components
  document.dispatchEvent(new CustomEvent('trade-updated'));
  window.dispatchEvent(new Event('trades-updated'));
  
  console.log('Trade deleted successfully:', tradeId);
};

// Get a single trade by ID - with improved error handling and retries
export const getTradeById = (tradeId: string): Trade | undefined => {
  console.log('storage/tradeOperations.getTradeById called with ID:', tradeId);
  try {
    const trades = getTradesSync();
    
    if (!Array.isArray(trades)) {
      console.error('Invalid trades data format returned by getTradesSync, expected array but got:', typeof trades);
      return undefined;
    }
    
    console.log(`Searching for trade ${tradeId} among ${trades.length} trades`);
    
    // First try direct ID match
    const trade = trades.find(trade => trade.id === tradeId);
    
    if (trade) {
      return trade;
    }
    
    // If not found, try case-insensitive match (in case of ID format differences)
    const tradeIdLower = tradeId.toLowerCase();
    const tradeCaseInsensitive = trades.find(trade => 
      trade.id.toLowerCase() === tradeIdLower
    );
    
    if (tradeCaseInsensitive) {
      console.log('Found trade with case-insensitive ID match');
      return tradeCaseInsensitive;
    }
    
    // Still not found
    console.error('Trade not found with ID:', tradeId);
    return undefined;
  } catch (error) {
    console.error('Error in getTradeById:', error);
    return undefined;
  }
};

// Get trades with metrics calculated
export const getTradesWithMetrics = (): TradeWithMetrics[] => {
  console.log('Getting trades with metrics');
  const trades = getTradesSync();
  
  if (!Array.isArray(trades)) {
    console.error('Invalid trades data format returned by getTradesSync, expected array but got:', typeof trades);
    return [];
  }
  
  console.log(`Calculating metrics for ${trades.length} trades`);
  
  return trades.map(trade => {
    const metrics = calculateTradeMetrics(trade);
    return {
      ...trade,
      metrics
    };
  });
};
