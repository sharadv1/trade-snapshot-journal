
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

// Compress media data URLs to reduce storage size
const compressMedia = (lesson: Lesson): Lesson => {
  if (!lesson.media || lesson.media.length === 0) return lesson;
  
  const compressedLesson = { ...lesson };
  compressedLesson.media = lesson.media.map(media => {
    // If media has a data URL, compress it if necessary
    if (media.url && media.url.startsWith('data:image/')) {
      // Only compress if the URL is large
      if (media.url.length > 50000) {
        // Reduce quality/resize for large images
        // This is a simplified approach - in production you'd use a proper image processing library
        try {
          const img = new Image();
          img.src = media.url;
          
          const canvas = document.createElement('canvas');
          // Scale down large images
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
          
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Lower quality for JPEGs (0.7 is a good balance between quality and size)
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            console.log(`Compressed image from ${Math.round(media.url.length/1024)}KB to ${Math.round(compressedUrl.length/1024)}KB`);
            
            return { ...media, url: compressedUrl };
          }
        } catch (e) {
          console.warn('Failed to compress image:', e);
        }
      }
    }
    return media;
  });
  
  return compressedLesson;
};

// Helper function to check if we're near storage limit
const isNearStorageLimit = (): boolean => {
  try {
    // Check total localStorage usage (approximate)
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) total += value.length;
      }
    }
    
    // Most browsers have a limit of 5-10MB
    // Consider 4MB as approaching the limit (80% of 5MB)
    const APPROACHING_LIMIT = 4 * 1024 * 1024; 
    return total > APPROACHING_LIMIT;
  } catch (e) {
    return false;
  }
};

// Storage cleanup - remove old lessons if necessary
const cleanupStorageIfNeeded = (newLessonSize: number): boolean => {
  if (!isNearStorageLimit()) return true;
  
  try {
    // Get current lessons
    const lessons = getLessons();
    
    // If we have at least 3 lessons, we can consider removing the oldest ones
    if (lessons.length >= 3) {
      // Sort by creation date (oldest first)
      const sortedLessons = [...lessons].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Remove the oldest lesson
      const oldestLesson = sortedLessons[0];
      console.log(`Removing oldest lesson to free storage: ${oldestLesson.id}`);
      
      const remainingLessons = lessons.filter(l => l.id !== oldestLesson.id);
      
      // Try to save the remaining lessons
      const remainingJson = JSON.stringify(remainingLessons);
      localStorage.setItem(STORAGE_KEY, remainingJson);
      
      // Show a notification to the user
      toast.info(`Removed oldest lesson due to storage limits. Please consider exporting your data.`);
      
      return true;
    }
  } catch (e) {
    console.error('Error during storage cleanup:', e);
  }
  
  return false;
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
    const sizeInKB = lessonsJson.length / 1024;
    console.log(`Attempting to save ${sizeInKB.toFixed(2)}KB of lesson data`);
    
    // Try to save
    try {
      localStorage.setItem(STORAGE_KEY, lessonsJson);
    } catch (e) {
      // If we hit a storage limit, try cleanup and compression
      if (e instanceof DOMException && (
          e.name === 'QuotaExceededError' || 
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        
        console.error('Storage error: Tried to save', sizeInKB.toFixed(2), 'KB but hit limit');
        
        // Try storage cleanup first
        if (cleanupStorageIfNeeded(lessonsJson.length)) {
          try {
            // Try saving again after cleanup
            localStorage.setItem(STORAGE_KEY, lessonsJson);
            return true;
          } catch (cleanupError) {
            // If still fails, try compression
            console.log('Still not enough space after cleanup, trying compression');
          }
        }
        
        // Try compression as a last resort
        const compressedLessons = lessons.map(compressMedia);
        const compressedJson = JSON.stringify(compressedLessons);
        const compressedSizeKB = compressedJson.length / 1024;
        
        console.log(`Compressed lesson data from ${sizeInKB.toFixed(2)}KB to ${compressedSizeKB.toFixed(2)}KB`);
        
        try {
          localStorage.setItem(STORAGE_KEY, compressedJson);
          toast.success('Lessons saved with compressed media to fit storage limits');
          return true;
        } catch (compressionError) {
          // If everything fails, suggest export
          toast.error('Storage limit reached. Please export your data and clear some entries.');
          return false;
        }
      }
      
      // Re-throw if it's a different error
      throw e;
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
    
    // Check if we're near storage limit and compress proactively
    if (isNearStorageLimit()) {
      const compressedLesson = compressMedia(lesson);
      lessons.push(compressedLesson);
      
      // Show a notification about compression
      if (lesson !== compressedLesson) {
        toast.info('Media was compressed to save storage space');
      }
    } else {
      lessons.push(lesson);
    }
    
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
      // Check if we're near storage limit and compress proactively
      if (isNearStorageLimit()) {
        const compressedLesson = compressMedia(updatedLesson);
        lessons[index] = compressedLesson;
        
        // Show a notification about compression
        if (updatedLesson !== compressedLesson) {
          toast.info('Media was compressed to save storage space');
        }
      } else {
        lessons[index] = updatedLesson;
      }
      
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

// Export lessons to JSON
export const exportLessons = (): string => {
  try {
    const lessons = getLessons();
    return JSON.stringify(lessons, null, 2);
  } catch (error) {
    console.error('Error exporting lessons:', error);
    toast.error('Failed to export lessons');
    return '';
  }
};

// Import lessons from JSON
export const importLessons = (json: string): boolean => {
  try {
    const lessons = JSON.parse(json);
    if (!Array.isArray(lessons)) {
      toast.error('Invalid lessons data format');
      return false;
    }
    
    return saveLessons(lessons);
  } catch (error) {
    console.error('Error importing lessons:', error);
    toast.error('Failed to import lessons');
    return false;
  }
};
