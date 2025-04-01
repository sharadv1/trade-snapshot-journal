
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { Trade } from '@/types';
import { RichTextEditor } from '@/components/journal/RichTextEditor';

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
        <RichTextEditor 
          id="notes" 
          content={trade.notes || ''} 
          onChange={(content) => handleChange('notes', content)}
          placeholder="Enter your observations, strategy details, or lessons learned... Use markdown: **bold**, # Heading, - bullet points, --- for dividers"
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
