
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  id?: string;
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readonly?: boolean;
}

export function RichTextEditor({ 
  id, 
  content, 
  onChange, 
  placeholder, 
  className,
  readonly = false
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Enable the Markdown shortcut feature
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'my-4 border-t-2 border-gray-300',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        bold: {
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'pl-4 border-l-4 border-gray-400 my-2',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'bg-muted rounded px-1.5 py-0.5 font-mono text-sm',
          }
        }
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
        showOnlyWhenEditable: true,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        id,
        class: cn(
          'min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto prose prose-sm max-w-none focus:outline-none',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange(newContent);
    },
    // Enable Markdown input processing
    enableInputRules: true,
    enablePasteRules: true,
    editable: !readonly,
  });

  // Update editor content when content prop changes from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Add custom styles for our Markdown elements
  useEffect(() => {
    // Add additional styling to the editor container
    if (!editor) return;

    const updateCSS = () => {
      document.head.querySelectorAll('.tiptap-custom-styles').forEach(el => el.remove());
      
      const style = document.createElement('style');
      style.className = 'tiptap-custom-styles';
      style.textContent = `
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
        }
        .ProseMirror ul li {
          list-style-type: disc;
        }
        .ProseMirror ol li {
          list-style-type: decimal;
        }
        .ProseMirror h1 {
          font-size: 1.5rem;
          margin: 1rem 0;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
          margin: 0.75rem 0;
        }
        .ProseMirror h3 {
          font-size: 1.125rem;
          margin: 0.5rem 0;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #a0a0a0;
          padding-left: 1rem;
          font-style: italic;
          margin: 1rem 0;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror hr {
          margin: 1rem 0;
          border-top: 2px solid #a0a0a0;
        }
      `;
      
      document.head.appendChild(style);
    };
    
    updateCSS();
    return () => {
      document.head.querySelectorAll('.tiptap-custom-styles').forEach(el => el.remove());
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
}
