
const MAX_RISK_STORAGE_KEY = 'trading-journal-max-risk-values';
const DEFAULT_MAX_RISK_VALUES = [125, 250, 500, 1000];

export function getMaxRiskValues(): number[] {
  try {
    const values = localStorage.getItem(MAX_RISK_STORAGE_KEY);
    if (values) {
      return JSON.parse(values);
    }
    // Initialize with default values
    saveMaxRiskValues(DEFAULT_MAX_RISK_VALUES);
    return DEFAULT_MAX_RISK_VALUES;
  } catch (error) {
    console.error('Error loading max risk values from localStorage:', error);
    return DEFAULT_MAX_RISK_VALUES;
  }
}

export function saveMaxRiskValues(values: number[]): void {
  try {
    localStorage.setItem(MAX_RISK_STORAGE_KEY, JSON.stringify(values));
  } catch (error) {
    console.error('Error saving max risk values to localStorage:', error);
  }
}
