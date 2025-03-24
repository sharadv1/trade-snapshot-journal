
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IdeaStatusFieldProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}

export function IdeaStatusField({ value, onChange, isReadOnly }: IdeaStatusFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="status">Status</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={isReadOnly}
      >
        <SelectTrigger id="status">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="still valid">Still Valid</SelectItem>
          <SelectItem value="invalidated">Invalidated</SelectItem>
          <SelectItem value="taken">Taken</SelectItem>
          <SelectItem value="missed">Missed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
