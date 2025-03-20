
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { exportTradesToFile, importTradesFromFile } from '@/utils/dataTransfer';
import { FileDown, FileUp, ListChecks, FileBox } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataExportImportProps {
  onImportComplete?: () => void;
}

export const DataExportImport = ({ onImportComplete }: DataExportImportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleExport = () => {
    exportTradesToFile();
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
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
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
    </>
  );
};
