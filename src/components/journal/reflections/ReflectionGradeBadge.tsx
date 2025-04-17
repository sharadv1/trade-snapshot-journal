
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ReflectionGradeBadgeProps {
  grade?: string;
}

export const ReflectionGradeBadge = ({ grade }: ReflectionGradeBadgeProps) => {
  if (!grade) return null;

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
      Grade: {grade}
    </Badge>
  );
};
