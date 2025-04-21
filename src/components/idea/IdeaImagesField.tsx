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
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  
  const handleFileUpload = (file: File) => {
    if (isProcessingUpload) {
      console.log('Upload already in progress, ignoring duplicate request');
      return;
    }
    
    setIsProcessingUpload(true);
    
    const isVideoFile = file.type.startsWith('video/');
    
    if (isVideoFile) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Videos for trade ideas must be under 10MB");
        setIsProcessingUpload(false);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onImageUpload(reader.result);
        }
        setIsProcessingUpload(false);
      };
      reader.onerror = () => {
        setIsProcessingUpload(false);
      };
      reader.readAsDataURL(file);
      return;
    }
    
    if (file.size > 1024 * 1024) {
      toast.warning("Image is larger than 1MB. Compressing...");
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
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
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          const approximateSize = Math.round((compressedBase64.length * 0.75) / 1024);
          if (approximateSize > 500) {
            toast.warning(`Image is still large (${approximateSize}KB). This might cause storage issues.`);
          }
          
          onImageUpload(compressedBase64);
        }
        setIsProcessingUpload(false);
      };
      img.onerror = () => {
        setIsProcessingUpload(false);
      };
      img.src = reader.result as string;
    };
    
    reader.onerror = () => {
      setIsProcessingUpload(false);
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
                  onError={(e) => {
                    console.error('Image failed to load in IdeaImagesField:', url);
                    const imgElement = e.currentTarget;
                    imgElement.src = '/placeholder.svg';
                    imgElement.style.opacity = '0.5';
                  }}
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
        disabled={isReadOnly || isProcessingUpload}
        maxImages={3}
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
