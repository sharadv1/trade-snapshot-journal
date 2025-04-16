import { format, startOfWeek, endOfWeek } from 'date-fns';
import { 
  WEEKLY_REFLECTIONS_KEY, 
  MONTHLY_REFLECTIONS_KEY,
  dispatchStorageEvent
} from './storageCore';
import { toast } from '@/utils/toast';

/**
 * Removes duplicate reflections from storage
 * @returns Count of removed reflections
 */
export function removeDuplicateReflections(): { weeklyRemoved: number, monthlyRemoved: number } {
  console.log('=== STARTING ENHANCED DUPLICATE REMOVAL PROCESS ===');
  let weeklyRemoved = 0;
  let monthlyRemoved = 0;
  
  // Handle weekly reflections
  weeklyRemoved = removeDuplicateWeeklyReflections();
  
  // Handle monthly reflections
  monthlyRemoved = removeDuplicateMonthlyReflections();
  
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
}

/**
 * Removes duplicate weekly reflections
 */
function removeDuplicateWeeklyReflections(): number {
  try {
    console.log('Processing weekly reflections...');
    const weeklyReflectionsRaw = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    if (!weeklyReflectionsRaw) {
      console.log('No weekly reflections found in localStorage');
      return 0;
    }
    
    let allWeeklyReflections: Record<string, any>;
    try {
      allWeeklyReflections = JSON.parse(weeklyReflectionsRaw);
      const allKeys = Object.keys(allWeeklyReflections);
      console.log(`Parsed ${allKeys.length} weekly reflections with keys: ${allKeys.join(', ')}`);
    } catch (e) {
      console.error('Failed to parse weekly reflections JSON:', e);
      return 0;
    }
    
    if (typeof allWeeklyReflections !== 'object' || allWeeklyReflections === null) {
      console.error('Weekly reflections is not an object:', allWeeklyReflections);
      return 0;
    }
    
    // Map to store unique reflections by normalized date range
    const uniqueReflectionsByRange = new Map<string, { key: string, reflection: any }>();
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
        
        // Determine which reflection to keep based on content quality and recency
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
          // Both are placeholders or both have content or both are empty,
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
          keysToRemove.push(existing.key);
          keysToKeep.push(key);
          uniqueReflectionsByRange.set(normalizedDateRange, { key, reflection: value });
        } else {
          console.log(`  Keeping existing entry (${existing.key}) and removing new (${key})`);
          keysToRemove.push(key);
          if (!keysToKeep.includes(existing.key)) {
            keysToKeep.push(existing.key);
          }
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
      const cleanedReflections: Record<string, any> = {};
      
      keysToKeep.forEach(key => {
        if (allWeeklyReflections[key]) {
          cleanedReflections[key] = allWeeklyReflections[key];
        }
      });
      
      const weeklyRemoved = keysToRemove.length;
      console.log(`Removing ${weeklyRemoved} duplicate weekly reflections`);
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(cleanedReflections));
      dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
      return weeklyRemoved;
    } else {
      console.log('No duplicate weekly reflections found that need removing');
      return 0;
    }
  } catch (error) {
    console.error('Error processing weekly reflections:', error);
    return 0;
  }
}

/**
 * Removes duplicate monthly reflections
 */
function removeDuplicateMonthlyReflections(): number {
  try {
    console.log('Processing monthly reflections...');
    const monthlyReflectionsRaw = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    if (!monthlyReflectionsRaw) {
      console.log('No monthly reflections found in localStorage');
      return 0;
    }
    
    let allMonthlyReflections: Record<string, any>;
    try {
      allMonthlyReflections = JSON.parse(monthlyReflectionsRaw);
      const allKeys = Object.keys(allMonthlyReflections);
      console.log(`Parsed ${allKeys.length} monthly reflections with keys: ${allKeys.join(', ')}`);
    } catch (e) {
      console.error('Failed to parse monthly reflections JSON:', e);
      return 0;
    }
    
    if (typeof allMonthlyReflections !== 'object' || allMonthlyReflections === null) {
      console.error('Monthly reflections is not an object:', allMonthlyReflections);
      return 0;
    }
    
    // Map to store unique reflections by normalized month
    const uniqueReflectionsByMonth = new Map<string, { key: string, reflection: any }>();
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
        
        // Determine which reflection to keep based on content quality and recency
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
          keysToRemove.push(existing.key);
          keysToKeep.push(key);
          uniqueReflectionsByMonth.set(normalizedMonth, { key, reflection: value });
        } else {
          console.log(`  Keeping existing entry (${existing.key}) and removing new (${key})`);
          keysToRemove.push(key);
          if (!keysToKeep.includes(existing.key)) {
            keysToKeep.push(existing.key);
          }
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
      const cleanedReflections: Record<string, any> = {};
      
      keysToKeep.forEach(key => {
        if (allMonthlyReflections[key]) {
          cleanedReflections[key] = allMonthlyReflections[key];
        }
      });
      
      const monthlyRemoved = keysToRemove.length;
      console.log(`Removing ${monthlyRemoved} duplicate monthly reflections`);
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(cleanedReflections));
      dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
      return monthlyRemoved;
    } else {
      console.log('No duplicate monthly reflections found that need removing');
      return 0;
    }
  } catch (error) {
    console.error('Error processing monthly reflections:', error);
    return 0;
  }
}
