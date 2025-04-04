
import React from 'react';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { toast } from '@/utils/toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    // Check file size before processing
    if (file.size > 1024 * 1024) { // 1MB limit for ideas
      toast.warning("Image is larger than 1MB. Compressing...");
    }
    
    // Convert File to base64 string with compression
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing/compressing
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions (max 800px width/height)
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }
        
        // Set canvas dimensions and draw resized image
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed base64 (0.7 quality JPEG)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          // Check final size
          const approximateSize = Math.round((compressedBase64.length * 0.75) / 1024);
          if (approximateSize > 500) {
            toast.warning(`Image is still large (${approximateSize}KB). This might cause storage issues.`);
          }
          
          onImageUpload(compressedBase64);
        }
      };
      img.src = reader.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>Images <span className="text-xs text-muted-foreground">(Max 2 images recommended)</span></Label>
      <ImageUpload
        images={images}
        onImageUpload={handleFileUpload}
        onImageRemove={onImageRemove}
        disabled={isReadOnly}
        maxImages={3} // Limit to 3 images per idea
      />
      {images.length >= 2 && (
        <Alert variant="destructive" className="bg-amber-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-amber-800">
            Adding multiple images may cause storage issues. Consider removing unnecessary images.
          </AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        Images are stored in the browser's local storage. For production use, we recommend configuring server storage.
      </p>
    </div>
  );
}
