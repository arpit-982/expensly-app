import React from 'react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { DataGrid } from '@/components/ag-grid/DataGrid';
import { sampleTransactions } from '@/data/sampleTransactions';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Posting } from '@/types/ledger';

function splitPostings(postings: Posting[] = []) {
  const debitAccounts = postings.filter((p) => p.amount > 0).map((p) => p.account);
  const creditAccounts = postings.filter((p) => p.amount < 0).map((p) => p.account);
  return { debitAccounts, creditAccounts };
}

const AmountRenderer = ({ value }: ICellRendererParams) => {
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const isNegative = value < 0;
  const colorClass = isNegative ? 'text-destructive' : 'text-emerald-600';
  return <span className={`font-medium ${colorClass}`}>{formatter.format(value)}</span>;
};

const AccountsRenderer = ({ value }: ICellRendererParams) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-1">
      {value.map((account: string, idx: number) => (
        <div key={idx} className="text-sm">
          {account}
        </div>
      ))}
    </div>
  );
};

const TagsRenderer = ({ value }: ICellRendererParams) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {value.map((tag: string, idx: number) => (
        <Badge key={idx} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default function AgGridTest() {
  const columns: ColDef[] = [
    { headerName: 'Date', field: 'date', width: 130, cellRenderer: ({ value }: ICellRendererParams) => new Date(value).toLocaleDateString() },
    { headerName: 'Narration', field: 'narration', flex: 2 },
    { headerName: 'Payee', field: 'payee', width: 180 },
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
    { headerName: 'Amount', field: 'amount', width: 140, cellRenderer: AmountRenderer },
    { headerName: 'Tags', field: 'tags', width: 220, cellRenderer: TagsRenderer, autoHeight: true },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">DataGrid — Test (client-mode)</h1>
        <p className="text-muted-foreground mt-1">
          Verifies the global DataGrid wrapper and AG Grid theme using local sample data ({sampleTransactions.length} rows).
        </p>
      </div>

      <div className="rounded-md border p-4">
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            columns={columns}
            data={sampleTransactions}
            rowKey="id"
            selection="multiple"
            height="600px"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          Open <code>/ag-grid-test</code> (no route added; open file directly while developing) to view this test.
        </p>
        <p className="mt-2">
          If theme appears broken, confirm [`src/index.css`](src/index.css:1) includes Quartz theme imports and that the wrapper applies the <code>ag-theme-quartz</code> class.
        </p>
      </div>
    </div>
  );
}
