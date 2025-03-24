
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImageUpload: (base64Image: string) => void;
  onImageRemove: (index: number) => void;
  disabled?: boolean;
}

export function ImageUpload({ 
  images, 
  onImageUpload, 
  onImageRemove,
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = useCallback((file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onImageUpload(base64String);
      setUploading(false);
    };
    reader.onerror = () => {
      console.error("Error reading file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      const imageFile = files[0];
      if (imageFile.type.startsWith('image/')) {
        processImageFile(imageFile);
      }
    }
  }, [disabled, processImageFile]);

  const handleImageBtnClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="space-y-2">
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
        
        {!disabled && (
          <div
            ref={dropAreaRef}
            className={`w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
            onClick={handleImageBtnClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {uploading ? 'Uploading...' : 'Drop image here'}
            </span>
          </div>
        )}
      </div>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
      />
    </div>
  );
}
