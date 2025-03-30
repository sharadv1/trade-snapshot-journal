
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Trade Details</CardTitle>
              <CardDescription>Detailed information about the trade.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ul className="list-none pl-0 space-y-3">
                    <li>
                      <span className="font-medium text-muted-foreground">Symbol:</span> {trade.symbol}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Type:</span> {trade.type}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Strategy:</span> {trade.strategy || 'N/A'}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Direction:</span> {trade.direction === 'long' ? 'Long' : 'Short'}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Status:</span> {trade.status}
                    </li>
                  </ul>
                </div>
                <div>
                  <ul className="list-none pl-0 space-y-3">
                    <li>
                      <span className="font-medium text-muted-foreground">Entry Date:</span> {format(new Date(trade.entryDate), 'MMMM d, yyyy, h:mm a')}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Entry Price:</span> {trade.entryPrice}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Quantity:</span> {trade.quantity}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Stop Loss:</span> {trade.stopLoss || 'N/A'}
                    </li>
                    <li>
                      <span className="font-medium text-muted-foreground">Take Profit:</span> {trade.takeProfit || 'N/A'}
                    </li>
                  </ul>
                </div>
              </div>
              {trade.exitDate && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium text-lg mb-2">Exit Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="list-none pl-0 space-y-3">
                      <li>
                        <span className="font-medium text-muted-foreground">Exit Date:</span> {format(new Date(trade.exitDate), 'MMMM d, yyyy, h:mm a')}
                      </li>
                      <li>
                        <span className="font-medium text-muted-foreground">Exit Price:</span> {trade.exitPrice || 'N/A'}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {trade.partialExits && trade.partialExits.length > 0 && (
            <Card className="mb-6">
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
              {trade.notes ? (
                <div className="bg-accent/30 p-4 rounded-md whitespace-pre-wrap">{trade.notes}</div>
              ) : (
                <p className="text-muted-foreground">No comments for this trade.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Trade Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <TradeMetrics trades={[tradeWithMetrics]} showOnlyKeyMetrics={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
