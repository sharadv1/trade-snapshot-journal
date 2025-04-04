
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Limit text to maximum length
    const newValue = e.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
    onChange(newValue);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor="description">Description</Label>
        <span className={`text-xs ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {currentLength}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </div>
      <Textarea
        id="description"
        name="description"
        value={value || ''}
        onChange={handleChange}
        rows={3}
        disabled={isReadOnly}
        className={isAtLimit ? 'border-destructive' : ''}
        maxLength={MAX_DESCRIPTION_LENGTH}
      />
    </div>
  );
}
