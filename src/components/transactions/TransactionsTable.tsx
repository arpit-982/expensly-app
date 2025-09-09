import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AgGrid } from '@/components/ag-grid/AgGrid';
import type { Transaction, Posting } from '@/types/ledger';

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

// Comments cell renderer
const CommentsRenderer = ({ value }: ICellRendererParams) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-1">
      {value.map((comment: string, index: number) => (
        <div key={index} className="text-xs text-muted-foreground">
          {comment}
        </div>
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
      hide: true,
    },
    {
      headerName: 'Comments',
      field: 'comments',
      cellRenderer: CommentsRenderer,
      flex: 1,
      autoHeight: true,
    },
  ];

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  return (
    <AgGrid
      rowData={transactions}
      columnDefs={columnDefs}
      pagination={true}
      paginationPageSize={50}
      animateRows={true}
      rowSelection={{ mode: 'multiRow', enableClickSelection: false }}
    />
  );
}
