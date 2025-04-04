
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { LessonList } from '@/components/lessons/LessonList';
import { LessonDialog } from '@/components/lessons/LessonDialog';
import { LessonFilters } from '@/components/lessons/LessonFilters';
import { Lesson } from '@/types';
import { getLessons } from '@/utils/lessonStorage';

export default function Lessons() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = () => {
    const loadedLessons = getLessons();
    setLessons(loadedLessons);
  };

  const handleOpenDialog = () => {
    setEditingLesson(null);
    setIsDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLesson(null);
    loadLessons();
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const filteredLessons = selectedTypes.length > 0
    ? lessons.filter(lesson => 
        lesson.types && lesson.types.some(type => selectedTypes.includes(type))
      )
    : lessons;

  // Get all unique types from lessons
  const allTypes = [...new Set(lessons.flatMap(lesson => lesson.types || []))];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </div>
      </div>

      {showFilters && (
        <LessonFilters 
          allTypes={allTypes}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
        />
      )}

      <LessonList 
        lessons={filteredLessons} 
        onEdit={handleEditLesson} 
        onUpdate={loadLessons} 
      />

      <LessonDialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        lesson={editingLesson}
      />
    </div>
  );
}
