
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface IdeaFiltersProps {
  statusFilter: string;
  sortBy: string;
  onStatusFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
}

export function IdeaFilters({ 
  statusFilter, 
  sortBy, 
  onStatusFilterChange, 
  onSortByChange 
}: IdeaFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="still valid">Still Valid</SelectItem>
            <SelectItem value="invalidated">Invalidated</SelectItem>
            <SelectItem value="taken">Taken</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sort-by">Sort By</Label>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger id="sort-by" className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date (newest first)</SelectItem>
            <SelectItem value="symbol">Symbol</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
