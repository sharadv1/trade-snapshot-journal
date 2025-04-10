
import React, { useRef } from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';

interface NotesAndImagesFormProps {
  trade: Trade;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove: (url: string) => void;
}

export function NotesAndImagesForm({
  trade,
  handleChange,
  images,
  onImageUpload,
  onImageRemove,
}: NotesAndImagesFormProps) {
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleChange('notes', e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={trade.notes || ''}
          onChange={handleNotesChange}
          placeholder="Add notes about this trade..."
          className="min-h-32 resize-y w-full whitespace-pre-wrap overflow-wrap-break-word"
          style={{ maxWidth: '100%', wordBreak: 'break-word' }}
        />
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <ImageUpload
          images={images}
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
        />
      </div>
    </div>
  );
}
