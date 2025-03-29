
import { Trade, TradeWithMetrics } from '@/types';
import { getTrades, getTradesSync, saveTrades } from './storageOperations';
import { calculateTradeMetrics } from '@/utils/calculations/metricsCalculator';
import { markIdeaAsTaken } from '@/utils/ideaStorage';
import { associateTradeWithReflections } from '@/utils/journalStorage';

// Add a new trade
export const addTrade = async (trade: Trade): Promise<void> => {
  const trades = await getTrades();
  
  // If there's an ideaId, mark the idea as taken
  if (trade.ideaId) {
    markIdeaAsTaken(trade.ideaId);
  }
  
  // Add the trade
  trades.push(trade);
  await saveTrades(trades);
  
  // Associate trade with weekly and monthly reflections
  if (trade.status === 'closed' && trade.exitDate) {
    associateTradeWithReflections(trade.id, trade.exitDate);
  }
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
    
    const wasClosedBefore = trades[index].status === 'closed';
    const isClosedNow = updatedTrade.status === 'closed';
    
    // Update the trade
    trades[index] = updatedTrade;
    await saveTrades(trades);
    
    // Associate trade with weekly and monthly reflections when it's closed
    if (isClosedNow && !wasClosedBefore && updatedTrade.exitDate) {
      associateTradeWithReflections(updatedTrade.id, updatedTrade.exitDate);
    }
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
  console.log('Getting trades with metrics');
  const trades = getTradesSync();
  console.log(`Calculating metrics for ${trades.length} trades`);
  
  return trades.map(trade => {
    const metrics = calculateTradeMetrics(trade);
    return {
      ...trade,
      metrics
    };
  });
};
