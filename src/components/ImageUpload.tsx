
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Play, Video } from 'lucide-react';
import { toast } from '@/utils/toast';

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
  maxImages = 10,
  acceptVideos = true
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (images.length >= maxImages) {
        toast.error(`Maximum ${maxImages} media files allowed`);
        return;
      }
      
      // Check if it's a video file
      const isVideo = file.type.startsWith('video/');
      
      // If videos aren't accepted and this is a video, show error
      if (isVideo && !acceptVideos) {
        toast.error("Videos are not allowed for this upload");
        return;
      }
      
      // Check file size
      const sizeLimit = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for images
      if (file.size > sizeLimit) {
        const fileType = isVideo ? 'Video' : 'Image';
        const sizeMB = Math.round(sizeLimit / (1024 * 1024));
        toast.warning(`${fileType} is larger than ${sizeMB}MB. This may cause storage issues.`);
      }
      
      setUploading(true);
      try {
        onImageUpload(file);
        toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading media:", error);
        toast.error(`Failed to upload ${isVideo ? 'video' : 'image'}`);
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
      toast.error(`Maximum ${maxImages} media files allowed`);
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const mediaFile = files[0];
      
      const isVideo = mediaFile.type.startsWith('video/');
      const isImage = mediaFile.type.startsWith('image/');
      
      // Determine if file type is accepted
      if ((isImage) || (isVideo && acceptVideos)) {
        // Check file size
        const sizeLimit = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for images
        if (mediaFile.size > sizeLimit) {
          const fileType = isVideo ? 'Video' : 'Image';
          const sizeMB = Math.round(sizeLimit / (1024 * 1024));
          toast.warning(`${fileType} is larger than ${sizeMB}MB. This may cause storage issues.`);
        }
        
        setUploading(true);
        try {
          onImageUpload(mediaFile);
          toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
        } catch (error) {
          console.error("Error uploading media:", error);
          toast.error(`Failed to upload ${isVideo ? 'video' : 'image'}`);
        } finally {
          setUploading(false);
        }
      } else {
        toast.error(`Unsupported file type. Please upload ${acceptVideos ? 'an image or video' : 'an image'}.`);
      }
    }
  }, [disabled, images.length, maxImages, onImageUpload, acceptVideos]);

  const handleImageBtnClick = () => {
    fileInputRef.current?.click();
  };
  
  const reachedMaxImages = images.length >= maxImages;
  
  // Detect if an item is a video (basic check, could be enhanced)
  const isVideo = (url: string) => {
    return url.includes('video') || 
           url.startsWith('data:video') || 
           url.endsWith('.mp4') || 
           url.endsWith('.webm') || 
           url.endsWith('.mov');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {images.map((url, index) => (
          <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
            {isVideo(url) ? (
              <div className="w-full h-full relative bg-black/5 flex items-center justify-center">
                {url.startsWith('data:') ? (
                  <video 
                    className="max-h-full max-w-full" 
                    muted
                    controls={false}
                  >
                    <source src={url} />
                  </video>
                ) : (
                  <Video className="h-8 w-8 text-primary/60" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
                    <Play className="h-4 w-4 text-white" />
                  </span>
                </div>
              </div>
            ) : (
              <img 
                src={url}
                alt={`Media ${index + 1}`}
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
            {uploading ? 'Uploading...' : `Drop ${acceptVideos ? 'image or video' : 'image'} here or click to upload`}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Supported: {acceptVideos ? 'Images (JPEG, PNG, GIF) and Videos (MP4, WebM)' : 'Images (JPEG, PNG, GIF)'}
          </span>
        </div>
      )}
      
      {reachedMaxImages && !disabled && (
        <p className="text-xs text-amber-500 text-center">
          Maximum number of files reached. Remove an item to add another.
        </p>
      )}
      
      <input
        type="file"
        accept={acceptVideos ? "image/*,video/*" : "image/*"}
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden"
        disabled={disabled || reachedMaxImages}
      />
    </div>
  );
}
