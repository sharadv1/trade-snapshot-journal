
import React from 'react';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReflectionDeleteDialogProps {
  type: 'weekly' | 'monthly';
  onConfirm: () => void;
}

export const ReflectionDeleteDialog: React.FC<ReflectionDeleteDialogProps> = ({ type, onConfirm }) => {
  return (
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
          onClick={onConfirm}
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};
