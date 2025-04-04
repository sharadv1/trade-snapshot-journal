
import React from 'react';
import { Button } from '@/components/ui/button';

interface IdeaFormActionsProps {
  isReadOnly: boolean;
  hasInitialIdea: boolean;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function IdeaFormActions({ 
  isReadOnly, 
  hasInitialIdea, 
  onCancel,
  isSubmitting = false
}: IdeaFormActionsProps) {
  return (
    <div className="flex justify-between">
      <Button 
        type="button"
        variant="ghost" 
        onClick={onCancel}
      >
        {isReadOnly ? "Close" : "Cancel"}
      </Button>
      {!isReadOnly && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : hasInitialIdea ? "Update" : "Create"}
        </Button>
      )}
    </div>
  );
}
