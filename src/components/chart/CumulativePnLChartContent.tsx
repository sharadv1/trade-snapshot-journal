
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '@/utils/tradeCalculations';
import { PnLChartTooltip } from './PnLChartTooltip';

interface CumulativePnLChartContentProps {
  chartData: any[];
  strategies: string[];
  strategyColors: string[];
  totalLineColor: string;
}

export function CumulativePnLChartContent({ 
  chartData, 
  strategies, 
  strategyColors, 
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
        <Legend 
          verticalAlign="bottom"
          height={36}
          formatter={(value) => value === 'total' ? 'Overall P&L' : value}
        />
        
        {/* Line for overall P&L */}
        <Line 
          type="monotone" 
          dataKey="total" 
          name="total"
          stroke={totalLineColor} 
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 1 }}
          activeDot={{ r: 5, strokeWidth: 1 }}
        />
        
        {/* Lines for each strategy */}
        {strategies.map((strategy, index) => (
          <Line 
            key={strategy}
            type="monotone" 
            dataKey={strategy} 
            name={strategy}
            stroke={strategyColors[index % strategyColors.length]} 
            strokeWidth={1.5}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
