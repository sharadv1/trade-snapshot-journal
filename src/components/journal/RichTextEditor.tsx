
import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

interface RichTextEditorProps {
  id?: string;
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ id, content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update editor content when content prop changes (for initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [editor, content]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editor) {
          // Use addImage instead of setImage for inserting images
          editor
            .chain()
            .focus()
            .insertContent(`<img src="${event.target.result}" alt="Uploaded image" />`)
            .run();
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
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
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
      
      <div className="p-3 min-h-[200px] bg-background">
        <EditorContent editor={editor} className="prose prose-sm w-full focus:outline-none min-h-[180px]" />
      </div>
    </div>
  );
}
