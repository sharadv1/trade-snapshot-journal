
import React from 'react';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';

interface IdeaImagesFieldProps {
  images: string[];
  onImageUpload: (base64Image: string) => void;
  onImageRemove: (index: number) => void;
  isReadOnly: boolean;
}

export function IdeaImagesField({ 
  images, 
  onImageUpload, 
  onImageRemove, 
  isReadOnly 
}: IdeaImagesFieldProps) {
  return (
    <div className="space-y-2">
      <Label>Images</Label>
      <ImageUpload
        images={images}
        onImageUpload={onImageUpload}
        onImageRemove={onImageRemove}
        disabled={isReadOnly}
      />
    </div>
  );
}
