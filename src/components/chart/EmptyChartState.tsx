
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyChartStateProps {
  title: string;
  height?: string;
}

export function EmptyChartState({ title, height = "400px" }: EmptyChartStateProps) {
  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className={`${height} flex items-center justify-center text-muted-foreground`}>
        No closed trades to display
      </CardContent>
    </Card>
  );
}
