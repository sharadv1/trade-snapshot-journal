
import React, { useState } from 'react';
import { Trade } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';
import { Switch } from '@/components/ui/switch';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

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
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleChange('notes', e.target.value);
  };

  const handleTargetReachedChange = (checked: boolean) => {
    handleChange('targetReached', checked);
  };
  
  const handleImageClick = (index: number) => {
    if (images && images.length > 0) {
      setCurrentImageIndex(index);
      setViewingImage(images[index]);
    }
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-2">
          {images.map((url, index) => (
            <div 
              key={index} 
              className="relative w-full h-24 border rounded overflow-hidden cursor-pointer"
              onClick={() => handleImageClick(index)}
            >
              <img 
                src={url} 
                alt={`Image ${index + 1}`} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load in NotesAndImagesForm:', url);
                  const imgElement = e.currentTarget;
                  // Use a relative path for the placeholder to ensure it loads correctly
                  imgElement.src = '/placeholder.svg';
                  imgElement.style.opacity = '0.5';
                }}
              />
            </div>
          ))}
        </div>
        <ImageUpload
          images={images}
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
        />
      </div>
      
      {viewingImage && (
        <ImageViewerDialog 
          image={viewingImage}
          images={images}
          currentIndex={currentImageIndex}
          isOpen={!!viewingImage} 
          onClose={() => setViewingImage(null)}
          onIndexChange={setCurrentImageIndex}
        />
      )}
    </div>
  );
}
