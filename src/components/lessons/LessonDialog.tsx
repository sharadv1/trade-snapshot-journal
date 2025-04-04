
import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lesson, LessonMedia } from '@/types';
import { addLesson, updateLesson, getLessonTypes } from '@/utils/lessonStorage';
import { toast } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ImagePlus } from 'lucide-react';

interface LessonDialogProps {
  open: boolean;
  onClose: () => void;
  lesson: Lesson | null;
}

export function LessonDialog({ open, onClose, lesson }: LessonDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [media, setMedia] = useState<LessonMedia[]>([]);
  const [newType, setNewType] = useState('');
  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaCaption, setMediaCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset the form when dialog opens
      if (lesson) {
        // Edit mode - populate form with lesson data
        setTitle(lesson.title || '');
        setDescription(lesson.description || '');
        setTypes(lesson.types || []);
        setMedia(lesson.media || []);
      } else {
        // Create mode - reset form
        setTitle('');
        setDescription('');
        setTypes([]);
        setMedia([]);
      }
      
      // Get existing types for suggestions
      setTypeSuggestions(getLessonTypes());
      setNewType('');
      setMediaUrl('');
      setMediaType('image');
      setMediaCaption('');
    }
  }, [open, lesson]);

  const handleAddType = () => {
    if (newType && !types.includes(newType)) {
      setTypes([...types, newType]);
      setNewType('');
    }
  };

  const handleRemoveType = (typeToRemove: string) => {
    setTypes(types.filter(type => type !== typeToRemove));
  };

  const handleAddMedia = () => {
    if (mediaUrl) {
      if (media.length >= 2) {
        toast.error('Maximum of 2 media items allowed');
        return;
      }
      
      const newMedia: LessonMedia = {
        id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
        type: mediaType,
        url: mediaUrl,
        caption: mediaCaption || undefined
      };
      
      setMedia([...media, newMedia]);
      setMediaUrl('');
      setMediaCaption('');
    }
  };

  const handleRemoveMedia = (mediaId: string) => {
    setMedia(media.filter(item => item.id !== mediaId));
  };

  const handleSubmit = () => {
    if (!title) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      
      if (lesson) {
        // Update existing lesson
        const updatedLesson: Lesson = {
          ...lesson,
          title,
          description,
          types,
          media,
          updatedAt: now
        };
        
        updateLesson(updatedLesson);
        toast.success('Lesson updated successfully');
      } else {
        // Create new lesson
        const newLesson: Lesson = {
          id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
          title,
          description,
          types,
          media,
          createdAt: now,
          updatedAt: now
        };
        
        addLesson(newLesson);
        toast.success('Lesson created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Lesson title"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Lesson description"
              rows={5}
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Types
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="Add a new type or select from existing"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddType())}
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddType} 
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Type
                </Button>
              </div>
              
              {typeSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {typeSuggestions
                    .filter(type => !types.includes(type))
                    .map(type => (
                      <Badge 
                        key={type} 
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => setTypes([...types, type])}
                      >
                        {type}
                      </Badge>
                    ))
                  }
                </div>
              )}
              
              {types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {types.map(type => (
                    <Badge key={type} className="flex items-center gap-1">
                      {type}
                      <button 
                        onClick={() => handleRemoveType(type)} 
                        className="text-xs rounded-full hover:bg-primary-foreground w-4 h-4 inline-flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Media
            </Label>
            <div className="col-span-3 space-y-4">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <Select 
                  value={mediaType} 
                  onValueChange={(value) => setMediaType(value as 'image' | 'video')}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={mediaType === 'image' ? 'Image URL' : 'Video URL (YouTube, Vimeo, etc.)'}
                />
              </div>
              
              <Input
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Caption (optional)"
              />
              
              <Button 
                type="button" 
                onClick={handleAddMedia} 
                variant="outline"
                disabled={!mediaUrl}
                className="w-full"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Add {mediaType === 'image' ? 'Image' : 'Video'} ({media.length}/2)
              </Button>
              
              {media.length > 0 && (
                <div className="space-y-2">
                  {media.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="truncate">
                        <span className="font-medium">{item.type}: </span>
                        <span className="text-sm text-muted-foreground">{item.url}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveMedia(item.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
