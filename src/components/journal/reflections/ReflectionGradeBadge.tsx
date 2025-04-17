
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ReflectionGradeBadgeProps {
  grade?: string;
}

export const ReflectionGradeBadge = ({ grade }: ReflectionGradeBadgeProps) => {
  if (!grade) return null;

  return (
    <div className="inline-flex bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
      Grade: {grade}
    </div>
  );
};
