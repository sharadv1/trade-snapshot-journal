
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Play, Video } from 'lucide-react';
import { toast } from '@/utils/toast';

interface MediaFile {
  url: string;
  type: 'image' | 'video';
}

interface MediaUploadProps {
  media: MediaFile[];
  onMediaUpload: (file: File) => void;
  onMediaRemove: (index: number) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function MediaUpload({
  media,
  onMediaUpload,
  onMediaRemove,
  disabled = false,
  maxFiles = 5
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (media.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const isVideoFile = file.type.startsWith('video/');
    
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

    onMediaUpload(file);
    
    // Clear the input value so the same file can be uploaded again
    if (event.target.value) event.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (media.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      const isVideoFile = file.type.startsWith('video/');
      
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
      
      onMediaUpload(file);
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
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((file, index) => (
            <div key={index} className="relative w-24 h-24 bg-gray-100 border rounded overflow-hidden">
              {file.type === 'video' ? (
                <div className="flex items-center justify-center h-full">
                  <Video className="h-8 w-8 text-primary/60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white bg-black/30 p-1.5 rounded-full" />
                  </div>
                </div>
              ) : (
                <img
                  src={file.url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              {!disabled && (
                <Button
                  type="button"
                  onClick={() => onMediaRemove(index)}
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
              Drop image or video here or click to upload
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*"
            ref={fileInputRef}
            disabled={disabled || media.length >= maxFiles}
          />
        </>
      )}
    </div>
  );
}
