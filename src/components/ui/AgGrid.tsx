import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useTheme } from 'next-themes';

interface AgGridProps {
  rowData: any[];
  columnDefs: any[];
  [key: string]: any; // Allow other AG Grid props
}

export function AgGrid({ rowData, columnDefs, ...props }: AgGridProps) {
  const { theme } = useTheme();
  const gridTheme = theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';

  const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true,
  };

  return (
    <div className={gridTheme} style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        {...props}
      />
    </div>
  );
}
