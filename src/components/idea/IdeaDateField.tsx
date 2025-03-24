
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface IdeaDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}

export function IdeaDateField({ value, onChange, isReadOnly }: IdeaDateFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="date">Date</Label>
      <Input
        id="date"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={isReadOnly}
      />
    </div>
  );
}
