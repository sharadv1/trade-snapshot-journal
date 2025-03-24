
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface IdeaDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}

export function IdeaDescriptionField({ value, onChange, isReadOnly }: IdeaDescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        disabled={isReadOnly}
      />
    </div>
  );
}
