import { ColDef } from 'ag-grid-community';
import { AgGrid } from '@/components/ag-grid/AgGrid';

interface DataGridProps {
  columns: ColDef[];
  rowKey?: string | ((row: any) => string | number);
  data?: any[];
  serverSide?: any; // server-side contract to be implemented later
  selection?: 'none' | 'single' | 'multiple';
  className?: string;
  height?: string | number;
  width?: string | number;
  [key: string]: any;
}

export function DataGrid({
  columns,
  rowKey = 'id',
  data = [],
  selection = 'none',
  className,
  height = '100%',
  width = '100%',
  ...props
}: DataGridProps) {
  // map selection to ag-grid accepted literals ('single' | 'multiple' | undefined)
  const rowSelection = selection === 'multiple' ? 'multiple' : selection === 'single' ? 'single' : undefined;

  return (
    <div style={{ height, width }} className={className}>
      <AgGrid
        rowData={data}
        columnDefs={columns}
        rowSelection={rowSelection}
        height={height}
        width={width}
        {...props}
      />
    </div>
  );
}
