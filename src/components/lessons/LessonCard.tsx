
import React from 'react';
import { Lesson } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { deleteLesson } from '@/utils/lessonStorage';
import { toast } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LessonMedia } from './LessonMedia';

interface LessonCardProps {
  lesson: Lesson;
  onEdit: () => void;
  onUpdate: () => void;
}

export function LessonCard({ lesson, onEdit, onUpdate }: LessonCardProps) {
  const handleDelete = () => {
    try {
      deleteLesson(lesson.id);
      toast.success('Lesson deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden w-full">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-0">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">{lesson.title}</h3>
            
            <div className="mb-4">
              <p className="text-gray-700 whitespace-pre-line">{lesson.description}</p>
            </div>
            
            {lesson.types && lesson.types.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {lesson.types.map((type) => (
                  <Badge key={type} variant="secondary">{type}</Badge>
                ))}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mb-4">
              {formatDate(lesson.createdAt)}
              {lesson.updatedAt !== lesson.createdAt && 
                ` (Updated: ${formatDate(lesson.updatedAt)})`}
            </div>

            {lesson.media && lesson.media.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <LessonMedia media={lesson.media || []} />
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this lesson? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
