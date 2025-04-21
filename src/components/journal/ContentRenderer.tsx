
import React from 'react';
import DOMPurify from 'dompurify';

interface ContentRendererProps {
  content: string;
  className?: string;
  removeWrapperTags?: boolean;
}

export function ContentRenderer({ 
  content, 
  className = '',
  removeWrapperTags = false
}: ContentRendererProps) {
  // Sanitize HTML to prevent XSS attacks
  // Configure DOMPurify to allow all needed HTML elements and attributes 
  // for rich text without size limitations
  const sanitizedContent = DOMPurify.sanitize(content, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allowfullscreen', 'frameborder', 'scrolling'],
    FORCE_BODY: false,
    RETURN_DOM: false,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false,
    // Ensure we don't have any hidden limits
    ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'img', 'code', 'pre', 'hr', 'iframe'],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'id', 'style', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
  
  // If removeWrapperTags is true, remove the outer paragraph tags
  let processedContent = sanitizedContent;
  if (removeWrapperTags && processedContent.startsWith('<p>') && processedContent.endsWith('</p>')) {
    processedContent = processedContent.substring(3, processedContent.length - 4);
  }
  
  return (
    <div 
      className={`rendered-markdown ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
