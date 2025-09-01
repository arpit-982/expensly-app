import React, { useState } from 'react';
import CsvUploader from '@/components/import/CsvUploader';
import ReviewTable from '@/components/import/ReviewTable';
import { Button } from '@/components/ui/button';
import { StagedTransaction } from '@/types/autotag';
import { parseCsvAndGetSuggestions } from '@/services/importService';
import { ledgerService } from '@/services/ledgerService';

/**
 * Import page
 * 
 * This page orchestrates the entire CSV import process. It consists of two main components:
 * 1. CsvUploader: for uploading the CSV file
 * 2. ReviewTable: for reviewing and editing the staged transactions
 * 
 * The page manages the state of the staged transactions and handles the communication
 * with the autoTagService and ledgerService.
 */
const ImportPage: React.FC = () => {
  const [stagedTransactions, setStagedTransactions] = useState<StagedTransaction[]>([]);

  /**
   * Handles the file upload from the CsvUploader component.
   * It calls the autoTagService to get the LLM suggestions for the uploaded transactions.
   * 
   * @param file - The uploaded CSV file.
   */
  const handleUpload = async (file: File) => {
    const results = await parseCsvAndGetSuggestions(file);
    setStagedTransactions(results);
  };

  /**
   * Handles the cell value changes from the ReviewTable component.
   * It updates the stagedTransactions state with the new values.
   * 
   * @param params - The parameters from the AgGrid cellValueChanged event.
   */
  const handleCellValueChanged = (params: any) => {
    const { data, colDef, newValue } = params;
    const updatedTransactions = stagedTransactions.map((txn) =>
      txn === data ? { ...txn, [colDef.field]: newValue } : txn
    );
    setStagedTransactions(updatedTransactions);
  };

  /**
   * Handles the export of the staged transactions.
   * It calls the ledgerService to add the transactions to the ledger.
   */
  const handleExport = () => {
    // TODO: Get the fileId from a file selector
    ledgerService.addTransactions(stagedTransactions, 1);
    // Optionally, clear the staged transactions after export
    setStagedTransactions([]);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Import Transactions</h1>
      <div className="mb-4">
        <CsvUploader onUpload={handleUpload} />
      </div>
      {stagedTransactions.length > 0 && (
        <div>
          <ReviewTable
            stagedTransactions={stagedTransactions}
            onCellValueChanged={handleCellValueChanged}
          />
          <Button onClick={handleExport} className="mt-4">
            Export to Ledger
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
