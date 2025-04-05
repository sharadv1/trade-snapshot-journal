
import { Lesson } from '@/types';
import { toast } from '@/utils/toast';

const STORAGE_KEY = 'trade-journal-lessons';

// Get all lessons
export const getLessons = (): Lesson[] => {
  try {
    const lessonsJson = localStorage.getItem(STORAGE_KEY);
    if (!lessonsJson) return [];
    
    const parsed = JSON.parse(lessonsJson);
    if (!Array.isArray(parsed)) {
      console.error('Invalid lessons data format in localStorage');
      return [];
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading lessons:', error);
    toast.error('Failed to load lessons from storage');
    return [];
  }
};

// Save all lessons
export const saveLessons = (lessons: Lesson[]): boolean => {
  try {
    if (!Array.isArray(lessons)) {
      console.error('Invalid lessons data:', lessons);
      return false;
    }
    
    // Check storage size before saving to prevent limits issues
    const lessonsJson = JSON.stringify(lessons);
    try {
      localStorage.setItem(STORAGE_KEY, lessonsJson);
    } catch (e) {
      // If we hit a storage limit, show a detailed error and provide debugging info
      console.error('Error during localStorage setItem:', e);
      
      if (e instanceof DOMException && (
          e.name === 'QuotaExceededError' || 
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        
        // Get storage usage data for debugging
        const storageUsed = lessonsJson.length / 1024; // KB
        console.error(`Storage error: Tried to save ${storageUsed.toFixed(2)}KB but hit limit`);
        
        toast.error('Storage limit reached. Try removing some old entries or images.');
        return false;
      }
      throw e; // Re-throw if it's a different error
    }
    
    // Verify data was saved correctly
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData || savedData !== lessonsJson) {
      console.error('Lessons data verification failed');
      return false;
    }
    
    // Trigger storage event for components listening to updates
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: lessonsJson,
      })
    );
    
    // Also dispatch a custom event for broader compatibility
    document.dispatchEvent(new CustomEvent('lessons-updated'));
    
    return true;
  } catch (error) {
    console.error('Error saving lessons:', error);
    toast.error('Failed to save lessons to storage');
    return false;
  }
};

// Add a new lesson
export const addLesson = (lesson: Lesson): boolean => {
  try {
    const lessons = getLessons();
    lessons.push(lesson);
    return saveLessons(lessons);
  } catch (error) {
    console.error('Error adding lesson:', error);
    toast.error('Failed to add lesson');
    return false;
  }
};

// Update an existing lesson
export const updateLesson = (updatedLesson: Lesson): boolean => {
  try {
    const lessons = getLessons();
    const index = lessons.findIndex((lesson) => lesson.id === updatedLesson.id);
    
    if (index !== -1) {
      lessons[index] = updatedLesson;
      return saveLessons(lessons);
    } else {
      console.error('Lesson not found for update:', updatedLesson.id);
      return false;
    }
  } catch (error) {
    console.error('Error updating lesson:', error);
    toast.error('Failed to update lesson');
    return false;
  }
};

// Delete a lesson
export const deleteLesson = (lessonId: string): boolean => {
  try {
    const lessons = getLessons();
    const updatedLessons = lessons.filter((lesson) => lesson.id !== lessonId);
    return saveLessons(updatedLessons);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    toast.error('Failed to delete lesson');
    return false;
  }
};

// Get a lesson by ID
export const getLessonById = (lessonId: string): Lesson | undefined => {
  try {
    const lessons = getLessons();
    return lessons.find((lesson) => lesson.id === lessonId);
  } catch (error) {
    console.error('Error getting lesson by ID:', error);
    return undefined;
  }
};

// Get all unique lesson types
export const getLessonTypes = (): string[] => {
  try {
    const lessons = getLessons();
    const typesSet = new Set<string>();
    
    lessons.forEach((lesson) => {
      if (lesson.types && lesson.types.length > 0) {
        lesson.types.forEach((type) => typesSet.add(type));
      }
    });
    
    return Array.from(typesSet);
  } catch (error) {
    console.error('Error getting lesson types:', error);
    return [];
  }
};
