
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { toast } from '@/utils/toast';

interface ImageUploadProps {
  images: string[];
  onImageUpload: (file: File) => void;
  onImageRemove: (index: number) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function ImageUpload({ 
  images, 
  onImageUpload, 
  onImageRemove,
  disabled = false,
  maxImages = 10
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (images.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }
      
      setUploading(true);
      try {
        onImageUpload(file);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
        // Clear the input value so the same image can be selected again
        if (event.target.value) event.target.value = '';
      }
    }
  };

  // Improved drag event handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files[0];
      
      if (imageFile && imageFile.type.startsWith('image/')) {
        setUploading(true);
        try {
          onImageUpload(imageFile);
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Failed to upload image");
        } finally {
          setUploading(false);
        }
      }
    }
  }, [disabled, images.length, maxImages, onImageUpload]);

  const handleImageBtnClick = () => {
    fileInputRef.current?.click();
  };
  
  const reachedMaxImages = images.length >= maxImages;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
            <img 
              src={image}
              alt={`Uploaded ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                onClick={() => onImageRemove(index)}
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {!disabled && !reachedMaxImages && (
        <div
          ref={dropAreaRef}
          className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          } ${reachedMaxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={reachedMaxImages ? undefined : handleImageBtnClick}
          onDragEnter={reachedMaxImages ? undefined : handleDragEnter}
          onDragLeave={reachedMaxImages ? undefined : handleDragLeave}
          onDragOver={reachedMaxImages ? undefined : handleDragOver}
          onDrop={reachedMaxImages ? undefined : handleDrop}
        >
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Drop image here or click to upload'}
          </span>
        </div>
      )}
      
      {reachedMaxImages && !disabled && (
        <p className="text-xs text-amber-500 text-center">
          Maximum number of images reached. Remove an image to add another.
        </p>
      )}
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
        disabled={disabled || reachedMaxImages}
      />
    </div>
  );
}
