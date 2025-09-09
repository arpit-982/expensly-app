import { AgGridReact } from 'ag-grid-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface AgGridProps {
  rowData: any[];
  columnDefs: any[];
  className?: string;
  height?: string | number;
  width?: string | number;
  loading?: boolean;
  [key: string]: any; // Allow other AG Grid props
}

export function AgGrid({
  rowData,
  columnDefs,
  className,
  height = '100%',
  width = '100%',
  loading = false,
  ...props
}: AgGridProps) {
  // Use resolvedTheme to correctly detect dark/light when ThemeProvider uses "system"
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: false,
  };

  // keep the options flexible for now; cast when spreading to avoid strict prop-type errors
  const defaultGridOptions: any = {
    pagination: true,
    paginationPageSize: 50,
    animateRows: true,
    suppressCellFocus: true,
    // ag-grid-react accepts 'single' | 'multiple' for rowSelection
    rowSelection: 'multiple',
    // overlay components can be provided via grid API; include minimal placeholders
    loadingOverlayComponent: () => <div className="p-4 text-center">Loading...</div>,
    noRowsOverlayComponent: () => <div className="p-4 text-center text-muted-foreground">No data available</div>,
  };

  const baseGridClass = 'ag-theme-quartz';

  return (
    <div className={cn('rounded-md', className)} style={{ height, width }}>
      <div
        className={cn(
          baseGridClass,
          currentTheme === 'dark' ? 'ag-theme-quartz-dark' : '',
          'h-full w-full border border-border/30 rounded-md shadow-sm'
        )}
        data-grid-theme={currentTheme}
        style={{ height: '100%', width: '100%' }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          {...defaultGridOptions}
          {...props}
        />
      </div>
    </div>
  );
}
