
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

interface IdeaFormActionsProps {
  isReadOnly: boolean;
  hasInitialIdea: boolean;
  onCancel: () => void;
}

export function IdeaFormActions({ 
  isReadOnly, 
  hasInitialIdea, 
  onCancel 
}: IdeaFormActionsProps) {
  if (isReadOnly) {
    return (
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Close
        </Button>
      </DialogFooter>
    );
  }

  return (
    <DialogFooter>
      <Button variant="outline" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">
        {hasInitialIdea ? 'Update' : 'Add'} Idea
      </Button>
    </DialogFooter>
  );
}
