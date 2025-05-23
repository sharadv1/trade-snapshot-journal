
import React from 'react';
import { Lesson } from '@/types';
import { LessonCard } from './LessonCard';

interface LessonListProps {
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onUpdate: () => void;
}

export function LessonList({ lessons, onEdit, onUpdate }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 max-w-full mx-auto">
        <h3 className="text-lg font-medium text-gray-600">No lessons found</h3>
        <p className="text-gray-500 mt-2">Add your first lesson using the button above</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {lessons.map((lesson) => (
        <LessonCard 
          key={lesson.id} 
          lesson={lesson} 
          onEdit={() => onEdit(lesson)}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
