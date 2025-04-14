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
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { MediaUpload } from '@/components/MediaUpload';
import { generateUUID } from '@/utils/generateUUID';
import { RichTextEditor } from '@/components/journal/RichTextEditor';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (lesson) {
        setTitle(lesson.title || '');
        setDescription(lesson.description || '');
        setTypes(lesson.types || []);
        setMedia(lesson.media || []);
      } else {
        setTitle('');
        setDescription('');
        setTypes([]);
        setMedia([]);
      }
      
      setTypeSuggestions(getLessonTypes());
      setNewType('');
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

  const handleMediaUpload = async (file: File) => {
    if (media.length >= 2) {
      toast.error('Maximum of 2 media items allowed');
      return;
    }

    try {
      const { isUsingServerSync, getServerUrl } = await import('@/utils/storage/serverSync');
      
      if (isUsingServerSync() && getServerUrl()) {
        const baseUrl = getServerUrl().replace(/\/trades$/, '');
        const uploadUrl = `${baseUrl}/api/upload`;
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
              const serverUrl = new URL(baseUrl).origin + result.filePath;
              
              const newMedia: LessonMedia = {
                id: generateUUID(),
                type: result.isVideo ? 'video' : 'image',
                url: serverUrl,
                caption: ''
              };
              
              setMedia([...media, newMedia]);
              return;
            }
          }
          
          throw new Error('Server upload failed');
        } catch (serverError) {
          console.error('Server upload failed, falling back to data URL:', serverError);
          const reader = new FileReader();
          
          reader.onload = (e) => {
            if (e.target?.result) {
              const fileDataUrl = e.target.result.toString();
              const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
              
              const newMedia: LessonMedia = {
                id: generateUUID(),
                type: mediaType,
                url: fileDataUrl,
                caption: ''
              };
              
              setMedia([...media, newMedia]);
            }
          };
          
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          if (e.target?.result) {
            const fileDataUrl = e.target.result.toString();
            const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            
            const newMedia: LessonMedia = {
              id: generateUUID(),
              type: mediaType,
              url: fileDataUrl,
              caption: ''
            };
            
            setMedia([...media, newMedia]);
          }
        };
        
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handleUpdateCaption = (index: number, caption: string) => {
    const newMedia = [...media];
    if (newMedia[index]) {
      newMedia[index] = { ...newMedia[index], caption };
      setMedia(newMedia);
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      
      if (lesson) {
        const updatedLesson: Lesson = {
          ...lesson,
          title,
          description,
          types,
          media,
          updatedAt: now
        };
        
        const success = await updateLesson(updatedLesson);
        if (success) {
          toast.success('Lesson updated successfully');
          onClose();
        } else {
          toast.error('Failed to update lesson due to storage issues');
        }
      } else {
        const newLesson: Lesson = {
          id: generateUUID(),
          title,
          description,
          content: description || '',
          date: now,
          types,
          category: 'general',
          media,
          createdAt: now,
          updatedAt: now
        };
        
        const success = await addLesson(newLesson);
        if (success) {
          toast.success('Lesson created successfully');
          onClose();
        } else {
          toast.error('Failed to create lesson due to storage issues');
        }
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="col-span-3">
              <RichTextEditor
                id="description"
                content={description}
                onChange={setDescription}
                placeholder="Lesson description"
                className="min-h-[150px]"
              />
            </div>
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
              <MediaUpload 
                media={media.map(item => ({ 
                  url: item.url, 
                  type: item.type as 'image' | 'video' | 'pdf' 
                }))}
                onMediaUpload={handleMediaUpload}
                onMediaRemove={handleRemoveMedia}
                onImageUpload={handleMediaUpload}
                onImageRemove={handleRemoveMedia}
              />
              
              {media.length > 0 && (
                <div className="space-y-2">
                  {media.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <Input
                          value={item.caption || ''}
                          onChange={(e) => handleUpdateCaption(index, e.target.value)}
                          placeholder="Add a caption for this media"
                        />
                      </div>
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
