
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
  // This function acts as a bridge between File input and base64 output
  const handleFileUpload = (file: File) => {
    // Convert File to base64 string
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onImageUpload(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>Images</Label>
      <ImageUpload
        images={images}
        onImageUpload={handleFileUpload}
        onImageRemove={onImageRemove}
        disabled={isReadOnly}
      />
    </div>
  );
}
