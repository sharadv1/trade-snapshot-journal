
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TradeWithMetrics } from '@/types';
import { ChevronUp, ChevronDown, Clock, CheckCircle, Award } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/calculations/formatters';
import { getStrategyById } from '@/utils/strategyStorage';
import { TradeDetailModal } from './TradeDetailModal';

interface TradeListTableProps {
  trades: TradeWithMetrics[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onTradeDeleted?: () => void;
}

export function TradeListTable({
  trades,
  sortField,
  sortDirection,
  handleSort,
  onTradeDeleted
}: TradeListTableProps) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to display strategy name instead of ID
  const getStrategyName = (strategyId: string | undefined): string => {
    if (!strategyId) return 'Unspecified';
    
    const strategy = getStrategyById(strategyId);
    return strategy ? strategy.name : strategyId;
  };

  const handleTradeClick = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2" onClick={() => handleSort('symbol')}>
              <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                Symbol
                {sortField === 'symbol' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </div>
            </th>
            <th className="text-left p-2" onClick={() => handleSort('direction')}>
              <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                Direction
                {sortField === 'direction' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </div>
            </th>
            <th className="text-left p-2" onClick={() => handleSort('strategy')}>
              <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                Strategy
                {sortField === 'strategy' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </div>
            </th>
            <th className="text-left p-2" onClick={() => handleSort('grade')}>
              <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                Grade
                {sortField === 'grade' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </div>
            </th>
            <th className="text-left p-2" onClick={() => handleSort('exitDate')}>
              <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                Exit Date
                {sortField === 'exitDate' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </div>
            </th>
            <th className="text-left p-2" onClick={() => handleSort('profitLoss')}>
              <div className="flex items-center cursor-pointer hover:text-primary transition-colors">
                P&L / R
                {sortField === 'profitLoss' && (
                  sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </div>
            </th>
            <th className="text-left p-2">Status</th>
            <th className="text-right p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {trades.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center p-4 text-muted-foreground">
                No trades found
              </td>
            </tr>
          ) : (
            trades.map(trade => (
              <tr 
                key={trade.id} 
                className="border-b hover:bg-muted/50 cursor-pointer" 
                onClick={() => handleTradeClick(trade.id)}
              >
                <td className="p-2">
                  <div className="font-medium">{trade.symbol}</div>
                  <div className="text-xs text-muted-foreground">{trade.type}</div>
                </td>
                <td className="p-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    trade.direction === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {trade.direction.toUpperCase()}
                  </div>
                </td>
                <td className="p-2">
                  {getStrategyName(trade.strategy)}
                </td>
                <td className="p-2">
                  {renderGradeBadge(trade.grade)}
                </td>
                <td className="p-2">
                  {trade.exitDate 
                    ? format(new Date(trade.exitDate), 'MMM d, yyyy')
                    : '-'
                  }
                </td>
                <td className="p-2">
                  {trade.status === 'closed' ? (
                    <div className="flex items-center">
                      <span className={trade.metrics?.profitLoss >= 0 ? 'text-profit' : 'text-loss'}>
                        {formatCurrency(trade.metrics?.profitLoss || 0)}
                      </span>
                      {trade.metrics?.rMultiple !== undefined && (
                        <span className={`ml-2 ${trade.metrics?.profitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                          ({trade.metrics.rMultiple.toFixed(2)}R)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Open</span>
                  )}
                </td>
                <td className="p-2">
                  {trade.status === 'open' ? (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-500 mr-1" />
                      <span>Open</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span>Closed</span>
                    </div>
                  )}
                </td>
                <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/trade/${trade.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <TradeDetailModal 
        tradeId={selectedTradeId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

// Helper to render grade badge
function renderGradeBadge(grade?: string) {
  if (!grade) return null;
  
  const gradeColors: Record<string, string> = {
    'A': 'bg-green-100 text-green-800',
    'B': 'bg-blue-100 text-blue-800',
    'C': 'bg-yellow-100 text-yellow-800',
    'D': 'bg-orange-100 text-orange-800',
    'F': 'bg-red-100 text-red-800'
  };
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${gradeColors[grade] || 'bg-gray-100'}`}>
      <Award className="h-3 w-3 mr-1" /> {grade}
    </div>
  );
}
