
/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency
 */
export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return '';
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
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + '%';
}

/**
 * Format a decimal number to at most 2 decimal places
 */
export function formatDecimal(value: number | undefined): string {
  if (value === undefined) return '';
  return value.toFixed(2);
}
