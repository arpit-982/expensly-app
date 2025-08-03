import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Badge } from '@/components/ui/badge';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface TransactionRow {
  id: string;
  date: string;
  narration: string;
  debitAccounts: string[];
  creditAccounts: string[];
  amount: number;
  tags: string[];
}

interface TransactionsTableProps {
  transactions: TransactionRow[];
}

// Amount cell renderer with color coding
const AmountRenderer = ({ value }: ICellRendererParams) => {
  const isNegative = value < 0;
  const colorClass = isNegative ? 'text-destructive' : 'text-emerald-600';
  
  return (
    <span className={`font-medium ${colorClass}`}>
      ${Math.abs(value).toFixed(2)}
    </span>
  );
};

// Accounts cell renderer
const AccountsRenderer = ({ value }: ICellRendererParams) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  
  return (
    <div className="space-y-1">
      {value.map((account: string, index: number) => (
        <div key={index} className="text-sm">
          {account}
        </div>
      ))}
    </div>
  );
};

// Tags cell renderer
const TagsRenderer = ({ value }: ICellRendererParams) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  
  return (
    <div className="flex flex-wrap gap-1">
      {value.map((tag: string, index: number) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const columnDefs: ColDef[] = [
    {
      headerName: 'Date',
      field: 'date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => 
        new Date(value).toLocaleDateString()
    },
    {
      headerName: 'Narration',
      field: 'narration',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 2,
    },
    {
      headerName: 'Debit Accounts',
      field: 'debitAccounts',
      cellRenderer: AccountsRenderer,
      flex: 1,
      autoHeight: true,
    },
    {
      headerName: 'Credit Accounts',
      field: 'creditAccounts',
      cellRenderer: AccountsRenderer,
      flex: 1,
      autoHeight: true,
    },
    {
      headerName: 'Amount',
      field: 'amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: AmountRenderer,
      width: 120,
    },
    {
      headerName: 'Tags',
      field: 'tags',
      cellRenderer: TagsRenderer,
      width: 150,
      autoHeight: true,
    },
  ];

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  return (
    <div className="ag-theme-alpine h-full w-full">
      <AgGridReact
        rowData={transactions}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={50}
        animateRows={true}
        rowSelection="multiple"
        suppressRowClickSelection={true}
      />
    </div>
  );
}