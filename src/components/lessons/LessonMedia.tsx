
import React from 'react';
import { LessonMedia as LessonMediaType } from '@/types';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface LessonMediaProps {
  media: LessonMediaType[];
}

export function LessonMedia({ media }: LessonMediaProps) {
  if (!media || media.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-400">No media</p>
      </div>
    );
  }

  // For now, just display the first media item
  const mediaItem = media[0];

  return (
    <div className="w-full">
      {mediaItem.type === 'image' ? (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <img
            src={mediaItem.url}
            alt={mediaItem.caption || 'Lesson image'}
            className="rounded-md object-cover w-full h-full"
          />
          {mediaItem.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
              {mediaItem.caption}
            </div>
          )}
        </AspectRatio>
      ) : (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <iframe
            src={mediaItem.url}
            title={mediaItem.caption || 'Lesson video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-md w-full h-full"
          />
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
