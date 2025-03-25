
import { formatCurrency } from '@/utils/tradeCalculations';

interface PnLTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function PnLChartTooltip({ active, payload, label }: PnLTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded shadow-md">
        <div className="font-medium mb-1">{label}</div>
        {payload.map((entry, index) => {
          const value = Number(entry.value);
          const name = entry.name === 'total' ? 'Overall P&L' : entry.name;
          return (
            <div key={`tooltip-${index}`} className="flex justify-between gap-4 text-sm">
              <span className="flex items-center">
                <span 
                  className="inline-block w-3 h-3 mr-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></span>
                {name}:
              </span>
              <span className={value >= 0 ? 'text-profit' : 'text-loss'}>
                {formatCurrency(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}
