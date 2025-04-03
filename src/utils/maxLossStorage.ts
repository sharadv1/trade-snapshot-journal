
const MAX_LOSS_STORAGE_KEY = 'trading-journal-max-loss-values';
const DEFAULT_MAX_LOSS_VALUES = [-500, -1000, -2000, -5000];

export function getMaxLossValues(): number[] {
  try {
    const values = localStorage.getItem(MAX_LOSS_STORAGE_KEY);
    if (values) {
      return JSON.parse(values);
    }
    // Initialize with default values
    saveMaxLossValues(DEFAULT_MAX_LOSS_VALUES);
    return DEFAULT_MAX_LOSS_VALUES;
  } catch (error) {
    console.error('Error loading max loss values from localStorage:', error);
    return DEFAULT_MAX_LOSS_VALUES;
  }
}

export function saveMaxLossValues(values: number[]): void {
  try {
    localStorage.setItem(MAX_LOSS_STORAGE_KEY, JSON.stringify(values));
  } catch (error) {
    console.error('Error saving max loss values to localStorage:', error);
  }
}

export function getCurrentMaxLoss(): number | null {
  try {
    const value = localStorage.getItem('trading-journal-current-max-loss');
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error loading current max loss value from localStorage:', error);
    return null;
  }
}

export function setCurrentMaxLoss(value: number | null): void {
  try {
    if (value === null) {
      localStorage.removeItem('trading-journal-current-max-loss');
    } else {
      localStorage.setItem('trading-journal-current-max-loss', JSON.stringify(value));
    }
  } catch (error) {
    console.error('Error saving current max loss value to localStorage:', error);
  }
}
