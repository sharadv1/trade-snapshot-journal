
import { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Trade } from '@/types';
import { toast } from '@/utils/toast';
import { deleteTrade } from '@/utils/storage/tradeOperations';
import { useNavigate } from 'react-router-dom';

interface DeleteTradeButtonProps {
  trade: Trade;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function DeleteTradeButton({ 
  trade, 
  variant = 'outline', 
  size = 'default',
  className = ''
}: DeleteTradeButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete the trade from storage
      await deleteTrade(trade.id);
      
      toast.success("Trade deleted successfully");
      setOpen(false);
      
      // Navigate back to the main trades list
      navigate('/');
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast.error("Failed to delete trade");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`${className} text-destructive hover:bg-destructive/10`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Trade
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Trade</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this trade? This action cannot be undone and all trade data, including exit history and notes, will be permanently removed.
            
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p><strong>Trade:</strong> {trade.symbol} {trade.direction === 'long' ? 'Long' : 'Short'}</p>
              <p><strong>Entry Date:</strong> {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Status:</strong> {trade.status}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Trade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
