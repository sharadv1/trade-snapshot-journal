
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilLine, ArrowRight, ArrowUp, ArrowDown, Trash2, ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TradeIdea } from '@/types';
import { format } from 'date-fns';
import { MediaViewerDialog } from '@/components/MediaViewerDialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface IdeaCardProps {
  idea: TradeIdea;
  relatedTradeId: string | null;
  onEditClick: (idea: TradeIdea) => void;
  onDeleteClick: (ideaId: string) => void;
  onCreateTradeClick: (idea: TradeIdea) => void;
}

export function IdeaCard({ 
  idea, 
  relatedTradeId, 
  onEditClick, 
  onDeleteClick, 
  onCreateTradeClick 
}: IdeaCardProps) {
  const navigate = useNavigate();
  const [viewingImageIndex, setViewingImageIndex] = useState<number|null>(null);

  const changeDisplayedImage = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingImageIndex(index);
  };

  const handleThumbnailClick = (index: number, image: string, e: React.MouseEvent) => {
    e.stopPropagation();
    changeDisplayedImage(index, e);
  };
  
  const renderStatusBadge = (status: TradeIdea['status']) => {
    switch (status) {
      case 'still valid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Still Valid</Badge>;
      case 'invalidated':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Invalidated</Badge>;
      case 'taken':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Taken</Badge>;
      case 'missed':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Missed</Badge>;
      default:
        return null;
    }
  };

  const renderDirectionBadge = (direction?: 'long' | 'short' | string) => {
    if (!direction) return null;
    
    return direction === 'long' 
      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
          <ArrowUp className="mr-1 h-3 w-3" /> Long
        </Badge>
      : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
          <ArrowDown className="mr-1 h-3 w-3" /> Short
        </Badge>;
  };
  
  const renderImageGallery = () => {
    if (!idea.images || idea.images.length === 0) return null;
    
    const currentIndex = viewingImageIndex ?? 0;
    const currentImage = idea.images[currentIndex];

    return (
      <div className="px-4 pt-2">
        {/* Main image */}
        <div 
          className="w-full h-32 rounded-md overflow-hidden relative cursor-pointer group"
          onClick={() => setViewingImageIndex(currentIndex)}
        >
          <img 
            src={currentImage} 
            alt={`${idea.symbol} chart`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load in IdeaCard:', currentImage);
              const imgElement = e.currentTarget;
              imgElement.src = '/placeholder.svg';
              imgElement.style.opacity = '0.5';
            }}
          />
          
          {idea.images.length > 1 && (
            <>
              {/* Navigation arrows */}
              <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity px-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentIndex - 1 + idea.images.length) % idea.images.length;
                    setViewingImageIndex(newIndex);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentIndex + 1) % idea.images.length;
                    setViewingImageIndex(newIndex);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Image counter */}
              <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {currentIndex + 1}/{idea.images.length}
              </div>
            </>
          )}
        </div>
        
        {/* Thumbnails row */}
        {idea.images.length > 1 && (
          <div className="flex mt-2 gap-1 overflow-x-auto pb-1">
            {idea.images.map((image, idx) => (
              <button
                key={idx}
                className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 border-2 ${
                  idx === currentIndex ? 'border-primary' : 'border-transparent'
                }`}
                onClick={(e) => handleThumbnailClick(idx, image, e)}
              >
                <img 
                  src={image} 
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const imgElement = e.currentTarget;
                    imgElement.src = '/placeholder.svg';
                    imgElement.style.opacity = '0.5';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {idea.symbol}
                    {renderDirectionBadge(idea.direction)}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(idea.date), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                {renderStatusBadge(idea.status)}
              </div>
            </CardHeader>
            
            {idea.images && idea.images.length > 0 && renderImageGallery()}
            
            <CardContent className="p-4 pt-2 flex-grow">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {idea.description || 'No description provided'}
              </div>
              
              {/* Add trade link for taken ideas */}
              {idea.status === 'taken' && relatedTradeId && (
                <div 
                  className="mt-3 text-sm text-primary font-medium flex items-center cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/trade/${relatedTradeId}`);
                  }}
                >
                  <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                  View associated trade
                </div>
              )}
              
              {idea.status === 'taken' && !relatedTradeId && (
                <div className="mt-3 text-sm text-gray-500 italic">
                  This idea is marked as taken but the trade is no longer available.
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-4 pt-0 flex flex-wrap justify-between">
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onEditClick(idea)}
                >
                  <PencilLine className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                
                {idea.status !== 'taken' && (
                  <Button 
                    size="sm"
                    onClick={() => onCreateTradeClick(idea)}
                  >
                    <ArrowRight className="mr-1 h-4 w-4" />
                    Create Trade
                  </Button>
                )}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDeleteClick(idea.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEditClick(idea)}>
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
          {idea.status !== 'taken' && (
            <ContextMenuItem onClick={() => onCreateTradeClick(idea)}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Create Trade
            </ContextMenuItem>
          )}
          {idea.status === 'taken' && relatedTradeId && (
            <ContextMenuItem onClick={() => navigate(`/trade/${relatedTradeId}`)}>
              <LinkIcon className="mr-2 h-4 w-4" />
              View Trade
            </ContextMenuItem>
          )}
          <ContextMenuItem 
            onClick={() => onDeleteClick(idea.id)}
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Modal for image viewing */}
      {viewingImageIndex !== null && (
        <MediaViewerDialog
          images={idea.images}
          currentIndex={viewingImageIndex}
          isOpen={viewingImageIndex !== null}
          onClose={() => setViewingImageIndex(null)}
          onIndexChange={setViewingImageIndex}
        />
      )}
    </>
  );
}
