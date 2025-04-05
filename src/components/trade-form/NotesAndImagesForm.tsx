
import { Trade } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MediaUpload } from '@/components/MediaUpload';

interface NotesAndImagesFormProps {
  trade: Trade;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (files: FileList) => void;
  onImageRemove: (url: string) => void;
}

export function NotesAndImagesForm({
  trade,
  handleChange,
  images,
  onImageUpload,
  onImageRemove
}: NotesAndImagesFormProps) {
  // Transform string URLs to MediaFile objects with explicit type casting
  const mediaFiles = images.map(url => ({
    url,
    type: url.includes('video') ? 'video' : 'image' as 'video' | 'image' // Use type assertion
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notes">Trade Notes</Label>
        <Textarea
          id="notes"
          value={trade.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Enter your notes about this trade"
          className="min-h-[150px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Images</Label>
        <MediaUpload 
          media={mediaFiles}
          onMediaUpload={(file) => onImageUpload(new DataTransfer().files)}
          onMediaRemove={(index) => onImageRemove(images[index])}
          disabled={false}
        />
      </div>
    </div>
  );
}
