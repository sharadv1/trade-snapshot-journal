
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Play, Video } from 'lucide-react';
import { toast } from '@/utils/toast';
import { isVideo } from '@/utils/storage/imageOperations';

interface ImageUploadProps {
  images: string[];
  onImageUpload: (file: File) => void;
  onImageRemove: (index: number) => void;
  disabled?: boolean;
  maxImages?: number;
  acceptVideos?: boolean;
}

export function ImageUpload({
  images,
  onImageUpload,
  onImageRemove,
  disabled = false,
  maxImages = 5,
  acceptVideos = false
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} files allowed`);
      return;
    }

    const isVideoFile = file.type.startsWith('video/');
    
    // Check if video uploads are allowed
    if (isVideoFile && !acceptVideos) {
      toast.error("Video uploads are not allowed here");
      return;
    }
    
    // Check file size - different limits for images vs videos
    if (isVideoFile) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Video must be under 20MB");
        return;
      }
    } else {
      // For images
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }
    }

    onImageUpload(file);
    
    // Clear the input value so the same file can be uploaded again
    if (event.target.value) event.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} files allowed`);
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      const isVideoFile = file.type.startsWith('video/');
      
      // Check if video uploads are allowed
      if (isVideoFile && !acceptVideos) {
        toast.error("Video uploads are not allowed here");
        return;
      }
      
      // Check file size - different limits for images vs videos
      if (isVideoFile) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error("Video must be under 20MB");
          return;
        }
      } else {
        // For images
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image must be under 5MB");
          return;
        }
      }
      
      onImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative w-24 h-24 bg-gray-100 border rounded overflow-hidden">
              {isVideo(url) ? (
                <div className="flex items-center justify-center h-full">
                  <Video className="h-8 w-8 text-primary/60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white bg-black/30 p-1.5 rounded-full" />
                  </div>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
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
      )}

      {!disabled && (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
            } transition-colors cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drop {acceptVideos ? 'image or video' : 'image'} here or click to upload
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={acceptVideos ? "image/*,video/*" : "image/*"}
            ref={fileInputRef}
            disabled={disabled || images.length >= maxImages}
          />
        </>
      )}
    </div>
  );
}
