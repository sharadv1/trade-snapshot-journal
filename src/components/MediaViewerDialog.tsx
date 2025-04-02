
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Maximize, ExternalLink, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface MediaFile {
  url: string;
  type: 'image' | 'video';
}

interface MediaViewerDialogProps {
  media: MediaFile[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function MediaViewerDialog({ 
  media, 
  currentIndex,
  isOpen, 
  onClose, 
  onIndexChange 
}: MediaViewerDialogProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const currentMedia = media[currentIndex] || { url: '', type: 'image' };
  
  const handleZoomIn = () => {
    if (currentMedia.type === 'image') {
      setZoomLevel(prev => Math.min(prev + 25, 200));
    }
  };
  
  const handleZoomOut = () => {
    if (currentMedia.type === 'image') {
      setZoomLevel(prev => Math.max(prev - 25, 50));
    }
  };
  
  const handleReset = () => {
    setZoomLevel(100);
  };
  
  const openInNewTab = () => {
    window.open(currentMedia.url, '_blank');
  };
  
  const handlePrevious = () => {
    if (media.length <= 1) return;
    const newIndex = (currentIndex - 1 + media.length) % media.length;
    onIndexChange(newIndex);
    setIsPlaying(false);
  };
  
  const handleNext = () => {
    if (media.length <= 1) return;
    const newIndex = (currentIndex + 1) % media.length;
    onIndexChange(newIndex);
    setIsPlaying(false);
  };

  const handleVideoPlayToggle = () => {
    setIsPlaying(!isPlaying);
    const videoElement = document.querySelector('.media-viewer-video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden" onPointerDownOutside={onClose}>
        <DialogTitle>
          <VisuallyHidden>Media Viewer</VisuallyHidden>
        </DialogTitle>
        <div className="relative h-full">
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            {currentMedia.type === 'image' && (
              <>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                  onClick={handleZoomIn}
                >
                  <ZoomIn size={16} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                  onClick={handleZoomOut}
                >
                  <ZoomOut size={16} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                  onClick={handleReset}
                >
                  <Maximize size={16} />
                </Button>
              </>
            )}
            {currentMedia.type === 'video' && (
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                onClick={handleVideoPlayToggle}
              >
                <Play size={16} />
              </Button>
            )}
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
              onClick={openInNewTab}
            >
              <ExternalLink size={16} />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </div>
          
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full opacity-70 hover:opacity-100"
                onClick={handlePrevious}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full opacity-70 hover:opacity-100"
                onClick={handleNext}
              >
                <ChevronRight size={20} />
              </Button>
            </>
          )}
          
          <div className="h-full flex items-center justify-center p-4">
            <div className="relative overflow-auto max-h-full max-w-full flex items-center justify-center">
              {currentMedia.type === 'image' ? (
                <img 
                  src={currentMedia.url} 
                  alt="Media" 
                  className="object-contain max-h-[calc(90vh-32px)]"
                  style={{ 
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center'
                  }}
                />
              ) : (
                <video 
                  src={currentMedia.url}
                  className="max-h-[calc(90vh-32px)] max-w-full media-viewer-video"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}
            </div>
          </div>
          
          {media.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-background/80 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {media.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
