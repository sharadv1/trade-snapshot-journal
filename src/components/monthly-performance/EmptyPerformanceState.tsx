
import React from 'react';

interface EmptyPerformanceStateProps {
  message: string;
}

export function EmptyPerformanceState({ message }: EmptyPerformanceStateProps) {
  return (
    <div className="text-center p-8 text-muted-foreground">
      {message}
    </div>
  );
}
