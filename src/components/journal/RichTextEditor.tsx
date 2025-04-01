
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  id?: string;
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ id, content, onChange, placeholder }: RichTextEditorProps) {
  return (
    <Textarea
      id={id}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Start typing...'}
      className="min-h-[200px] resize-none"
    />
  );
}
