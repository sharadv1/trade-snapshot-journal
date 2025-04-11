
import React from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';
import { Switch } from '@/components/ui/switch';

interface NotesAndImagesFormProps {
  trade: Trade;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove: (urlOrIndex: string | number) => void;
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

  const handleTargetReachedChange = (checked: boolean) => {
    handleChange('targetReached', checked);
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

      {trade.takeProfit && trade.status === 'closed' && (
        <div className="flex items-center space-x-2">
          <Switch 
            id="targetReached"
            checked={trade.targetReached || false}
            onCheckedChange={handleTargetReachedChange}
          />
          <Label htmlFor="targetReached" className="cursor-pointer">
            Target price was reached (even if exited early)
          </Label>
        </div>
      )}

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
