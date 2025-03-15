
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Maximize, ExternalLink } from 'lucide-react';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface ImageViewerDialogProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewerDialog({ image, isOpen, onClose }: ImageViewerDialogProps) {
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden" onPointerDownOutside={onClose}>
        <DialogTitle>
          <VisuallyHidden>Image Viewer</VisuallyHidden>
        </DialogTitle>
        <div className="relative h-full">
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
          
          <div className="h-full flex items-center justify-center p-4">
            <div className="relative overflow-auto max-h-full max-w-full flex items-center justify-center">
              <img 
                src={image} 
                alt="Trade image" 
                className="object-contain max-h-[calc(90vh-32px)]"
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center'
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
