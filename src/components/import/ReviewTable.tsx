import React from 'react';
import { AgGrid } from '@/components/ag-grid/AgGrid';
import { StagedTransaction } from '@/types/autotag';

interface ReviewTableProps {
  stagedTransactions: StagedTransaction[];
  onCellValueChanged: (params: any) => void;
}

/**
 * ReviewTable component
 * 
 * This component displays the staged transactions in a table and allows the user to edit them.
 * It uses the AgGrid component to render the table.
 * 
 * @param stagedTransactions - An array of staged transactions to display.
 * @param onCellValueChanged - A callback function that is called when a cell value is changed.
 */
const ReviewTable: React.FC<ReviewTableProps> = ({ stagedTransactions, onCellValueChanged }) => {
  const columnDefs = [
    { headerName: 'Date', field: 'date', editable: true },
    { headerName: 'Description', field: 'description', editable: true },
    { headerName: 'Amount', field: 'amount', editable: true },
    { headerName: 'Account', field: 'account', editable: true },
    { headerName: 'Suggested Account', field: 'suggestedAccount', editable: false },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Review Transactions</h2>
      <AgGrid
        rowData={stagedTransactions}
        columnDefs={columnDefs}
        onCellValueChanged={onCellValueChanged}
      />
    </div>
  );
};

export default ReviewTable;
