
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { toast } from '@/utils/toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { isVideo } from '@/utils/storage/imageOperations';

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // This function acts as a bridge between File input and base64 output
  const handleFileUpload = (file: File) => {
    const isVideoFile = file.type.startsWith('video/');
    
    // Handle videos differently
    if (isVideoFile) {
      // Check video size - strict limit for ideas
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for idea videos
        toast.error("Videos for trade ideas must be under 10MB");
        return;
      }
      
      // Convert video to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
      return;
    }
    
    // For images, continue with the existing logic
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
  
  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-2">
      <Label>Media Files <span className="text-xs text-muted-foreground">(Max 2 files recommended)</span></Label>
      
      {images.length > 0 && !isReadOnly && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url, index) => (
            <div 
              key={index} 
              className="relative w-24 h-24 border rounded overflow-hidden cursor-pointer"
              onClick={() => openImageViewer(index)}
            >
              {isVideo(url) ? (
                <div className="w-full h-full flex items-center justify-center bg-black/5">
                  <span className="bg-black/40 p-2 rounded-full">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </span>
                </div>
              ) : (
                <img 
                  src={url} 
                  alt={`Image ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
      
      <ImageUpload
        images={images}
        onImageUpload={handleFileUpload}
        onImageRemove={onImageRemove}
        disabled={isReadOnly}
        maxImages={3} // Limit to 3 media files per idea
        acceptVideos={true}
      />
      
      {images.length >= 2 && (
        <Alert variant="destructive" className="bg-amber-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-amber-800">
            Adding multiple media files may cause storage issues. Consider removing unnecessary ones.
          </AlertDescription>
        </Alert>
      )}
      
      <p className="text-xs text-muted-foreground mt-1">
        Media files are stored in the browser's local storage. For production use, we recommend configuring server storage.
      </p>
      
      {/* Fix: Provide the required 'image' prop, using the current image from the images array */}
      <ImageViewerDialog 
        images={images}
        image={images[currentImageIndex] || ''}
        currentIndex={currentImageIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setCurrentImageIndex}
      />
    </div>
  );
}
