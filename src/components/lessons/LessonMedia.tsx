
import React from 'react';
import { LessonMedia as LessonMediaType } from '@/types';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MediaUpload } from '@/components/MediaUpload';
import { MediaViewerDialog } from '@/components/MediaViewerDialog';

interface LessonMediaProps {
  media: LessonMediaType[];
  onUpload?: (files: File[]) => void;
  isEditing?: boolean;
}

export function LessonMedia({ media, onUpload, isEditing = false }: LessonMediaProps) {
  if (isEditing) {
    return (
      <MediaUpload 
        onUpload={onUpload || (() => {})}
        existingMedia={media.map(m => m.url)}
        maxFiles={5}
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
    return (
      <div className="w-full">
        {mediaItem.type === 'image' ? (
          <MediaViewerDialog 
            media={mediaItem.url} 
            caption={mediaItem.caption} 
            trigger={
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden cursor-pointer">
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
            }
          />
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
  return (
    <div className="grid grid-cols-2 gap-2">
      {media.map((mediaItem, index) => (
        <div key={index} className="relative">
          {mediaItem.type === 'image' ? (
            <MediaViewerDialog 
              media={mediaItem.url} 
              caption={mediaItem.caption} 
              trigger={
                <div className="aspect-square bg-muted rounded-md overflow-hidden cursor-pointer">
                  <img
                    src={mediaItem.url}
                    alt={mediaItem.caption || `Media ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              }
            />
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
  );
}
