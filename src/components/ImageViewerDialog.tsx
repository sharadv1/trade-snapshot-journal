
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Maximize, ExternalLink } from 'lucide-react';
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
  images,
  currentIndex = 0,
  isOpen, 
  onClose,
  onIndexChange
}: ImageViewerDialogProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };
  
  const handleReset = () => {
    setZoomLevel(100);
  };
  
  const openInNewTab = () => {
    window.open(image, '_blank');
  };
  
  const handlePrevious = () => {
    if (!images || images.length <= 1 || !onIndexChange) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    onIndexChange(newIndex);
  };
  
  const handleNext = () => {
    if (!images || images.length <= 1 || !onIndexChange) return;
    const newIndex = (currentIndex + 1) % images.length;
    onIndexChange(newIndex);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden" onPointerDownOutside={onClose}>
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
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
        
        {images && images.length > 1 && onIndexChange && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full opacity-70 hover:opacity-100"
              onClick={handlePrevious}
            >
              <span className="sr-only">Previous</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full opacity-70 hover:opacity-100"
              onClick={handleNext}
            >
              <span className="sr-only">Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          </>
        )}
        
        <div className="h-full flex items-center justify-center">
          <div className="relative max-h-full max-w-full flex items-center justify-center">
            <img 
              src={image} 
              alt="Enlarged view" 
              className="object-contain max-h-[85vh] max-w-[90vw]"
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center'
              }}
            />
          </div>
        </div>
        
        {images && images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-background/80 px-3 py-1 rounded-full">
              <span className="text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
