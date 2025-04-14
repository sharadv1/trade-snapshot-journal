import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Play, Video, FileText } from 'lucide-react';
import { toast } from '@/utils/toast';
import { isVideo, ensureSafeUrl } from '@/utils/storage/imageOperations';
import { MediaFile } from '@/types';

interface MediaUploadProps {
  media?: MediaFile[];
  images?: string[];
  onImageUpload: (file: File) => void;
  onImageRemove: (index: number) => void;
  onMediaUpload?: (file: File) => void;
  onMediaRemove?: (index: number) => void;
  disabled?: boolean;
  maxImages?: number;
  maxFiles?: number;
  acceptVideos?: boolean;
  acceptPdfs?: boolean;
}

export function MediaUpload({
  media,
  images,
  onImageUpload,
  onImageRemove,
  onMediaUpload,
  onMediaRemove,
  disabled = false,
  maxImages = 5,
  maxFiles = 5,
  acceptVideos = false,
  acceptPdfs = false
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track last file uploaded to prevent duplicates
  const [lastUploadedFile, setLastUploadedFile] = useState<{ name: string, time: number } | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Backwards compatibility - support both media and images props
  const mediaItems: MediaFile[] = media || 
    (images ? images.map(url => ({
      url: ensureSafeUrl(url),
      type: isVideo(url) ? 'video' : 'image'
    })) : []);
  
  const maxItemsCount = maxFiles || maxImages;
  
  // Backwards compatibility - use either the media or image handlers
  const handleFileUpload = onMediaUpload || onImageUpload;
  const handleRemove = onMediaRemove || onImageRemove;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Prevent duplicate uploads and processing multiple uploads simultaneously
    if (isProcessingUpload) {
      console.log('Already processing an upload, ignoring duplicate request');
      return;
    }

    if (lastUploadedFile && 
        lastUploadedFile.name === file.name && 
        (Date.now() - lastUploadedFile.time) < 2000) {
      console.log('Prevented duplicate file upload (same file within 2 seconds):', file.name);
      return;
    }

    if (mediaItems.length >= maxItemsCount) {
      toast.error(`Maximum ${maxItemsCount} files allowed`);
      return;
    }

    const isVideoFile = file.type.startsWith('video/');
    const isPdfFile = file.type === 'application/pdf';
    
    // Check if file type is allowed
    if (isVideoFile && !acceptVideos) {
      toast.error("Video uploads are not allowed here");
      return;
    }
    
    if (isPdfFile && !acceptPdfs) {
      toast.error("PDF uploads are not allowed here");
      return;
    }
    
    // Check file size - different limits for different file types
    if (isVideoFile) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Video must be under 20MB");
        return;
      }
    } else if (isPdfFile) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("PDF must be under 10MB");
        return;
      }
    } else {
      // For images
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }
    }

    // Set processing state to prevent multiple simultaneous uploads
    setIsProcessingUpload(true);
    
    // Record this upload to prevent duplicates
    setLastUploadedFile({ name: file.name, time: Date.now() });
    
    // Process the file
    handleFileUpload(file);
    
    // Clear the input value so the same file can be uploaded again (but not immediately)
    if (event.target.value) event.target.value = '';
    
    // Reset processing state after a delay
    setTimeout(() => {
      setIsProcessingUpload(false);
    }, 1000);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || isProcessingUpload) return;
    
    if (mediaItems.length >= maxItemsCount) {
      toast.error(`Maximum ${maxItemsCount} files allowed`);
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      console.log('File dropped in MediaUpload:', file.name, file.type);
      
      // Prevent duplicate uploads (same file within 2 seconds)
      if (lastUploadedFile && 
          lastUploadedFile.name === file.name && 
          (Date.now() - lastUploadedFile.time) < 2000) {
        console.log('Prevented duplicate file drag-and-drop:', file.name);
        return;
      }
      
      const isVideoFile = file.type.startsWith('video/');
      const isPdfFile = file.type === 'application/pdf';
      
      // Check file type
      if (isVideoFile && !acceptVideos) {
        toast.error("Video uploads are not allowed here");
        return;
      }
      
      if (isPdfFile && !acceptPdfs) {
        toast.error("PDF uploads are not allowed here");
        return;
      }
      
      // Process the file
      setIsProcessingUpload(true);
      setLastUploadedFile({ name: file.name, time: Date.now() });
      handleFileUpload(file);
      console.log('File dropped and being processed:', file.name);
      
      // Reset processing state after a delay
      setTimeout(() => {
        setIsProcessingUpload(false);
      }, 1000);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessingUpload) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const isPdfUrl = (url: string): boolean => {
    return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
  };

  return (
    <div className="space-y-4">
      {mediaItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaItems.map((item, index) => {
            const url = ensureSafeUrl(item.url);
            const isVideoItem = item.type === 'video' || isVideo(url);
            const isPdfItem = item.type === 'pdf' || isPdfUrl(url);
            
            return (
              <div key={index} className="relative w-24 h-24 bg-gray-100 border rounded overflow-hidden">
                {isVideoItem ? (
                  <div className="flex items-center justify-center h-full">
                    <Video className="h-8 w-8 text-primary/60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white bg-black/30 p-1.5 rounded-full" />
                    </div>
                  </div>
                ) : isPdfItem ? (
                  <div className="flex items-center justify-center h-full">
                    <FileText className="h-8 w-8 text-primary/60" />
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.warn(`Image failed to load: ${url}`);
                      // Set a fallback image on error
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                )}
                {!disabled && (
                  <Button
                    type="button"
                    onClick={() => handleRemove(index)}
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!disabled && (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
            } transition-colors cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled && !isProcessingUpload) {
                setIsDragging(true);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              
              if (disabled || isProcessingUpload) return;
              
              if (mediaItems.length >= maxItemsCount) {
                toast.error(`Maximum ${maxItemsCount} files allowed`);
                return;
              }
              
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                
                // Prevent duplicate uploads (same file within 2 seconds)
                if (lastUploadedFile && 
                    lastUploadedFile.name === file.name && 
                    (Date.now() - lastUploadedFile.time) < 2000) {
                  return;
                }
                
                const isVideoFile = file.type.startsWith('video/');
                const isPdfFile = file.type === 'application/pdf';
                
                // Check file type
                if (isVideoFile && !acceptVideos) {
                  toast.error("Video uploads are not allowed here");
                  return;
                }
                
                if (isPdfFile && !acceptPdfs) {
                  toast.error("PDF uploads are not allowed here");
                  return;
                }
                
                // Process the file
                setIsProcessingUpload(true);
                setLastUploadedFile({ name: file.name, time: Date.now() });
                handleFileUpload(file);
                
                // Reset processing state after a delay
                setTimeout(() => {
                  setIsProcessingUpload(false);
                }, 1000);
              }
            }}
          >
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drop {acceptVideos || acceptPdfs ? 'file' : 'image'} here or click to upload
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={
              acceptVideos && acceptPdfs 
                ? "image/*,video/*,application/pdf" 
                : acceptVideos 
                  ? "image/*,video/*" 
                  : acceptPdfs 
                    ? "image/*,application/pdf" 
                    : "image/*"
            }
            ref={fileInputRef}
            disabled={disabled || isProcessingUpload || mediaItems.length >= maxItemsCount}
          />
        </>
      )}
    </div>
  );
}

// For backwards compatibility
export function ImageUpload(props: MediaUploadProps) {
  return <MediaUpload {...props} />;
}
