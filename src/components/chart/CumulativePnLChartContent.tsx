
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/utils/tradeCalculations';
import { PnLChartTooltip } from './PnLChartTooltip';

interface CumulativePnLChartContentProps {
  chartData: any[];
  totalLineColor: string;
}

export function CumulativePnLChartContent({ 
  chartData, 
  totalLineColor 
}: CumulativePnLChartContentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={chartData}
        margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="formattedDate" 
          tick={{ fontSize: 12 }}
          tickMargin={10}
          tickFormatter={(value) => {
            // Format the date to show month and day only
            const parts = value.split(',')[0].split(' ');
            return `${parts[0]} ${parts[1]}`;
          }}
          height={50}
          minTickGap={30}
        />
        <YAxis 
          tickFormatter={(value) => formatCurrency(Number(value)).replace('$', '')}
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip content={<PnLChartTooltip />} />
        
        {/* Line for overall P&L only */}
        <Line 
          type="monotone" 
          dataKey="total" 
          name="Overall P&L"
          stroke={totalLineColor} 
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 1 }}
          activeDot={{ r: 5, strokeWidth: 1 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
