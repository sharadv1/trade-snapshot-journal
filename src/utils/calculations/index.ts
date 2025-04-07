
// Export all calculation utilities from this central file

// Trade metrics calculation
export { getTradeMetrics, calculateTradeMetrics } from './metricsCalculator';

// Contract utilities
export * from './contractUtils';

// Advanced metrics
export * from './advancedMetrics';

// Trade status utilities
export * from './tradeStatus';

// Basic formatting utilities
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};
