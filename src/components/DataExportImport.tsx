
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { exportTradesToFile, importTradesFromFile, getLastImportSummary, getLastExportSummary } from '@/utils/dataTransfer';
import { FileDown, FileUp, FileBox, Scissors } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from '@/utils/toast';
import { DataImportSummary } from './DataImportSummary';
import { DataExportSummary } from './DataExportSummary';
import { removeDuplicateReflections } from '@/utils/journalStorage';

interface DataExportImportProps {
  onImportComplete?: () => void;
}

export const DataExportImport = ({ onImportComplete }: DataExportImportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [showExportSummary, setShowExportSummary] = useState(false);
  const [importSummaryData, setImportSummaryData] = useState(getLastImportSummary());
  const [exportSummaryData, setExportSummaryData] = useState(getLastExportSummary());
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleImportComplete = (event: CustomEvent) => {
      if (event.detail?.summaryData) {
        setImportSummaryData(event.detail.summaryData);
        setShowImportSummary(true);
      }
    };
    
    const handleExportComplete = (event: CustomEvent) => {
      if (event.detail?.summaryData) {
        setExportSummaryData(event.detail.summaryData);
        setShowExportSummary(true);
      }
    };
    
    document.addEventListener('import-complete', handleImportComplete as EventListener);
    document.addEventListener('export-complete', handleExportComplete as EventListener);
    
    return () => {
      document.removeEventListener('import-complete', handleImportComplete as EventListener);
      document.removeEventListener('export-complete', handleExportComplete as EventListener);
    };
  }, []);
  
  const handleExport = async () => {
    await exportTradesToFile();
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setIsDialogOpen(true);
    
    try {
      await importTradesFromFile(file);
      if (onImportComplete) {
        onImportComplete();
      }
      
      // Force refresh UI components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Import failed. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Small delay before closing dialog to ensure toasts are visible
      setTimeout(() => {
        setIsDialogOpen(false);
      }, 500);
    }
  };
  
  const handleRemoveDuplicates = () => {
    setIsRemoving(true);
    try {
      const { weeklyRemoved, monthlyRemoved } = removeDuplicateReflections();
      const totalRemoved = weeklyRemoved + monthlyRemoved;
      
      if (totalRemoved > 0) {
        toast.success(`Removed ${totalRemoved} duplicate reflections (${weeklyRemoved} weekly, ${monthlyRemoved} monthly)`);
        // Force refresh UI components
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.info('No duplicate reflections found');
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Failed to remove duplicates');
    } finally {
      setIsRemoving(false);
    }
  };
  
  return (
    <>
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <FileDown className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px]">
              <p>Export trades, ideas, strategies and symbols to a backup file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-1"
              >
                <FileUp className="h-4 w-4" />
                <span>{isImporting ? 'Importing...' : 'Import'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px]">
              <p>Import trades, ideas, strategies and symbols from a backup file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveDuplicates}
                disabled={isRemoving}
                className="flex items-center gap-1"
              >
                <Scissors className="h-4 w-4" />
                <span>{isRemoving ? 'Removing...' : 'Remove Duplicates'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px]">
              <p>Remove duplicate journal entries that may have occurred during import</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.csv"
          className="hidden"
        />
      </div>
      
      <Dialog open={isDialogOpen && isImporting} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importing Data</DialogTitle>
            <DialogDescription>
              Processing your backup file and checking for duplicates...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="animate-pulse flex flex-col items-center">
              <FileBox className="h-16 w-16 text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Importing trades, ideas, strategies and symbols
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <DataImportSummary 
        isOpen={showImportSummary} 
        onClose={() => setShowImportSummary(false)} 
        summaryData={importSummaryData}
      />

      <DataExportSummary
        isOpen={showExportSummary}
        onClose={() => setShowExportSummary(false)}
        summaryData={exportSummaryData}
      />
    </>
  );
};
