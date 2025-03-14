
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';
import { Trade } from '@/types';

interface NotesAndImagesFormProps {
  trade: Partial<Trade>;
  handleChange: (field: keyof Trade, value: any) => void;
  images: string[];
  onImageUpload: (base64Image: string) => void;
  onImageRemove: (index: number) => void;
}

export function NotesAndImagesForm({ 
  trade, 
  handleChange, 
  images, 
  onImageUpload, 
  onImageRemove 
}: NotesAndImagesFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notes">Trade Notes</Label>
        <Textarea 
          id="notes" 
          value={trade.notes || ''} 
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Enter your observations, strategy details, or lessons learned..."
          className="min-h-32"
        />
      </div>
      
      <div className="space-y-3">
        <Label>Trade Images</Label>
        <ImageUpload 
          images={images} 
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
        />
      </div>
    </div>
  );
}
