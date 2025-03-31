
import React, { useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  id?: string;
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ id, content, onChange, placeholder }: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("edit");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById(`${id}-markdown-input`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;
    
    const newContent = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    onChange(newContent);
    
    // After state update, refocus and position cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length, 
        end + before.length
      );
    }, 0);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageMd = `![Image](${event.target.result})`;
          const newContent = content + '\n' + imageMd;
          onChange(newContent);
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Reset the input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-input rounded-md overflow-hidden" id={id}>
      <div className="bg-muted px-2 py-1 border-b flex flex-wrap gap-1">
        <Toggle
          size="sm"
          onPressedChange={() => insertText('**', '**')}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => insertText('*', '*')}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => insertText('\n- ')}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm" 
          onPressedChange={() => insertText('\n1. ')}
          aria-label="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleImageUpload} 
          type="button"
          className="h-8 px-2"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-muted border-b">
          <TabsList className="bg-transparent h-9 p-0">
            <TabsTrigger value="edit" className="rounded-none h-9">Edit</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none h-9">Preview</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="edit" className="p-0 mt-0">
          <Textarea
            id={`${id}-markdown-input`}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Start typing in Markdown...'}
            className="border-0 min-h-[200px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="p-3 mt-0 prose prose-sm max-w-none min-h-[200px]">
          {content ? (
            <pre className="whitespace-pre-wrap break-words">{content}</pre>
          ) : (
            <p className="text-muted-foreground">{placeholder || 'Nothing to preview'}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
