
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Maximize, ExternalLink, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { isVideo } from '@/utils/storage/imageOperations';

interface MediaViewerDialogProps {
  media?: MediaFile[];
  images?: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  image?: string;
}

interface MediaFile {
  url: string;
  type: 'image' | 'video';
}

export function MediaViewerDialog({ 
  media, 
  images,
  image,
  currentIndex,
  isOpen, 
  onClose, 
  onIndexChange 
}: MediaViewerDialogProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Handle both media array and images array (string[]) for backward compatibility
  const mediaItems: MediaFile[] = media || 
    (images ? 
      images.map(url => ({
        url,
        type: isVideo(url) ? 'video' : 'image'
      })) : 
      (image ? [{url: image, type: isVideo(image) ? 'video' : 'image'}] : [])
    );
  
  const currentMedia = mediaItems[currentIndex] || { url: '', type: 'image' };
  
  // Reset zoom level when changing media or opening dialog
  useEffect(() => {
    setZoomLevel(100);
  }, [currentIndex, isOpen]);
  
  // Manage video playback state
  useEffect(() => {
    if (isOpen && currentMedia.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => console.error('Failed to play video:', err));
      } else {
        videoRef.current.pause();
      }
      
      videoRef.current.muted = isMuted;
    }
  }, [isPlaying, isMuted, isOpen, currentMedia.type]);
  
  // Reset video state when changing media
  useEffect(() => {
    setIsPlaying(false);
  }, [currentIndex]);
  
  const handleZoomIn = () => {
    if (currentMedia.type === 'image') {
      setZoomLevel(prev => Math.min(prev + 25, 300));
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
    if (mediaItems.length <= 1) return;
    const newIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    onIndexChange(newIndex);
  };
  
  const handleNext = () => {
    if (mediaItems.length <= 1) return;
    const newIndex = (currentIndex + 1) % mediaItems.length;
    onIndexChange(newIndex);
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden" onPointerDownOutside={onClose}>
        <DialogTitle className="sr-only">Media Viewer</DialogTitle>
        <div className="relative h-full">
          {/* Controls overlay */}
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
          
          {/* Navigation buttons */}
          {mediaItems.length > 1 && (
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
          
          {/* Media container */}
          <div className="h-full flex items-center justify-center overflow-auto p-4 bg-background/95">
            {currentMedia.type === 'image' ? (
              <div className="flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
                <img 
                  src={currentMedia.url} 
                  alt="Media" 
                  style={{ 
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    transition: 'transform 0.2s ease'
                  }}
                  onError={(e) => {
                    console.error('Image failed to load in MediaViewerDialog:', currentMedia.url);
                    const imgElement = e.currentTarget;
                    imgElement.src = '/placeholder.svg';
                    imgElement.style.opacity = '0.5';
                    imgElement.style.width = '200px';
                    imgElement.style.height = '200px';
                  }}
                />
              </div>
            ) : (
              <video 
                ref={videoRef}
                src={currentMedia.url}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
                controls={false}
                loop
                playsInline
                onClick={togglePlayPause}
                onError={(e) => {
                  console.error('Video failed to load:', currentMedia.url);
                  const videoElement = e.currentTarget;
                  videoElement.poster = '/placeholder.svg';
                  videoElement.style.opacity = '0.5';
                  videoElement.style.width = '200px';
                  videoElement.style.height = '200px';
                }}
              />
            )}
          </div>
          
          {/* Image counter */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-background/80 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {mediaItems.length}
                </span>
              </div>
            </div>
          )}
          
          {/* Video controls */}
          {currentMedia.type === 'video' && (
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
