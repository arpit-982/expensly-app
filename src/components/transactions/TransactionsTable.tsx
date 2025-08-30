import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Transaction, Posting } from '@/types/ledger';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface TransactionsTableProps {
  transactions: Transaction[];
}

function splitPostings(postings: Posting[] = []) {
  const debitAccounts = postings.filter((p) => p.amount > 0).map((p) => p.account);
  const creditAccounts = postings.filter((p) => p.amount < 0).map((p) => p.account);
  return { debitAccounts, creditAccounts };
}

// Amount cell renderer with color coding and currency formatting
const AmountRenderer = ({ value }: ICellRendererParams) => {
  const { formatCurrency } = useCurrency();
  const isNegative = value < 0;
  const colorClass = isNegative ? 'text-destructive' : 'text-emerald-600';

  return <span className={`font-medium ${colorClass}`}>{formatCurrency(value)}</span>;
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const columnDefs: ColDef[] = [
    {
      headerName: 'Date',
      field: 'date',
      sortable: true,
      filter: 'agDateColumnFilter',
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams) => new Date(value).toLocaleDateString(),
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
      field: 'postings',
      valueGetter: ({ data }) => splitPostings((data as Transaction).postings).debitAccounts,
      cellRenderer: AccountsRenderer,
      flex: 1,
      autoHeight: true,
    },
    {
      headerName: 'Credit Accounts',
      field: 'postings',
      valueGetter: ({ data }) => splitPostings((data as Transaction).postings).creditAccounts,
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
    <div
      className="h-full w-full"
      data-ag-theme-mode={isDark ? 'dark' : 'light'}
      style={
        {
          '--ag-background-color': isDark ? 'hsl(var(--background))' : 'hsl(var(--background))',
          '--ag-foreground-color': isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
          '--ag-header-background-color': isDark ? 'hsl(var(--card))' : 'hsl(var(--card))',
          '--ag-header-foreground-color': isDark
            ? 'hsl(var(--card-foreground))'
            : 'hsl(var(--card-foreground))',
          '--ag-border-color': isDark ? 'hsl(var(--border))' : 'hsl(var(--border))',
          '--ag-row-hover-color': isDark ? 'hsl(var(--accent))' : 'hsl(var(--accent))',
          '--ag-selected-row-background-color': isDark
            ? 'hsl(var(--accent))'
            : 'hsl(var(--accent))',
          '--ag-font-family': 'inherit',
          '--ag-font-size': '14px',
          '--ag-grid-size': '6px',
          '--ag-list-item-height': '40px',
        } as React.CSSProperties
      }
    >
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
