
import { useState } from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { ImageUpload } from '@/components/ImageUpload';
import { MistakesField } from './MistakesField';

interface NotesAndImagesFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (file: File) => void;
  onImageRemove: (index: number) => void;
}

export function NotesAndImagesForm({
  trade,
  handleChange,
  images,
  onImageUpload,
  onImageRemove
}: NotesAndImagesFormProps) {
  const [notes, setNotes] = useState(trade.notes || '');

  const handleNotesChange = (value: string) => {
    setNotes(value);
    handleChange('notes', value);
  };
  
  const handleMistakesChange = (mistakes: string[]) => {
    handleChange('mistakes', mistakes);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <div className="min-h-[200px]">
          <RichTextEditor
            content={notes}
            onChange={handleNotesChange}
            placeholder="Add your trade notes here..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mistakes">Mistakes Made</Label>
        <MistakesField 
          value={trade.mistakes} 
          onChange={handleMistakesChange} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="images">Images</Label>
        <ImageUpload
          images={images}
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
        />
      </div>
    </div>
  );
}
