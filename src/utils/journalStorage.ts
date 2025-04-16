import { WeeklyReflection, MonthlyReflection } from '@/types';
import { toast } from '@/utils/toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

const safeParse = <T>(value: string | null, defaultValue: T): T => {
  if (!value) return defaultValue;
  
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) {
      console.error('Invalid data format in localStorage, expected object but got:', typeof parsed);
      return defaultValue;
    }
    return parsed as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

const debugStorage = (action: string, key: string, data?: any) => {
  console.log(`[JOURNAL STORAGE] ${action} for key "${key}"`);
  if (data) {
    console.log('Data:', typeof data === 'string' ? data.substring(0, 100) + '...' : data);
  }
  
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) allKeys.push(k);
  }
  console.log('All localStorage keys:', allKeys);
};

export const getWeeklyReflections = (): { [weekId: string]: WeeklyReflection } => {
  debugStorage('Retrieving weekly reflections', WEEKLY_REFLECTIONS_KEY);
  const storedReflections = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
  return safeParse(storedReflections, {});
};

export const getWeeklyReflectionById = (weekId: string): WeeklyReflection | undefined => {
  if (!weekId) {
    console.error('Cannot get weekly reflection: weekId is empty');
    return undefined;
  }
  
  debugStorage('Getting weekly reflection by ID', weekId);
  return getWeeklyReflection(weekId);
};

export const getMonthlyReflections = (): { [monthId: string]: MonthlyReflection } => {
  debugStorage('Retrieving monthly reflections', MONTHLY_REFLECTIONS_KEY);
  const storedReflections = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
  return safeParse(storedReflections, {});
};

export const getWeeklyReflection = (weekId: string): WeeklyReflection | undefined => {
  if (!weekId) {
    console.error('Cannot get weekly reflection: weekId is empty');
    return undefined;
  }
  
  debugStorage('Getting weekly reflection', weekId);
  const reflections = getWeeklyReflections();
  return reflections[weekId];
};

export const getMonthlyReflection = (monthId: string): MonthlyReflection | undefined => {
  if (!monthId) {
    console.error('Cannot get monthly reflection: monthId is empty');
    return undefined;
  }
  
  debugStorage('Getting monthly reflection', monthId);
  const reflections = getMonthlyReflections();
  return reflections[monthId];
};

export const weeklyReflectionExists = (weekId: string): boolean => {
  if (!weekId) return false;
  const reflections = getWeeklyReflections();
  return !!reflections[weekId];
};

export const monthlyReflectionExists = (monthId: string): boolean => {
  if (!monthId) return false;
  const reflections = getMonthlyReflections();
  return !!reflections[monthId];
};

export const removeDuplicateReflections = (): { weeklyRemoved: number, monthlyRemoved: number } => {
  console.log('=== STARTING ENHANCED DUPLICATE REMOVAL PROCESS ===');
  let weeklyRemoved = 0;
  let monthlyRemoved = 0;
  
  // === WEEKLY REFLECTIONS ===
  try {
    console.log('Processing weekly reflections...');
    const weeklyReflectionsRaw = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    if (!weeklyReflectionsRaw) {
      console.log('No weekly reflections found in localStorage');
      return { weeklyRemoved, monthlyRemoved };
    }
    
    let allWeeklyReflections: Record<string, any>;
    try {
      allWeeklyReflections = JSON.parse(weeklyReflectionsRaw);
      const allKeys = Object.keys(allWeeklyReflections);
      console.log(`Parsed ${allKeys.length} weekly reflections with keys: ${allKeys.join(', ')}`);
    } catch (e) {
      console.error('Failed to parse weekly reflections JSON:', e);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    if (typeof allWeeklyReflections !== 'object' || allWeeklyReflections === null) {
      console.error('Weekly reflections is not an object:', allWeeklyReflections);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    // Map to store unique reflections by normalized date range
    const uniqueReflectionsByRange = new Map<string, { key: string, reflection: WeeklyReflection }>();
    // Array to track which keys to keep
    const keysToKeep: string[] = [];
    // Array to track which keys to remove
    const keysToRemove: string[] = [];
    
    // First pass: Identify duplicates by date range rather than by ID
    Object.entries(allWeeklyReflections).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') {
        console.log(`Skipping invalid entry with key ${key}`);
        return;
      }
      
      // Add ID if missing
      if (!value.id && key) {
        value.id = key;
      }
      
      // Add weekId if missing but we have id
      if (!value.weekId && value.id) {
        value.weekId = value.id;
      }
      
      // Skip entries without any proper identifier
      if (!value.weekId && !value.id) {
        console.log(`Skipping entry without weekId or id, key: ${key}`);
        keysToRemove.push(key);
        return;
      }
      
      // Determine the date range for this reflection
      let normalizedDateRange = '';
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (value.weekStart && value.weekEnd) {
        // If we have explicit start/end dates, use those
        try {
          startDate = new Date(value.weekStart);
          endDate = new Date(value.weekEnd);
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (e) {
          console.log(`Invalid date format in reflection ${key}:`, e);
        }
      }
      
      if (!startDate || !endDate) {
        // Try to parse the weekId as a date
        try {
          const weekDate = new Date(value.weekId);
          if (!isNaN(weekDate.getTime())) {
            const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
            startDate = weekStart;
            endDate = weekEnd;
          }
        } catch (e) {
          console.log(`Failed to parse weekId as date for ${key}:`, e);
        }
      }
      
      // If we still don't have valid dates, try id as a last resort
      if ((!startDate || !endDate) && value.id && value.id !== value.weekId) {
        try {
          const idDate = new Date(value.id);
          if (!isNaN(idDate.getTime())) {
            const weekStart = startOfWeek(idDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(idDate, { weekStartsOn: 1 });
            startDate = weekStart;
            endDate = weekEnd;
          }
        } catch (e) {
          console.log(`Failed to parse id as date for ${key}:`, e);
        }
      }
      
      // If we still don't have valid dates, use the key as is
      if (!startDate || !endDate) {
        normalizedDateRange = value.weekId || value.id || key;
        console.log(`Using key as date range for ${key}: ${normalizedDateRange}`);
      } else {
        normalizedDateRange = `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
      }
      
      console.log(`Reflection ${key} has date range: ${normalizedDateRange}`);
      
      // Check if we've already seen a reflection for this date range
      if (uniqueReflectionsByRange.has(normalizedDateRange)) {
        const existing = uniqueReflectionsByRange.get(normalizedDateRange)!;
        const existingReflection = existing.reflection;
        
        // Determine which reflection to keep - prefer:
        // 1. Non-placeholders over placeholders
        // 2. Reflections with content over empty ones
        // 3. More recent updates if both have content
        const existingHasContent = !!(existingReflection.reflection || existingReflection.weeklyPlan);
        const newHasContent = !!(value.reflection || value.weeklyPlan);
        const existingIsPlaceholder = existingReflection.isPlaceholder === true;
        const newIsPlaceholder = value.isPlaceholder === true;
        
        // Log what we found
        console.log(`Found duplicate for range ${normalizedDateRange}:`);
        console.log(`  Existing (${existing.key}): hasContent=${existingHasContent}, isPlaceholder=${existingIsPlaceholder}`);
        console.log(`  New (${key}): hasContent=${newHasContent}, isPlaceholder=${newIsPlaceholder}`);
        
        // Logic to decide which to keep
        let keepNew = false;
        
        if (!existingIsPlaceholder && newIsPlaceholder) {
          // Keep the non-placeholder
          keepNew = false;
        } else if (existingIsPlaceholder && !newIsPlaceholder) {
          // Keep the non-placeholder
          keepNew = true;
        } else if (existingHasContent && !newHasContent) {
          // Keep the one with content
          keepNew = false;
        } else if (!existingHasContent && newHasContent) {
          // Keep the one with content
          keepNew = true;
        } else {
          // Both are placeholders or both have content (or both are empty),
          // so keep the one with the most recent update
          const existingDate = existingReflection.lastUpdated ? new Date(existingReflection.lastUpdated) : null;
          const newDate = value.lastUpdated ? new Date(value.lastUpdated) : null;
          
          if (existingDate && newDate) {
            keepNew = newDate > existingDate;
          } else if (!existingDate && newDate) {
            keepNew = true;
          } else {
            keepNew = false; // Default to keeping the first one we found
          }
        }
        
        if (keepNew) {
          console.log(`  Keeping new entry (${key}) and removing existing (${existing.key})`);
          // Remove the existing and add the new one
          keysToRemove.push(existing.key);
          keysToKeep.push(key);
          uniqueReflectionsByRange.set(normalizedDateRange, { key, reflection: value });
          weeklyRemoved++;
        } else {
          console.log(`  Keeping existing entry (${existing.key}) and removing new (${key})`);
          // Keep the existing and remove the new one
          keysToRemove.push(key);
          if (!keysToKeep.includes(existing.key)) {
            keysToKeep.push(existing.key);
          }
          weeklyRemoved++;
        }
      } else {
        // First time seeing this date range
        console.log(`First entry for date range ${normalizedDateRange}: ${key}`);
        uniqueReflectionsByRange.set(normalizedDateRange, { key, reflection: value });
        keysToKeep.push(key);
      }
    });
    
    console.log(`Found ${keysToRemove.length} duplicate weekly reflection keys to remove`);
    console.log(`Keeping ${keysToKeep.length} unique weekly reflections`);
    
    if (keysToRemove.length > 0) {
      // Create a new object with only the keys to keep
      const cleanedReflections: Record<string, WeeklyReflection> = {};
      
      keysToKeep.forEach(key => {
        if (allWeeklyReflections[key]) {
          cleanedReflections[key] = allWeeklyReflections[key];
        }
      });
      
      weeklyRemoved = keysToRemove.length;
      console.log(`Removing ${weeklyRemoved} duplicate weekly reflections`);
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(cleanedReflections));
      dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    } else {
      console.log('No duplicate weekly reflections found that need removing');
    }
  } catch (error) {
    console.error('Error processing weekly reflections:', error);
  }
  
  // === MONTHLY REFLECTIONS ===
  try {
    console.log('Processing monthly reflections...');
    const monthlyReflectionsRaw = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    if (!monthlyReflectionsRaw) {
      console.log('No monthly reflections found in localStorage');
      return { weeklyRemoved, monthlyRemoved };
    }
    
    let allMonthlyReflections: Record<string, any>;
    try {
      allMonthlyReflections = JSON.parse(monthlyReflectionsRaw);
      const allKeys = Object.keys(allMonthlyReflections);
      console.log(`Parsed ${allKeys.length} monthly reflections with keys: ${allKeys.join(', ')}`);
    } catch (e) {
      console.error('Failed to parse monthly reflections JSON:', e);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    if (typeof allMonthlyReflections !== 'object' || allMonthlyReflections === null) {
      console.error('Monthly reflections is not an object:', allMonthlyReflections);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    // Map to store unique reflections by normalized month
    const uniqueReflectionsByMonth = new Map<string, { key: string, reflection: MonthlyReflection }>();
    // Arrays to track which keys to keep and remove
    const keysToKeep: string[] = [];
    const keysToRemove: string[] = [];
    
    // First pass: Identify duplicates by month
    Object.entries(allMonthlyReflections).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') {
        console.log(`Skipping invalid monthly entry with key ${key}`);
        return;
      }
      
      // Add ID if missing
      if (!value.id && key) {
        value.id = key;
      }
      
      // Add monthId if missing but we have id
      if (!value.monthId && value.id) {
        value.monthId = value.id;
      }
      
      // Skip entries without any proper identifier
      if (!value.monthId && !value.id) {
        console.log(`Skipping monthly entry without monthId or id, key: ${key}`);
        keysToRemove.push(key);
        return;
      }
      
      // Determine the normalized month for this reflection
      let normalizedMonth = '';
      
      if (value.monthStart) {
        try {
          const startDate = new Date(value.monthStart);
          if (!isNaN(startDate.getTime())) {
            normalizedMonth = format(startDate, 'yyyy-MM');
          }
        } catch (e) {
          console.log(`Invalid date format in monthly reflection ${key}:`, e);
        }
      }
      
      if (!normalizedMonth && value.monthId) {
        // If monthId is already in yyyy-MM format, use it directly
        if (value.monthId.match(/^\d{4}-\d{2}$/)) {
          normalizedMonth = value.monthId;
        } else {
          // Try to parse the monthId as a date
          try {
            const monthDate = new Date(value.monthId);
            if (!isNaN(monthDate.getTime())) {
              normalizedMonth = format(monthDate, 'yyyy-MM');
            }
          } catch (e) {
            console.log(`Failed to parse monthId as date for ${key}:`, e);
          }
        }
      }
      
      // If we still don't have a valid month, try id as a last resort
      if (!normalizedMonth && value.id && value.id !== value.monthId) {
        if (value.id.match(/^\d{4}-\d{2}$/)) {
          normalizedMonth = value.id;
        } else {
          try {
            const idDate = new Date(value.id);
            if (!isNaN(idDate.getTime())) {
              normalizedMonth = format(idDate, 'yyyy-MM');
            }
          } catch (e) {
            console.log(`Failed to parse id as date for monthly ${key}:`, e);
          }
        }
      }
      
      // If we still don't have a valid month, use the key as is
      if (!normalizedMonth) {
        normalizedMonth = value.monthId || value.id || key;
        console.log(`Using key as month for ${key}: ${normalizedMonth}`);
      }
      
      console.log(`Monthly reflection ${key} has normalized month: ${normalizedMonth}`);
      
      // Check if we've already seen a reflection for this month
      if (uniqueReflectionsByMonth.has(normalizedMonth)) {
        const existing = uniqueReflectionsByMonth.get(normalizedMonth)!;
        const existingReflection = existing.reflection;
        
        // Determine which reflection to keep - prefer:
        // 1. Non-placeholders over placeholders
        // 2. Reflections with content over empty ones
        // 3. More recent updates if both have content
        const existingHasContent = !!existingReflection.reflection;
        const newHasContent = !!value.reflection;
        const existingIsPlaceholder = existingReflection.isPlaceholder === true;
        const newIsPlaceholder = value.isPlaceholder === true;
        
        // Log what we found
        console.log(`Found duplicate for month ${normalizedMonth}:`);
        console.log(`  Existing (${existing.key}): hasContent=${existingHasContent}, isPlaceholder=${existingIsPlaceholder}`);
        console.log(`  New (${key}): hasContent=${newHasContent}, isPlaceholder=${newIsPlaceholder}`);
        
        // Logic to decide which to keep
        let keepNew = false;
        
        if (!existingIsPlaceholder && newIsPlaceholder) {
          // Keep the non-placeholder
          keepNew = false;
        } else if (existingIsPlaceholder && !newIsPlaceholder) {
          // Keep the non-placeholder
          keepNew = true;
        } else if (existingHasContent && !newHasContent) {
          // Keep the one with content
          keepNew = false;
        } else if (!existingHasContent && newHasContent) {
          // Keep the one with content
          keepNew = true;
        } else {
          // Both are placeholders or both have content (or both are empty),
          // so keep the one with the most recent update
          const existingDate = existingReflection.lastUpdated ? new Date(existingReflection.lastUpdated) : null;
          const newDate = value.lastUpdated ? new Date(value.lastUpdated) : null;
          
          if (existingDate && newDate) {
            keepNew = newDate > existingDate;
          } else if (!existingDate && newDate) {
            keepNew = true;
          } else {
            keepNew = false; // Default to keeping the first one we found
          }
        }
        
        if (keepNew) {
          console.log(`  Keeping new entry (${key}) and removing existing (${existing.key})`);
          // Remove the existing and add the new one
          keysToRemove.push(existing.key);
          keysToKeep.push(key);
          uniqueReflectionsByMonth.set(normalizedMonth, { key, reflection: value });
          monthlyRemoved++;
        } else {
          console.log(`  Keeping existing entry (${existing.key}) and removing new (${key})`);
          // Keep the existing and remove the new one
          keysToRemove.push(key);
          if (!keysToKeep.includes(existing.key)) {
            keysToKeep.push(existing.key);
          }
          monthlyRemoved++;
        }
      } else {
        // First time seeing this month
        console.log(`First entry for month ${normalizedMonth}: ${key}`);
        uniqueReflectionsByMonth.set(normalizedMonth, { key, reflection: value });
        keysToKeep.push(key);
      }
    });
    
    console.log(`Found ${keysToRemove.length} duplicate monthly reflection keys to remove`);
    console.log(`Keeping ${keysToKeep.length} unique monthly reflections`);
    
    if (keysToRemove.length > 0) {
      // Create a new object with only the keys to keep
      const cleanedReflections: Record<string, MonthlyReflection> = {};
      
      keysToKeep.forEach(key => {
        if (allMonthlyReflections[key]) {
          cleanedReflections[key] = allMonthlyReflections[key];
        }
      });
      
      monthlyRemoved = keysToRemove.length;
      console.log(`Removing ${monthlyRemoved} duplicate monthly reflections`);
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(cleanedReflections));
      dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    } else {
      console.log('No duplicate monthly reflections found that need removing');
    }
  } catch (error) {
    console.error('Error processing monthly reflections:', error);
  }
  
  if (weeklyRemoved > 0 || monthlyRemoved > 0) {
    console.log(`Total duplicates removed: ${weeklyRemoved + monthlyRemoved}`);
    
    // Dispatch events to update UI
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('journal-updated'));
      window.dispatchEvent(new Event('storage'));
    }, 50);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('journalUpdated'));
      window.dispatchEvent(new Event('storage'));
    }, 100);
  }
  
  return { weeklyRemoved, monthlyRemoved };
};

let lastEventDispatchTime: Record<string, number> = {};
const MIN_EVENT_INTERVAL = 500;

const dispatchStorageEvent = (key: string) => {
  const now = Date.now();
  if (lastEventDispatchTime[key] && (now - lastEventDispatchTime[key] < MIN_EVENT_INTERVAL)) {
    console.log(`Skipping event dispatch for ${key} - too soon after last event`);
    return;
  }
  
  lastEventDispatchTime[key] = now;
  
  const customEvent = new CustomEvent('journalUpdated', { detail: { key } });
  window.dispatchEvent(customEvent);
  
  const anotherCustomEvent = new CustomEvent('journal-updated', { detail: { key } });
  window.dispatchEvent(anotherCustomEvent);
  
  try {
    const storageEvent = new StorageEvent('storage', { key });
    window.dispatchEvent(storageEvent);
  } catch (e) {
    console.error('Error dispatching storage event:', e);
    window.dispatchEvent(new Event('storage'));
  }
  
  console.log(`Storage events dispatched for key: ${key}`);
};

export const associateTradeWithReflections = (tradeId: string, tradeDate: string | Date) => {
  if (!tradeId || !tradeDate) {
    console.error('Cannot associate trade: missing trade ID or date');
    return;
  }
  
  const tradeDateTime = new Date(tradeDate);
  if (isNaN(tradeDateTime.getTime())) {
    console.error('Cannot associate trade: invalid date format', tradeDate);
    return;
  }
  
  const weekStart = new Date(tradeDateTime);
  weekStart.setDate(tradeDateTime.getDate() - tradeDateTime.getDay() + (tradeDateTime.getDay() === 0 ? -6 : 1));
  const weekId = weekStart.toISOString().slice(0, 10);
  
  const monthId = tradeDateTime.toISOString().slice(0, 7);
  
  console.log(`Associating trade ${tradeId} with week ${weekId} and month ${monthId}`);
  
  const weeklyReflections = getWeeklyReflections();
  if (weeklyReflections[weekId]) {
    if (!weeklyReflections[weekId].tradeIds) {
      weeklyReflections[weekId].tradeIds = [];
    }
    
    if (!weeklyReflections[weekId].tradeIds.includes(tradeId)) {
      weeklyReflections[weekId].tradeIds.push(tradeId);
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(weeklyReflections));
      dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
      console.log(`Added trade ${tradeId} to weekly reflection ${weekId}`);
    }
  }
  
  const monthlyReflections = getMonthlyReflections();
  if (monthlyReflections[monthId]) {
    if (!monthlyReflections[monthId].tradeIds) {
      monthlyReflections[monthId].tradeIds = [];
    }
    
    if (!monthlyReflections[monthId].tradeIds.includes(tradeId)) {
      monthlyReflections[monthId].tradeIds.push(tradeId);
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(monthlyReflections));
      dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
      console.log(`Added trade ${tradeId} to monthly reflection ${monthId}`);
    }
  }
};

export const saveWeeklyReflection = (weekId: string, reflection: string, grade?: string, weeklyPlan?: string): void => {
  if (!weekId) {
    console.error('Cannot save weekly reflection: weekId is empty');
    return;
  }
  
  debugStorage('Saving weekly reflection', weekId, {reflection: reflection.substring(0, 50) + '...', grade, weeklyPlan: weeklyPlan?.substring(0, 50) + '...'});
  
  try {
    const reflections = getWeeklyReflections();
    
    const currentDate = new Date(weekId);
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    reflections[weekId] = {
      ...reflections[weekId],
      id: weekId,
      weekId: weekId,
      weekStart: reflections[weekId]?.weekStart || weekStart.toISOString(),
      weekEnd: reflections[weekId]?.weekEnd || weekEnd.toISOString(),
      reflection,
      weeklyPlan: weeklyPlan || '',
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[weekId]?.tradeIds || [],
      isPlaceholder: false
    };
    
    const reflectionsJson = JSON.stringify(reflections);
    
    try {
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, reflectionsJson);
      
      const savedData = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
      if (!savedData) {
        throw new Error('Failed to retrieve data after saving');
      }
      
      if (savedData.indexOf('"' + weekId + '"') === -1) {
        throw new Error(`Saved data doesn't contain the weekId: ${weekId}`);
      }
      
      debugStorage('Weekly reflection saved successfully', weekId);
    } catch (error) {
      console.error('Error saving weekly reflection:', error);
      
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        const dataSize = reflectionsJson.length / 1024;
        console.error(`Storage limit reached! Attempted to save ${dataSize.toFixed(2)}KB`);
        toast.error('Storage limit reached. Try removing some old entries or images.');
      } else {
        toast.error('Failed to save reflection. Please try again or check console for errors.');
      }
      return;
    }
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error in saveWeeklyReflection:', error);
    toast.error('Failed to save weekly reflection');
  }
};

export const saveMonthlyReflection = (monthId: string, reflection: string, grade?: string): void => {
  if (!monthId) {
    console.error('Cannot save monthly reflection: monthId is empty');
    return;
  }
  
  debugStorage('Saving monthly reflection', monthId, {reflection: reflection.substring(0, 50) + '...', grade});
  
  try {
    const reflections = getMonthlyReflections();
    
    let year: number;
    let month: number;
    
    if (monthId.match(/^\d{4}-\d{2}$/)) {
      year = parseInt(monthId.split('-')[0], 10);
      month = parseInt(monthId.split('-')[1], 10) - 1;
    } else {
      const date = new Date(monthId);
      year = date.getFullYear();
      month = date.getMonth();
    }
    
    if (isNaN(year) || isNaN(month)) {
      console.error(`Invalid monthId format: ${monthId}, expected 'YYYY-MM'`);
      return;
    }
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const exactMonthId = monthId;
    
    reflections[exactMonthId] = {
      ...reflections[exactMonthId],
      id: exactMonthId,
      monthId: exactMonthId,
      monthStart: reflections[exactMonthId]?.monthStart || monthStart.toISOString(),
      monthEnd: reflections[exactMonthId]?.monthEnd || monthEnd.toISOString(),
      reflection,
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[exactMonthId]?.tradeIds || [],
      isPlaceholder: false
    };
    
    debugStorage("Saving monthly reflection object", exactMonthId, reflections[exactMonthId]);
    
    const reflectionsJson = JSON.stringify(reflections);
    
    try {
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, reflectionsJson);
      
      const savedData = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
      if (!savedData) {
        throw new Error('Failed to retrieve data after saving');
      }
      
      const parsedData = JSON.parse(savedData);
      if (!parsedData[exactMonthId]) {
        throw new Error(`Saved data doesn't contain the monthId: ${exactMonthId}`);
      }
      
      debugStorage('Monthly reflection saved successfully', exactMonthId);
    } catch (error) {
      console.error('Error saving monthly reflection:', error);
      
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        const dataSize = reflectionsJson.length / 1024;
        console.error(`Storage limit reached! Attempted to save ${dataSize.toFixed(2)}KB`);
        toast.error('Storage limit reached. Try removing some old entries or images.');
      } else {
        toast.error('Failed to save reflection. Please try again or check console for errors.');
      }
      return;
    }
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error in saveMonthlyReflection:', error);
    toast.error('Failed to save monthly reflection');
  }
};

export const saveWeeklyReflectionObject = (reflection: WeeklyReflection): void => {
  try {
    if (!reflection) {
      console.error('Cannot save null reflection object');
      return;
    }
    
    const reflections = getWeeklyReflections();
    const weekId = reflection.weekId || reflection.id || '';
    
    if (!weekId) {
      console.error('Cannot save reflection without id or weekId');
      return;
    }
    
    reflections[weekId] = {
      ...reflection,
      id: weekId,
      weekId: weekId,
      lastUpdated: new Date().toISOString(),
      isPlaceholder: false
    };
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    console.log(`Weekly reflection object saved successfully for ${weekId}`);
  } catch (error) {
    console.error('Error saving weekly reflection object:', error);
  }
};

export const saveMonthlyReflectionObject = (reflection: MonthlyReflection): void => {
  try {
    if (!reflection) {
      console.error('Cannot save null reflection object');
      return;
    }
    
    const reflections = getMonthlyReflections();
    const monthId = reflection.monthId || reflection.id || '';
    
    if (!monthId) {
      console.error('Cannot save reflection without id or monthId');
      return;
    }
    
    reflections[monthId] = {
      ...reflection,
      id: monthId,
      monthId: monthId,
      lastUpdated: new Date().toISOString(),
      isPlaceholder: false
    };
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    console.log(`Monthly reflection object saved successfully for ${monthId}`);
  } catch (error) {
    console.error('Error saving monthly reflection object:', error);
  }
};

export const deleteWeeklyReflection = (weekId: string): void => {
  try {
    if (!weekId) {
      console.error('Cannot delete weekly reflection: weekId is empty');
      return;
    }
    
    const reflections = getWeeklyReflections();
    delete reflections[weekId];
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    console.log(`Weekly reflection deleted successfully for ${weekId}`);
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
  }
};

export const deleteMonthlyReflection = (monthId: string): void => {
  try {
    if (!monthId) {
      console.error('Cannot delete monthly reflection: monthId is empty');
      return;
    }
    
    const reflections = getMonthlyReflections();
    delete reflections[monthId];
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    console.log(`Monthly reflection deleted successfully for ${monthId}`);
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
  }
};

export const getAllWeeklyReflections = () => {
  try {
    console.log('[JOURNAL STORAGE] Getting ALL weekly reflections for key "trade-journal-weekly-reflections"');
    const reflectionsJson = localStorage.getItem('trade-journal-weekly-reflections');
    
    if (!reflectionsJson) {
      console.log('No weekly reflections found in local storage');
      return {};
    }
    
    console.log('Data:', reflectionsJson.substring(0, 100) + '...');
    
    try {
      const data = JSON.parse(reflectionsJson);
      return data || {};
    } catch (e) {
      console.error('Failed to parse weekly reflections JSON:', e);
      return {};
    }
  } catch (error) {
    console.error('Error getting all weekly reflections:', error);
    return {};
  }
};

export const getAllMonthlyReflections = () => {
  try {
    console.log('[JOURNAL STORAGE] Getting ALL monthly reflections for key "trade-journal-monthly-reflections"');
    const reflectionsJson = localStorage.getItem('trade-journal-monthly-reflections');
    
    if (!reflectionsJson) {
      console.log('No monthly reflections found in local storage');
      return {};
    }
    
    console.log('Data:', reflectionsJson.substring(0, 100) + '...');
    
    try {
      const data = JSON.parse(reflectionsJson);
      return data || {};
    } catch (e) {
      console.error('Failed to parse monthly reflections JSON:', e);
      return {};
    }
  } catch (error) {
    console.error('Error getting all monthly reflections:', error);
    return {};
  }
};

export const getWeeklyReflectionsForMonth = (monthId: string): WeeklyReflection[] => {
  if (!monthId) {
    console.error('Cannot get weekly reflections: monthId is empty');
    return [];
  }

  try {
    let formattedMonthId = monthId;
    if (!monthId.match(/^\d{4}-\d{2}$/)) {
      const date = new Date(monthId);
      if (!isNaN(date.getTime())) {
        formattedMonthId = date.toISOString().slice(0, 7);
      }
    }

    const allWeeklyReflections = getAllWeeklyReflections();
    
    const weeklyReflectionMap = new Map<string, WeeklyReflection>();

    Object.values(allWeeklyReflections).forEach((reflection: WeeklyReflection) => {
      if (reflection && reflection.weekStart) {
        try {
          const weekStart = new Date(reflection.weekStart);
          const weekMonth = weekStart.toISOString().slice(0, 7);
          
          if (weekMonth === formattedMonthId) {
            const existingReflection = weeklyReflectionMap.get(reflection.weekId);
            
            if (!existingReflection || 
                (reflection.lastUpdated && existingReflection.lastUpdated && 
                 new Date(reflection.lastUpdated) > new Date(existingReflection.lastUpdated))) {
              weeklyReflectionMap.set(reflection.weekId, reflection);
            }
          }
        } catch (e) {
          console.error('Error parsing date in getWeeklyReflectionsForMonth:', e);
        }
      }
    });

    const monthlyReflections = Array.from(weeklyReflectionMap.values());

    monthlyReflections.sort((a, b) => {
      if (!a.weekStart || !b.weekStart) return 0;
      return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
    });

    return monthlyReflections;
  } catch (e) {
    console.error('Error in getWeeklyReflectionsForMonth:', e);
    return [];
  }
};

export const getWeeklyReflection = (weekId: string) => {
  try {
    const reflections = getAllWeeklyReflections();
    return reflections[weekId] || null;
  } catch (error) {
    console.error('Error getting weekly reflection:', error);
    return null;
  }
};

export const weeklyReflectionExists = (weekId: string) => {
  try {
    const reflections = getAllWeeklyReflections();
    return !!reflections[weekId];
  } catch (error) {
    console.error('Error checking if weekly reflection exists:', error);
    return false;
  }
};
