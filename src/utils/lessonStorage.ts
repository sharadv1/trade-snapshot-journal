
import { Lesson } from '@/types';

const STORAGE_KEY = 'trade-journal-lessons';

// Get all lessons
export const getLessons = (): Lesson[] => {
  try {
    const lessonsJson = localStorage.getItem(STORAGE_KEY);
    if (!lessonsJson) return [];
    return JSON.parse(lessonsJson);
  } catch (error) {
    console.error('Error loading lessons:', error);
    return [];
  }
};

// Save all lessons
export const saveLessons = (lessons: Lesson[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
    // Trigger storage event for components listening to updates
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(lessons),
      })
    );
  } catch (error) {
    console.error('Error saving lessons:', error);
  }
};

// Add a new lesson
export const addLesson = (lesson: Lesson): void => {
  const lessons = getLessons();
  lessons.push(lesson);
  saveLessons(lessons);
};

// Update an existing lesson
export const updateLesson = (updatedLesson: Lesson): void => {
  const lessons = getLessons();
  const index = lessons.findIndex((lesson) => lesson.id === updatedLesson.id);
  
  if (index !== -1) {
    lessons[index] = updatedLesson;
    saveLessons(lessons);
  }
};

// Delete a lesson
export const deleteLesson = (lessonId: string): void => {
  const lessons = getLessons();
  const updatedLessons = lessons.filter((lesson) => lesson.id !== lessonId);
  saveLessons(updatedLessons);
};

// Get a lesson by ID
export const getLessonById = (lessonId: string): Lesson | undefined => {
  const lessons = getLessons();
  return lessons.find((lesson) => lesson.id === lessonId);
};

// Get all unique lesson types
export const getLessonTypes = (): string[] => {
  const lessons = getLessons();
  const typesSet = new Set<string>();
  
  lessons.forEach((lesson) => {
    if (lesson.types && lesson.types.length > 0) {
      lesson.types.forEach((type) => typesSet.add(type));
    }
  });
  
  return Array.from(typesSet);
};
