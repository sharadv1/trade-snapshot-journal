
import React from 'react';
import { LessonMedia as LessonMediaType } from '@/types';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MediaUpload } from '@/components/MediaUpload';
import { MediaViewerDialog } from '@/components/MediaViewerDialog';

// Add a custom type to handle pdf files
type ExtendedMediaFile = {
  url: string;
  type: 'image' | 'video' | 'pdf';
};

interface LessonMediaProps {
  media: LessonMediaType[];
  onUpload?: (files: File[]) => void;
  isEditing?: boolean;
}

export function LessonMedia({ media, onUpload, isEditing = false }: LessonMediaProps) {
  if (isEditing) {
    // Convert LessonMediaType[] to the MediaFile[] format expected by MediaUpload
    const mediaForUpload = media.map(m => ({
      url: m.url,
      type: m.type === 'pdf' ? 'image' : m.type // Convert pdf to image for MediaUpload to handle
    }));
    
    const handleMediaUpload = (file: File) => {
      if (onUpload) {
        onUpload([file]);
      }
    };
    
    const handleMediaRemove = (index: number) => {
      if (onUpload) {
        const newMedia = [...media];
        newMedia.splice(index, 1);
        // This will trigger a parent component re-render with updated media
        onUpload([]);
      }
    };
    
    return (
      <MediaUpload 
        media={mediaForUpload}
        onMediaUpload={handleMediaUpload}
        onMediaRemove={handleMediaRemove}
        onImageUpload={handleMediaUpload}
        onImageRemove={handleMediaRemove}
      />
    );
  }
  
  if (!media || media.length === 0) {
    return (
      <div className="w-full h-full min-h-[180px] flex items-center justify-center bg-muted rounded-md">
        <p className="text-gray-400">No media</p>
      </div>
    );
  }

  // For single media item display
  if (media.length === 1) {
    const mediaItem = media[0];
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    
    const handleOpenDialog = () => {
      setIsDialogOpen(true);
    };
    
    const handleCloseDialog = () => {
      setIsDialogOpen(false);
    };
    
    return (
      <div className="w-full">
        {mediaItem.type === 'image' ? (
          <>
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden cursor-pointer" onClick={handleOpenDialog}>
              <img
                src={mediaItem.url}
                alt={mediaItem.caption || 'Lesson image'}
                className="object-cover w-full h-full"
              />
              {mediaItem.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                  {mediaItem.caption}
                </div>
              )}
            </AspectRatio>
            
            <MediaViewerDialog 
              media={[{ url: mediaItem.url, type: mediaItem.type }]} 
              currentIndex={0}
              isOpen={isDialogOpen}
              onClose={handleCloseDialog}
              onIndexChange={setCurrentIndex}
            />
          </>
        ) : (
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            {mediaItem.url.startsWith('data:') ? (
              <video
                src={mediaItem.url}
                controls
                className="w-full h-full"
              />
            ) : (
              <iframe
                src={mediaItem.url}
                title={mediaItem.caption || 'Lesson video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
            {mediaItem.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                {mediaItem.caption}
              </div>
            )}
          </AspectRatio>
        )}
      </div>
    );
  }
  
  // For multiple media items, show a grid
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  const handleOpenDialog = (index: number) => {
    setCurrentIndex(index);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  // Convert LessonMediaType[] to the format expected by MediaViewerDialog
  // and handle potential pdf type by converting to image
  const mediaForViewer = media.map(m => ({
    url: m.url,
    type: (m.type === 'pdf' ? 'image' : m.type) as 'image' | 'video'
  }));
  
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {media.map((mediaItem, index) => (
          <div key={index} className="relative">
            {mediaItem.type === 'image' ? (
              <div 
                className="aspect-square bg-muted rounded-md overflow-hidden cursor-pointer"
                onClick={() => handleOpenDialog(index)}
              >
                <img
                  src={mediaItem.url}
                  alt={mediaItem.caption || `Media ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-square bg-muted rounded-md overflow-hidden">
                <video
                  src={mediaItem.url}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <MediaViewerDialog 
        media={mediaForViewer}
        currentIndex={currentIndex}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onIndexChange={setCurrentIndex}
      />
    </>
  );
}
