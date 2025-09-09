// src/components/import/CsvUploadsTable.tsx
// Updated to use the shared AgGrid wrapper

import React from 'react';
import { ColDef } from 'ag-grid-community';
import { AgGrid } from '@/components/ag-grid/AgGrid';
import type { CsvUpload } from '@/types/import';

interface CsvUploadsTableProps {
  uploads: CsvUpload[];
  onViewTransactions: (uploadId: string) => void;
  onDeleteUpload: (uploadId: string) => void;
  onExportUpload: (uploadId: string) => void;
}

export function CsvUploadsTable({
  uploads,
  onViewTransactions,
  onDeleteUpload,
  onExportUpload
}: CsvUploadsTableProps) {
  const columnDefs: ColDef[] = [
    {
      headerName: 'File Name',
      field: 'original_file_name',
      flex: 2,
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
    },
    {
      headerName: 'Total Transactions',
      field: 'total_transactions',
      width: 150,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">CSV Uploads</h2>
        <div className="text-sm text-muted-foreground">
          {uploads.length} upload{uploads.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div style={{ height: '400px', width: '100%' }}>
        <AgGrid
          rowData={uploads}
          columnDefs={columnDefs}
          onRowClicked={(event: any) => {
            if (event?.data) {
              onViewTransactions(event.data.id);
            }
          }}
          height="400px"
        />
      </div>
    </div>
  );
}
