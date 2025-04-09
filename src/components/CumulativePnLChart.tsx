
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeWithMetrics } from '@/types';
import { useCumulativePnLData } from '@/hooks/useCumulativePnLData';
import { EmptyChartState } from './chart/EmptyChartState';
import { CumulativePnLChartContent } from './chart/CumulativePnLChartContent';

interface CumulativePnLChartProps {
  trades: TradeWithMetrics[];
}

export function CumulativePnLChart({ trades }: CumulativePnLChartProps) {
  const { chartData, totalLineColor, hasData } = useCumulativePnLData(trades);

  if (!hasData) {
    return <EmptyChartState title="Cumulative Profit & Loss" />;
  }

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle className="text-base font-medium">Cumulative Profit & Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <CumulativePnLChartContent 
            chartData={chartData}
            totalLineColor={totalLineColor}
          />
        </div>
      </CardContent>
    </Card>
  );
}
