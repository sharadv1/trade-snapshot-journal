
import { Trade } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MediaUpload } from '@/components/MediaUpload';
import { MistakesField } from './MistakesField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Trade Grade</Label>
            <Select
              value={trade.grade || ''}
              onValueChange={(value) => handleChange('grade', value)}
            >
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select a grade for this trade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A - Excellent</SelectItem>
                <SelectItem value="B">B - Good</SelectItem>
                <SelectItem value="C">C - Average</SelectItem>
                <SelectItem value="D">D - Poor</SelectItem>
                <SelectItem value="F">F - Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <MistakesField 
            value={trade.mistakes || []} 
            onChange={(mistakes) => handleChange('mistakes', mistakes)}
          />
        </div>
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
