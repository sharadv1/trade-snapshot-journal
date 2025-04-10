
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatInTimeZone } from 'date-fns-tz';

interface IdeaDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}

export function IdeaDateField({ value, onChange, isReadOnly }: IdeaDateFieldProps) {
  // Initialize with current date/time in Central Time if no value provided
  const handleFocus = () => {
    if (!value) {
      const now = new Date();
      const centralTimeValue = formatInTimeZone(now, 'America/Chicago', "yyyy-MM-dd'T'HH:mm");
      onChange(centralTimeValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="date">Date</Label>
      <Input
        id="date"
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        required
        disabled={isReadOnly}
      />
    </div>
  );
}
