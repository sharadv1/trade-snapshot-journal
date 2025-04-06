
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Maximize, ExternalLink, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface ImageViewerDialogProps {
  image: string;
  images?: string[];
  currentIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function ImageViewerDialog({ 
  image, 
  images = [], 
  currentIndex = 0, 
  isOpen, 
  onClose, 
  onIndexChange 
}: ImageViewerDialogProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Use the array if provided, otherwise create a single-image array
  const imageArray = images.length > 0 ? images : [image];
  const displayedImage = images.length > 0 ? images[currentIndex] : image;
  
  // Detect if current media is a video
  const isVideo = (url: string) => {
    return url.includes('video') || 
           url.startsWith('data:video') || 
           url.endsWith('.mp4') || 
           url.endsWith('.webm') || 
           url.endsWith('.mov');
  };
  
  const currentIsVideo = isVideo(displayedImage);
  
  // Manage video playback state
  useEffect(() => {
    if (isOpen && currentIsVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => console.error('Failed to play video:', err));
      } else {
        videoRef.current.pause();
      }
      
      videoRef.current.muted = isMuted;
    }
  }, [isPlaying, isMuted, isOpen, currentIsVideo]);
  
  // Reset video state when changing media
  useEffect(() => {
    setIsPlaying(false);
  }, [currentIndex]);
  
  const handleZoomIn = () => {
    if (!currentIsVideo) {
      setZoomLevel(prev => Math.min(prev + 25, 200));
    }
  };
  
  const handleZoomOut = () => {
    if (!currentIsVideo) {
      setZoomLevel(prev => Math.max(prev - 25, 50));
    }
  };
  
  const handleReset = () => {
    setZoomLevel(100);
  };
  
  const openInNewTab = () => {
    window.open(displayedImage, '_blank');
  };
  
  const handlePrevious = () => {
    if (imageArray.length <= 1) return;
    const newIndex = (currentIndex - 1 + imageArray.length) % imageArray.length;
    if (onIndexChange) {
      onIndexChange(newIndex);
    }
  };
  
  const handleNext = () => {
    if (imageArray.length <= 1) return;
    const newIndex = (currentIndex + 1) % imageArray.length;
    if (onIndexChange) {
      onIndexChange(newIndex);
    }
  };
  
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden" onPointerDownOutside={onClose} aria-describedby="media-viewer-description">
        <DialogTitle>
          <VisuallyHidden>Media Viewer</VisuallyHidden>
        </DialogTitle>
        <DialogDescription id="media-viewer-description">
          <VisuallyHidden>
            View and interact with uploaded images and videos
          </VisuallyHidden>
        </DialogDescription>
        <div className="relative h-full">
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            {!currentIsVideo && (
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
            {currentIsVideo && (
              <>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
              </>
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
          
          {imageArray.length > 1 && (
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
              {!currentIsVideo ? (
                <img 
                  src={displayedImage} 
                  alt="Media" 
                  className="object-contain max-h-[calc(90vh-32px)]"
                  style={{ 
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center'
                  }}
                />
              ) : (
                <video 
                  ref={videoRef}
                  src={displayedImage}
                  className="max-h-[calc(90vh-32px)] max-w-full"
                  controls={false}
                  loop
                  playsInline
                  onClick={togglePlayPause}
                />
              )}
            </div>
          </div>
          
          {imageArray.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-background/80 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {imageArray.length}
                </span>
              </div>
            </div>
          )}
          
          {currentIsVideo && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-background/80 px-5 py-2 rounded-full flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full opacity-90 hover:opacity-100"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full opacity-90 hover:opacity-100"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
