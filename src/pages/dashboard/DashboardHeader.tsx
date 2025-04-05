
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataExportImport } from '@/components/DataExportImport';
import { ServerSyncConfig } from '@/components/ServerSyncConfig';

interface DashboardHeaderProps {
  onImportComplete: () => void;
}

export function DashboardHeader({ onImportComplete }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Trading Journal
        </h1>
        <p className="text-muted-foreground">
          Track, analyze and improve your trading performance
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <ServerSyncConfig />
        <DataExportImport onImportComplete={onImportComplete} />
        <Button asChild>
          <Link to="/trade/new">
            <Plus className="mr-1 h-4 w-4" />
            New Trade
          </Link>
        </Button>
      </div>
    </div>
  );
}
