
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
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
}

export function MediaUpload({ 
  media, 
  onMediaUpload, 
  onMediaRemove,
  disabled = false 
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error('File size should be less than 100MB');
        return;
      }
      
      setUploading(true);
      onMediaUpload(file);
      setUploading(false);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const mediaFile = files[0];
      
      if (mediaFile && (mediaFile.type.startsWith('image/') || mediaFile.type.startsWith('video/'))) {
        if (mediaFile.size > 100 * 1024 * 1024) { // 100MB limit
          toast.error('File size should be less than 100MB');
          return;
        }
        
        setUploading(true);
        onMediaUpload(mediaFile);
        setUploading(false);
      } else {
        toast.error('Unsupported file type. Please upload an image or video.');
      }
    }
  }, [disabled, onMediaUpload]);

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
                <video className="max-h-full max-w-full">
                  <source src={item.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
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
            Supported: JPEG, PNG, GIF, MP4, WebM (max 100MB)
          </span>
        </div>
      )}
      
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
    </div>
  );
}
