
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { getTradeById } from '@/utils/storage/tradeOperations';
import { Button } from '@/components/ui/button';
import { Trade, TradeWithMetrics } from '@/types';
import { TradeMetrics } from '@/components/TradeMetrics';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeCommentsList } from '@/components/journal/TradeCommentsList';
import { PartialExitsList } from '@/components/PartialExitsList';
import { calculateTradeMetrics } from '@/utils/calculations/metricsCalculator';

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!id) {
      console.error('No trade ID provided in URL');
      return;
    }
    
    const tradeData = getTradeById(id);
    if (tradeData) {
      setTrade(tradeData);
    } else {
      console.error('Trade not found with ID:', id);
    }
    setIsLoading(false);
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p>Loading trade details...</p>
      </div>
    );
  }
  
  if (!trade) {
    return (
      <div className="py-8 text-center">
        <p>Trade not found</p>
        <Button onClick={() => navigate('/')}>Go Back to Dashboard</Button>
      </div>
    );
  }
  
  const handleEditClick = () => {
    navigate(`/trade/${id}/edit`);
  };
  
  // Convert the single trade to a TradeWithMetrics object and wrap it in an array for the TradeMetrics component
  const tradeWithMetrics: TradeWithMetrics = {
    ...trade,
    metrics: calculateTradeMetrics(trade)
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/trade/${id}`}>Trade Details</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            {trade.type === 'futures' ? 'Futures' : 'Stock'} Trade: {trade.symbol}
          </h1>
          <p className="text-muted-foreground">
            Entry: {format(new Date(trade.entryDate), 'MMMM d, yyyy')}
            {trade.exitDate && ` • Exit: ${format(new Date(trade.exitDate), 'MMMM d, yyyy')}`}
          </p>
        </div>
        <Button onClick={handleEditClick}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trade
        </Button>
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Trade Metrics</CardTitle>
          <CardDescription>Key performance indicators for this trade.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass an array containing the single trade with metrics to match the expected props */}
          <TradeMetrics trades={[tradeWithMetrics]} showOnlyKeyMetrics={true} />
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
          <CardDescription>Detailed information about the trade.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-none pl-0">
            <li className="mb-2">
              <strong>Symbol:</strong> {trade.symbol}
            </li>
            <li className="mb-2">
              <strong>Type:</strong> {trade.type}
            </li>
            <li className="mb-2">
              <strong>Strategy:</strong> {trade.strategy || 'N/A'}
            </li>
            <li className="mb-2">
              <strong>Entry Date:</strong> {format(new Date(trade.entryDate), 'MMMM d, yyyy, h:mm a')}
            </li>
            <li className="mb-2">
              <strong>Entry Price:</strong> {trade.entryPrice}
            </li>
            <li className="mb-2">
              <strong>Quantity:</strong> {trade.quantity}
            </li>
            <li className="mb-2">
              <strong>Stop Loss:</strong> {trade.stopLoss}
            </li>
            <li className="mb-2">
              <strong>Take Profit:</strong> {trade.takeProfit}
            </li>
            {trade.exitDate && (
              <li className="mb-2">
                <strong>Exit Date:</strong> {format(new Date(trade.exitDate), 'MMMM d, yyyy, h:mm a')}
              </li>
            )}
            {trade.exitPrice && (
              <li className="mb-2">
                <strong>Exit Price:</strong> {trade.exitPrice}
              </li>
            )}
            <li className="mb-2">
              <strong>Status:</strong> {trade.status}
            </li>
          </ul>
        </CardContent>
      </Card>
      
      {trade.partialExits && trade.partialExits.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Partial Exits</CardTitle>
            <CardDescription>List of partial exits for this trade.</CardDescription>
          </CardHeader>
          <CardContent>
            <PartialExitsList trade={trade} onUpdate={() => {}} allowEditing={false} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trade Comments</CardTitle>
          <CardDescription>Comments and analysis on the trade.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass the trade data to match the expected props of TradeCommentsList */}
          <TradeCommentsList trades={[tradeWithMetrics]} listTitle="Trade Notes" />
        </CardContent>
      </Card>
    </div>
  );
}
