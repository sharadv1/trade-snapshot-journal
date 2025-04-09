
import React from 'react';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/journal/RichTextEditor';

// Maximum allowed characters in the description
const MAX_DESCRIPTION_LENGTH = 2000;

interface IdeaDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}

export function IdeaDescriptionField({ value, onChange, isReadOnly }: IdeaDescriptionFieldProps) {
  const currentLength = value?.length || 0;
  const isNearLimit = currentLength > MAX_DESCRIPTION_LENGTH * 0.8;
  const isAtLimit = currentLength >= MAX_DESCRIPTION_LENGTH;
  
  const handleChange = (newValue: string) => {
    // Limit text to maximum length (approximately, since HTML tags are included in the count)
    if (newValue.length <= MAX_DESCRIPTION_LENGTH) {
      onChange(newValue);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor="description">Description</Label>
        <span className={`text-xs ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {currentLength}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </div>
      <div className={isAtLimit ? 'border border-destructive rounded-md' : ''}>
        <RichTextEditor
          id="description"
          content={value || ''}
          onChange={handleChange}
          placeholder="Enter idea description..."
          readonly={isReadOnly}
          className="min-h-[120px]"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Supports Markdown: **bold**, *italic*, lists, and more
      </p>
    </div>
  );
}
