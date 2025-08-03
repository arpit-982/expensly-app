import { Table, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-1 border rounded-md p-1">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="px-3"
      >
        <Table className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('card')}
        className="px-3"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}