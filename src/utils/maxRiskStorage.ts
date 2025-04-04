
const MAX_RISK_STORAGE_KEY = 'trading-journal-max-risk-values';
const DEFAULT_MAX_RISK_VALUES = [125, 250, 500, 1000];

export function getMaxRiskValues(): number[] {
  try {
    const values = localStorage.getItem(MAX_RISK_STORAGE_KEY);
    if (values) {
      const parsed = JSON.parse(values);
      if (Array.isArray(parsed)) {
        return parsed.filter(value => typeof value === 'number' && !isNaN(value));
      }
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
    if (!Array.isArray(values)) {
      throw new Error('Values must be an array');
    }
    
    // Ensure we only save valid numbers
    const validValues = values.filter(value => typeof value === 'number' && !isNaN(value));
    localStorage.setItem(MAX_RISK_STORAGE_KEY, JSON.stringify(validValues));
  } catch (error) {
    console.error('Error saving max risk values to localStorage:', error);
  }
}

export function getCurrentMaxRisk(): number | null {
  try {
    const value = localStorage.getItem('trading-journal-current-max-risk');
    if (!value) return null;
    
    const parsed = JSON.parse(value);
    return typeof parsed === 'number' && !isNaN(parsed) ? parsed : null;
  } catch (error) {
    console.error('Error loading current max risk value from localStorage:', error);
    return null;
  }
}

export function setCurrentMaxRisk(value: number | null): void {
  try {
    if (value === null) {
      localStorage.removeItem('trading-journal-current-max-risk');
    } else if (typeof value === 'number' && !isNaN(value)) {
      localStorage.setItem('trading-journal-current-max-risk', JSON.stringify(value));
    } else {
      throw new Error('Invalid max risk value');
    }
  } catch (error) {
    console.error('Error saving current max risk value to localStorage:', error);
  }
}
