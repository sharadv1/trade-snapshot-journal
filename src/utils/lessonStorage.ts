
import { Lesson } from '@/types';
import { toast } from '@/utils/toast';
import { isUsingServerSync, getServerUrl } from './storage/serverConnection';

const STORAGE_KEY = 'trade-journal-lessons';
const SERVER_ENDPOINT = '/api/lessons';

// Get all lessons
export const getLessons = async (): Promise<Lesson[]> => {
  try {
    // Try to get from server first if server sync is enabled
    if (isUsingServerSync() && getServerUrl()) {
      const baseUrl = getServerUrl().replace(/\/trades$/, '');
      const lessonUrl = `${baseUrl}${SERVER_ENDPOINT}`;
      
      try {
        console.log('Attempting to load lessons from server:', lessonUrl);
        const response = await fetch(lessonUrl);
        
        if (response.ok) {
          const serverLessons = await response.json();
          console.log(`Loaded ${serverLessons.length} lessons from server`);
          
          // Update localStorage with server data as a cache
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverLessons));
          } catch (e) {
            console.warn('Could not cache lessons in localStorage:', e);
          }
          
          return serverLessons;
        } else {
          throw new Error(`Server returned an error status: ${response.status}`);
        }
      } catch (serverError) {
        console.error('Error fetching from server:', serverError);
        toast.error('Server connection failed, using local storage');
      }
    }
    
    // Fallback to localStorage
    return getLessonsFromLocalStorage();
  } catch (error) {
    console.error('Error getting lessons:', error);
    toast.error('Failed to load lessons');
    return [];
  }
};

// Synchronous fallback for localStorage
const getLessonsFromLocalStorage = (): Lesson[] => {
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
    console.error('Error loading lessons from localStorage:', error);
    return [];
  }
};

// Save all lessons
export const saveLessons = async (lessons: Lesson[]): Promise<boolean> => {
  try {
    if (!Array.isArray(lessons)) {
      console.error('Invalid lessons data:', lessons);
      return false;
    }
    
    // Try to save to server first if server sync is enabled
    if (isUsingServerSync() && getServerUrl()) {
      const baseUrl = getServerUrl().replace(/\/trades$/, '');
      const lessonUrl = `${baseUrl}${SERVER_ENDPOINT}`;
      
      try {
        console.log('Saving lessons to server:', lessonUrl);
        const response = await fetch(lessonUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lessons),
        });
        
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        } else {
          console.log('Lessons saved to server successfully');
          
          // Try to update localStorage as cache, but don't fail if it doesn't work
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
          } catch (e) {
            console.warn('Could not cache lessons in localStorage:', e);
          }
          
          return true;
        }
      } catch (serverError) {
        console.error('Error saving to server:', serverError);
        
        // If server fails, try localStorage as fallback
        toast.error('Server save failed, trying local storage');
      }
    }
    
    // Try localStorage as fallback or primary if no server
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      
      if (e instanceof DOMException && (
        e.name === 'QuotaExceededError' || 
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        
        const sizeInKB = JSON.stringify(lessons).length / 1024;
        console.error('Storage error: Tried to save', sizeInKB.toFixed(2), 'KB but hit limit');
        
        toast.error('Storage limit reached. Please enable server sync or export your data.');
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error saving lessons:', error);
    toast.error('Failed to save lessons');
    return false;
  }
};

// Add a new lesson
export const addLesson = async (lesson: Lesson): Promise<boolean> => {
  try {
    const lessons = await getLessons();
    lessons.push(lesson);
    return await saveLessons(lessons);
  } catch (error) {
    console.error('Error adding lesson:', error);
    toast.error('Failed to add lesson');
    return false;
  }
};

// Update an existing lesson
export const updateLesson = async (updatedLesson: Lesson): Promise<boolean> => {
  try {
    const lessons = await getLessons();
    const index = lessons.findIndex((lesson) => lesson.id === updatedLesson.id);
    
    if (index !== -1) {
      lessons[index] = updatedLesson;
      return await saveLessons(lessons);
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
export const deleteLesson = async (lessonId: string): Promise<boolean> => {
  try {
    const lessons = await getLessons();
    const updatedLessons = lessons.filter((lesson) => lesson.id !== lessonId);
    return await saveLessons(updatedLessons);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    toast.error('Failed to delete lesson');
    return false;
  }
};

// Get a lesson by ID
export const getLessonById = async (lessonId: string): Promise<Lesson | undefined> => {
  try {
    const lessons = await getLessons();
    return lessons.find((lesson) => lesson.id === lessonId);
  } catch (error) {
    console.error('Error getting lesson by ID:', error);
    return undefined;
  }
};

// Get all unique lesson types
export const getLessonTypes = (): string[] => {
  try {
    const lessons = getLessonsFromLocalStorage();
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
export const exportLessons = async (): Promise<string> => {
  try {
    const lessons = await getLessons();
    return JSON.stringify(lessons, null, 2);
  } catch (error) {
    console.error('Error exporting lessons:', error);
    toast.error('Failed to export lessons');
    return '';
  }
};

// Import lessons from JSON
export const importLessons = async (json: string): Promise<boolean> => {
  try {
    const lessons = JSON.parse(json);
    if (!Array.isArray(lessons)) {
      toast.error('Invalid lessons data format');
      return false;
    }
    
    return await saveLessons(lessons);
  } catch (error) {
    console.error('Error importing lessons:', error);
    toast.error('Failed to import lessons');
    return false;
  }
};

// Sync lessons with server
export const syncLessonsWithServer = async (): Promise<boolean> => {
  if (!isUsingServerSync() || !getServerUrl()) {
    console.log('Server sync is not enabled for lessons');
    return false;
  }
  
  try {
    const baseUrl = getServerUrl().replace(/\/trades$/, '');
    const lessonUrl = `${baseUrl}${SERVER_ENDPOINT}`;
    
    console.log('Syncing lessons with server at:', lessonUrl);
    
    // Get current lessons from both sources
    const localLessons = getLessonsFromLocalStorage();
    
    const response = await fetch(lessonUrl);
    if (!response.ok) {
      throw new Error(`Server returned an error status: ${response.status}`);
    }
    
    const serverLessons = await response.json();
    
    // Simple merge strategy - use the larger set
    // This is a naive approach that could be improved
    if (serverLessons.length >= localLessons.length) {
      // Server has same or more lessons, use server data
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverLessons));
      } catch (e) {
        console.warn('Could not update localStorage with server lessons:', e);
      }
      console.log('Using server lessons (same or more lessons)');
    } else {
      // Local has more lessons, push to server
      await fetch(lessonUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localLessons),
      });
      console.log('Pushed local lessons to server (more local lessons)');
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing lessons with server:', error);
    toast.error('Failed to sync lessons with server');
    return false;
  }
};
