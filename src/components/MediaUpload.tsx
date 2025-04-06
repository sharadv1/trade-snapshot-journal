
import React, { useState, useRef, useCallback } from 'react';
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
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (media.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }
      
      // Check if file is video and warn about size
      if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) {
        toast.warning('Video is larger than 50MB. This may cause performance issues.');
      }
      
      setUploading(true);
      try {
        await onMediaUpload(file);
        toast.success(`${file.type.startsWith('video/') ? 'Video' : 'Image'} uploaded successfully`);
      } catch (error) {
        console.error('Error uploading:', error);
        toast.error('Failed to upload file');
      } finally {
        setUploading(false);
        // Clear the input value so the same file can be uploaded again
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

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (media.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const mediaFile = files[0];
      
      if (mediaFile && (mediaFile.type.startsWith('image/') || mediaFile.type.startsWith('video/'))) {
        // Check if file is video and warn about size
        if (mediaFile.type.startsWith('video/') && mediaFile.size > 50 * 1024 * 1024) {
          toast.warning('Video is larger than 50MB. This may cause performance issues.');
        }
        
        setUploading(true);
        try {
          await onMediaUpload(mediaFile);
          toast.success(`${mediaFile.type.startsWith('video/') ? 'Video' : 'Image'} uploaded successfully`);
        } catch (error) {
          console.error('Error uploading:', error);
          toast.error('Failed to upload file');
        } finally {
          setUploading(false);
        }
      } else {
        toast.error('Unsupported file type. Please upload an image or video.');
      }
    }
  }, [disabled, media.length, maxFiles, onMediaUpload]);

  const handleUploadBtnClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {media.map((item, index) => (
          <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
            {item.type === 'image' ? (
              <img 
                src={item.url}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full bg-black/5 flex items-center justify-center">
                {item.url.startsWith('data:') ? (
                  <video 
                    className="max-h-full max-w-full" 
                    muted
                    loop
                    preload="metadata"
                  >
                    <source src={item.url} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <Video className="h-8 w-8 text-primary/60" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
                    <Play className="h-4 w-4 text-white" />
                  </span>
                </div>
              </div>
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
      
      {!disabled && (
        <div
          ref={dropAreaRef}
          className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
          onClick={handleUploadBtnClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Drop image or video here or click to upload'}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Supported: JPEG, PNG, GIF, MP4, WebM (max 200MB)
          </span>
        </div>
      )}
      
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        disabled={disabled || media.length >= maxFiles}
      />
    </div>
  );
}
