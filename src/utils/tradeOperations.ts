
import { Trade, TradeWithMetrics } from '@/types';
import { getTrades, getTradesSync, saveTrades } from '@/utils/storage/storageCore';
import { calculateTradeMetrics } from '@/utils/calculations';
import { markIdeaAsTaken, getIdeaById } from '@/utils/ideaStorage';

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
  console.log('tradeOperations.updateTrade called with trade:', updatedTrade.id);
  const trades = await getTrades();
  const index = trades.findIndex(trade => trade.id === updatedTrade.id);
  
  if (index !== -1) {
    // If the idea has changed, mark the new idea as taken
    if (updatedTrade.ideaId && trades[index].ideaId !== updatedTrade.ideaId) {
      markIdeaAsTaken(updatedTrade.ideaId);
    }
    
    trades[index] = updatedTrade;
    await saveTrades(trades);
    console.log('Trade updated successfully:', updatedTrade.id);
  } else {
    console.error('Trade not found for update:', updatedTrade.id);
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

// Get trade-idea details for a trade
export const getTradeIdea = (ideaId: string | undefined) => {
  if (!ideaId) return null;
  
  return getIdeaById(ideaId);
};
