
/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '$0.00';
  
  // For very small values, use more decimal places
  const absValue = Math.abs(value);
  if (absValue > 0 && absValue < 0.01) {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(value);
  }
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0.00%';
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0) + '%';
}

/**
 * Format a decimal number with appropriate decimal places
 * Uses more decimal places for very small numbers
 */
export function formatDecimal(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0.00';
  
  // For very small non-zero values, use more decimal places
  const absValue = Math.abs(value);
  if (absValue > 0 && absValue < 0.01) {
    return Number(value).toFixed(8);
  }
  
  return Number(value).toFixed(2);
}
