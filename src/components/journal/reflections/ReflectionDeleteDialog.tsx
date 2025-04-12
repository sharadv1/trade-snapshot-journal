
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WeeklyReflection, MonthlyReflection } from '@/types';

interface ReflectionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reflection: WeeklyReflection | MonthlyReflection | null;
  onReflectionDeleted: () => void;
  type?: 'weekly' | 'monthly';
}

export const ReflectionDeleteDialog: React.FC<ReflectionDeleteDialogProps> = ({ 
  isOpen, 
  onClose, 
  reflection, 
  onReflectionDeleted,
  type = 'weekly'
}) => {
  const handleConfirm = () => {
    if (reflection) {
      onReflectionDeleted();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Reflection</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {type} reflection? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-red-500 hover:bg-red-600" 
            onClick={handleConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
