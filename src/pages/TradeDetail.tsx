
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  PencilLine, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  ArrowLeft,
  DollarSign,
  Link as LinkIcon,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { PartialExitsList } from '@/components/PartialExitsList';
import { TradeMetrics } from '@/components/TradeMetrics';
import { getTradeById, deleteTrade } from '@/utils/storage/tradeOperations';
import { getIdeaById } from '@/utils/ideaStorage';
import { useToast } from '@/hooks/use-toast';
import { Trade } from '@/types';
import { calculateTradeMetrics } from '@/utils/tradeCalculations';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

export default function TradeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [trade, setTrade] = useState<Trade | null>(null);
  const [tradeIdea, setTradeIdea] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitFormOpen, setExitFormOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Load trade data
  useEffect(() => {
    if (id) {
      const loadedTrade = getTradeById(id);
      if (loadedTrade) {
        setTrade(loadedTrade);
        
        // Load associated idea if exists
        if (loadedTrade.ideaId) {
          const idea = getIdeaById(loadedTrade.ideaId);
          setTradeIdea(idea);
        }
      } else {
        toast({
          title: "Trade not found",
          description: "The trade you're looking for doesn't exist or has been deleted.",
          variant: "destructive"
        });
        navigate('/');
      }
    }
  }, [id, navigate, toast]);
  
  // Handle trade not found
  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h2 className="text-2xl font-bold mb-4">Trade Not Found</h2>
        <p className="mb-8 text-muted-foreground">
          The trade you're looking for could not be found or has been deleted.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  const tradeMetrics = calculateTradeMetrics(trade);
  const isOpenTrade = !trade.exitDate;
  
  // Delete the trade
  const handleDeleteTrade = async () => {
    if (id) {
      await deleteTrade(id);
      toast({
        title: "Trade deleted",
        description: "The trade has been permanently deleted."
      });
      navigate('/');
    }
  };
  
  // Format account size for display
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Get appropriate status badge
  const getStatusBadge = () => {
    if (isOpenTrade) {
      return <Badge className="bg-blue-500">Open</Badge>;
    }
    
    if (tradeMetrics.profitLoss > 0) {
      return <Badge className="bg-green-500">Win</Badge>;
    } else if (tradeMetrics.profitLoss < 0) {
      return <Badge className="bg-red-500">Loss</Badge>;
    } else {
      return <Badge className="bg-yellow-500">Breakeven</Badge>;
    }
  };
  
  // Handle view image click
  const handleImageClick = (image: string) => {
    setViewingImage(image);
  };
  
  return (
    <div className="space-y-8 pb-16">
      {/* Back button and trade header */}
      <div>
        <Button 
          variant="ghost" 
          className="mb-6 -ml-2" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              {trade.direction === 'long' ? (
                <ArrowUp className="mr-2 h-6 w-6 text-green-500" />
              ) : (
                <ArrowDown className="mr-2 h-6 w-6 text-red-500" />
              )}
              {trade.symbol}
              <span className="ml-3">{getStatusBadge()}</span>
            </h1>
            
            <div className="flex flex-wrap gap-2 mt-2 text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {format(new Date(trade.entryDate), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {format(new Date(trade.entryDate), 'h:mm a')}
              </div>
              {trade.strategy && (
                <Badge variant="outline" className="ml-1">
                  {trade.strategy}
                </Badge>
              )}
            </div>
            
            {tradeIdea && (
              <div 
                className="mt-2 text-primary flex items-center cursor-pointer hover:underline"
                onClick={() => navigate(`/ideas?id=${tradeIdea.id}`)}
              >
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                View associated idea
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/trade/${id}/edit`)}
            >
              <PencilLine className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
            
            {isOpenTrade && (
              <Button onClick={() => setExitFormOpen(true)}>
                Close Trade
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      {/* Trade metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TradeMetrics trade={trade} />
      </div>
      
      {/* Trade details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1.5">
              <h3 className="font-medium text-sm text-muted-foreground">Direction</h3>
              <div className="font-medium flex items-center">
                {trade.direction === 'long' ? (
                  <>
                    <ArrowUp className="mr-1.5 h-4 w-4 text-green-500" />
                    Long
                  </>
                ) : (
                  <>
                    <ArrowDown className="mr-1.5 h-4 w-4 text-red-500" />
                    Short
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-medium text-sm text-muted-foreground">Symbol</h3>
              <div className="font-medium">{trade.symbol}</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">Entry Price</h3>
                <div className="font-medium">{formatCurrency(trade.entryPrice)}</div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">Position Size</h3>
                <div className="font-medium">{trade.positionSize}</div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">Stop Loss</h3>
                <div className="font-medium">
                  {trade.stopLoss ? formatCurrency(trade.stopLoss) : '—'}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">Take Profit</h3>
                <div className="font-medium">
                  {trade.takeProfit ? formatCurrency(trade.takeProfit) : '—'}
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-medium text-sm text-muted-foreground">Setup</h3>
              <div className="whitespace-pre-wrap">
                {trade.setup || '—'}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notes & Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1.5">
              <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
              <div className="whitespace-pre-wrap">
                {trade.notes || '—'}
              </div>
            </div>
            
            {trade.images && trade.images.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {trade.images.map((image, index) => (
                    <div 
                      key={index}
                      className="aspect-square rounded-md overflow-hidden border cursor-pointer"
                      onClick={() => handleImageClick(image)}
                    >
                      <img 
                        src={image} 
                        alt={`Trade image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Exit details section */}
      {trade.exitDate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">Exit Date</h3>
                <div className="font-medium">
                  {format(new Date(trade.exitDate), 'MMM d, yyyy')}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">Exit Price</h3>
                <div className="font-medium">
                  {formatCurrency(trade.exitPrice || 0)}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">P&L</h3>
                <div className={`font-medium ${
                  tradeMetrics.profitLoss > 0 
                    ? 'text-green-600' 
                    : tradeMetrics.profitLoss < 0 
                    ? 'text-red-600' 
                    : ''
                }`}>
                  {tradeMetrics.profitLossFormatted}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-medium text-sm text-muted-foreground">R Multiple</h3>
                <div className={`font-medium ${
                  tradeMetrics.rMultiple > 0 
                    ? 'text-green-600' 
                    : tradeMetrics.rMultiple < 0 
                    ? 'text-red-600' 
                    : ''
                }`}>
                  {tradeMetrics.rMultiple ? `${tradeMetrics.rMultiple.toFixed(2)}R` : '—'}
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-medium text-sm text-muted-foreground">Exit Notes</h3>
              <div className="whitespace-pre-wrap">
                {trade.exitNotes || '—'}
              </div>
            </div>
            
            {/* Partial exits, if any */}
            {trade.partialExits && trade.partialExits.length > 0 && (
              <div className="pt-4">
                <h3 className="font-medium mb-2">Partial Exits</h3>
                <Separator className="mb-4" />
                <PartialExitsList 
                  partialExits={trade.partialExits}
                  entryPrice={trade.entryPrice || 0}
                  tradeId={trade.id}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trade. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrade} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Exit Trade Modal */}
      {exitFormOpen && (
        <ExitTradeForm 
          trade={trade} 
          onOpenChange={setExitFormOpen}
          onSuccess={() => {
            setExitFormOpen(false);
            // Reload trade data after exiting
            const updatedTrade = getTradeById(id || '');
            if (updatedTrade) {
              setTrade(updatedTrade);
            }
          }}
        />
      )}
      
      {/* Image viewer dialog */}
      {viewingImage && (
        <ImageViewerDialog 
          image={viewingImage} 
          isOpen={!!viewingImage} 
          onClose={() => setViewingImage(null)} 
        />
      )}
    </div>
  );
}
