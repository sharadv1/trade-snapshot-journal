
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
  value?: string;
  subValue?: string;
  subStats?: Stat[];
  className?: string;
  tooltip?: string;
  twoColumnLayout?: boolean;
  columnOneStats?: Stat[];
  columnTwoStats?: Stat[];
  children?: React.ReactNode;
}

export function MetricCard({ 
  title, 
  value, 
  subValue, 
  subStats, 
  className = "",
  tooltip,
  twoColumnLayout = false,
  columnOneStats = [],
  columnTwoStats = [],
  children
}: MetricCardProps) {
  return (
    <Card className="shadow-sm h-full">
      <CardContent className="p-4">
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
        
        {value && (
          <div className={`mt-2 text-2xl font-bold ${className}`}>
            {value}
          </div>
        )}
        
        {subValue && (
          <div className={`text-sm ${className}`}>
            {subValue}
          </div>
        )}
        
        {/* Standard single-column layout */}
        {!twoColumnLayout && subStats && subStats.length > 0 && (
          <div className={`${value ? 'mt-4' : 'mt-2'} space-y-1.5`}>
            {subStats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={`text-sm font-medium ${stat.className || ''}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Two-column layout */}
        {twoColumnLayout && (
          <div className="mt-2">
            {/* Top section with subStats (usually Net P&L and Total R) */}
            {subStats && subStats.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {subStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className={`text-sm font-medium ${stat.className || ''}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Two column grid for the rest of the stats */}
            <div className="grid grid-cols-2 gap-x-4">
              {/* Left column */}
              <div className="space-y-1.5">
                {columnOneStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className={`text-sm font-medium ${stat.className || ''}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
              
              {/* Right column */}
              <div className="space-y-1.5">
                {columnTwoStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className={`text-sm font-medium ${stat.className || ''}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {children}
      </CardContent>
    </Card>
  );
}
