
import { Trade } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MediaUpload } from '@/components/MediaUpload';

interface NotesAndImagesFormProps {
  trade: Trade;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (files: FileList | File) => void;
  onImageRemove: (url: string) => void;
}

export function NotesAndImagesForm({
  trade,
  handleChange,
  images,
  onImageUpload,
  onImageRemove
}: NotesAndImagesFormProps) {
  // Detect if an item is a video (basic check, could be enhanced)
  const isVideo = (url: string) => {
    return url.includes('video') || 
           url.startsWith('data:video') || 
           url.endsWith('.mp4') || 
           url.endsWith('.webm') || 
           url.endsWith('.mov');
  };
  
  // Transform string URLs to MediaFile objects
  const mediaFiles = images.map(url => ({
    url,
    type: isVideo(url) ? 'video' : 'image' as 'video' | 'image'
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
        <Label>Media Files</Label>
        <MediaUpload 
          media={mediaFiles}
          onMediaUpload={(file) => onImageUpload(file)}
          onMediaRemove={(index) => onImageRemove(images[index])}
          disabled={false}
          maxFiles={5}
        />
        <p className="text-xs text-muted-foreground">
          Upload images or videos to document your trade setup, execution, and results.
        </p>
      </div>
    </div>
  );
}
