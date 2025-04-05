
import React from 'react';
import DOMPurify from 'dompurify';

interface ContentRendererProps {
  content: string;
  className?: string;
}

export function ContentRenderer({ content, className = '' }: ContentRendererProps) {
  // Sanitize HTML to prevent XSS attacks
  // Configure DOMPurify to allow all needed HTML elements and attributes 
  // for rich text without size limitations
  const sanitizedContent = DOMPurify.sanitize(content, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
  
  return (
    <div 
      className={`rendered-markdown ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
