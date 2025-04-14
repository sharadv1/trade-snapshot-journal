
/**
 * Calculation functions for the application
 */

import { Trade } from '@/types';
import { getTradeMetrics } from './metricsCalculator';
export { formatCurrency, formatPercentage } from './formatters';

/**
 * Calculate the profit/loss for a trade
 */
export const calculateProfitLoss = (trade: Trade): number => {
  if (trade.status !== 'closed' || !trade.exitPrice) {
    return 0;
  }

  const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice));
  const exitPrice = typeof trade.exitPrice === 'number' ? trade.exitPrice : parseFloat(String(trade.exitPrice));
  const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity));

  if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(quantity)) {
    console.error('Invalid trade data:', trade);
    return 0;
  }

  const priceDifference = exitPrice - entryPrice;

  if (trade.direction === 'long') {
    return priceDifference * quantity;
  } else {
    return -priceDifference * quantity;
  }
};

/**
 * Calculate the risk/reward ratio for a trade
 */
export const calculateRiskRewardRatio = (trade: Trade): number => {
  if (!trade.stopLoss || !trade.takeProfit) {
    return 0;
  }

  const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice));
  const stopLoss = typeof trade.stopLoss === 'number' ? trade.stopLoss : parseFloat(String(trade.stopLoss));
  const takeProfit = typeof trade.takeProfit === 'number' ? trade.takeProfit : parseFloat(String(trade.takeProfit));

  if (isNaN(entryPrice) || isNaN(stopLoss) || isNaN(takeProfit)) {
    console.error('Invalid trade data:', trade);
    return 0;
  }

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);

  if (risk === 0) {
    return 0;
  }

  return reward / risk;
};

/**
 * Calculate the R-multiple for a trade
 */
export const calculateRMultiple = (trade: Trade): number => {
  if (!trade.stopLoss) {
    return 0;
  }

  const profitLoss = calculateProfitLoss(trade);
  const entryPrice = typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(String(trade.entryPrice));
  const stopLoss = typeof trade.stopLoss === 'number' ? trade.stopLoss : parseFloat(String(trade.stopLoss));
  const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity));

  if (isNaN(entryPrice) || isNaN(stopLoss) || isNaN(quantity)) {
    console.error('Invalid trade data:', trade);
    return 0;
  }

  const riskPerShare = Math.abs(entryPrice - stopLoss);
  const initialRisk = riskPerShare * quantity;

  if (initialRisk === 0) {
    return 0;
  }

  return profitLoss / initialRisk;
};

/**
 * Calculate all trade metrics
 * We're wrapping the getTradeMetrics function to ensure backward compatibility
 */
export const calculateTradeMetrics = (trade: Trade) => {
  return getTradeMetrics(trade);
};
