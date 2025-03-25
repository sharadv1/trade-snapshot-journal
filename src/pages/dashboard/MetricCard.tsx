
import { Card, CardContent } from '@/components/ui/card';

interface SubStat {
  label: string;
  value: string;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  className?: string;
  subStats?: SubStat[];
}

export function MetricCard({ title, value, subValue, className, subStats }: MetricCardProps) {
  return (
    <Card className="shadow-subtle border">
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold mt-1 ${className}`}>
          {value}
          {subValue && (
            <div className={`text-sm font-medium mt-0.5 ${className}`}>
              {subValue}
            </div>
          )}
        </div>
        
        {subStats && subStats.length > 0 && (
          <div className="mt-2 space-y-1 text-sm">
            {subStats.map((stat, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-muted-foreground">{stat.label}:</span>
                <span className={stat.className}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
