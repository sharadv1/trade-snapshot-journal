
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Stat {
  label: string;
  value: string;
  className?: string;
}

export interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  subStats?: Stat[];
  className?: string;
  tooltip?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subValue, 
  subStats, 
  className = "",
  tooltip
}: MetricCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-muted-foreground flex items-center">
            {title}
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 cursor-help text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="max-w-xs text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className={`mt-2 text-2xl font-bold ${className}`}>
          {value}
        </div>
        {subValue && (
          <div className={`text-sm ${className}`}>
            {subValue}
          </div>
        )}
        
        {subStats && subStats.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            {subStats.map((stat, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={`text-sm font-medium ${stat.className || ''}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
