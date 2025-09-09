// src/components/import/StagedTransactionsTable.tsx
// Full-featured staged transactions table with inline editing

import React, { useMemo } from 'react';
import { ColDef } from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AgGrid } from '@/components/ag-grid/AgGrid';
import AccountAutocomplete from './AccountAutocomplete';
import TagsEditor from './TagsEditor';
import LLMSuggestionRenderer from './LLMSuggestionRenderer';
import RowActions from './RowActions';
import DescriptionRenderer from './DescriptionRenderer';
import StatusBadge from './StatusBadge';
import type { StagedTransaction } from '@/types/import';

interface StagedTransactionsTableProps {
  transactions: StagedTransaction[];
  onTransactionUpdate: (transactionId: string, updates: Partial<StagedTransaction>) => void;
  onApplySuggestion: (transactionId: string) => void;
  onBulkApplySuggestions: () => void;
  onApproveAll: () => void;
  onBack: () => void;
  uploadFileName: string;
}

export function StagedTransactionsTable({
  transactions,
  onBack,
  onTransactionUpdate,
  onApplySuggestion,
  onBulkApplySuggestions,
  onApproveAll,
  uploadFileName,
}: StagedTransactionsTableProps) {

  // Memoize column definitions to prevent unnecessary re-renders
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Sr No',
      field: 'row_index',
      width: 90,
      pinned: 'left',
      valueGetter: (params: any) =>
        typeof params.data?.row_index === 'number' ? params.data.row_index + 1 : '',
      sort: 'asc',
      sortable: true,
      filter: false,
    },
    {
      headerName: 'Date',
      field: 'parsed_date',
      width: 120,
      valueGetter: (params: any) => {
        const row = params.data || {};
        const iso = row.parsed_date || row.original_date || '';
        return iso || '';
      },
      valueFormatter: (params: any) => {
        const val = params.value;
        if (!val) return '';
        const s = String(val).trim();
        const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
          const [, y, m, d] = isoMatch;
          return `${d}-${m}-${y.slice(-2)}`;
        }
        const dmMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dmMatch) {
          let [ , p1, p2, yRaw ] = dmMatch;
          let day = p1.padStart(2, '0');
          let month = p2.padStart(2, '0');
          let year = yRaw;
          if (yRaw.length === 2) year = `20${yRaw}`;
          return `${day}-${month}-${String(year).slice(-2)}`;
        }
        return s;
      },
      sortable: true,
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'Description',
      field: 'parsed_description',
      flex: 2,
      minWidth: 200,
      // Use React renderer so AG Grid can auto-size rows for multi-line ledger descriptions
      cellRenderer: DescriptionRenderer as any,
      autoHeight: true,
      wrapText: true,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Amount',
      field: 'parsed_amount',
      width: 140,
      valueFormatter: (params: any) => {
        const v = params.value;
        if (v === null || v === undefined || v === '') return '';
        const num = Number(v);
        if (isNaN(num)) return String(v);
        try {
          return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch {
          return num.toFixed(2);
        }
      },
      cellStyle: (params: any) => {
        const v = params.value;
        const num = Number(v);
        const style: Record<string, any> = {
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: '500'
        };
        if (!isNaN(num) && num > 0) {
          style.color = '#16a34a'; // green-600
        } else if (!isNaN(num) && num < 0) {
          style.color = '#dc2626'; // red-600
        }
        return style;
      },
      sortable: true,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Ledger Entry',
      field: 'account',
      minWidth: 240,
      cellRenderer: AccountAutocomplete as any,
      cellRendererParams: {
        onCommit: (params: any, newValue: string) => {
          const id = params.data?.id;
          if (id && typeof onTransactionUpdate === 'function') {
            onTransactionUpdate(id, { account: newValue });
          }
        },
      },
      editable: false, // Handled by custom renderer
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Tags',
      field: 'tags',
      width: 200,
      cellRenderer: TagsEditor as any,
      cellRendererParams: {
        onCommit: (params: any, newValue: string[]) => {
          const id = params.data?.id;
          if (id && typeof onTransactionUpdate === 'function') {
            onTransactionUpdate(id, { tags: newValue });
          }
        },
      },
      editable: false,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Narration',
      field: 'narration',
      width: 180,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 200,
      },
      onCellValueChanged: (params: any) => {
        const id = params.data?.id;
        if (id && typeof onTransactionUpdate === 'function') {
          onTransactionUpdate(id, { narration: params.newValue });
        }
      },
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'LLM Suggestion',
      field: 'suggested_account',
      width: 280,
      cellRenderer: LLMSuggestionRenderer as any,
      cellRendererParams: {
        onApplySuggestion: (params: any) => {
          const id = params.data?.id;
          if (id && typeof onApplySuggestion === 'function') {
            onApplySuggestion(id);
          }
        },
      },
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 130,
      cellRenderer: StatusBadge as any,
      sortable: true,
      filter: 'agSetColumnFilter',
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 80,
      pinned: 'right',
      cellRenderer: RowActions as any,
      cellRendererParams: {
        onApplySuggestion: (params: any) => {
          const id = params.data?.id;
          if (id && typeof onApplySuggestion === 'function') {
            onApplySuggestion(id);
          }
        },
        onRevert: (params: any) => {
          const id = params.data?.id;
          if (id && typeof onTransactionUpdate === 'function') {
            // Revert to original state - this will be implemented in the revert utility
            const original = params.data?.original_data || {};
            onTransactionUpdate(id, {
              account: '',
              tags: [],
              narration: '',
            });
          }
        },
        onViewOriginal: (params: any) => {
          // Show original CSV data in a modal - to be implemented
          console.log('View original:', params.data?.original_data);
        },
        onCreateRule: (params: any) => {
          // Open rule creation modal - to be implemented
          console.log('Create rule from:', params.data);
        },
      },
      sortable: false,
      filter: false,
    },
  ], [onTransactionUpdate, onApplySuggestion]);

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Uploads
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{uploadFileName}</h2>
            <p className="text-sm text-muted-foreground">
              {transactions.length} transactions
            </p>
          </div>
        </div>

      </div>

      {/* Table */}
      <div style={{ height: '600px', width: '100%' }}>
        <AgGrid
          rowData={transactions}
          columnDefs={columnDefs}
          height="600px"
        />
      </div>
    </div>
  );
}
