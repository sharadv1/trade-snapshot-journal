
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface ReflectionActionsProps {
  canDelete: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onEdit: () => void;
  reflectionId: string;
}

export const ReflectionActions = ({ 
  canDelete, 
  onDelete, 
  onEdit,
  reflectionId 
}: ReflectionActionsProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    if (onDelete) {
      e.preventDefault();
      e.stopPropagation();
      onDelete(reflectionId, e);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onEdit}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      
      {canDelete && onDelete && (
        <Button 
          variant="outline" 
          size="sm"
          className="text-red-500 border-red-200 hover:bg-red-50 gap-2"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  );
};
