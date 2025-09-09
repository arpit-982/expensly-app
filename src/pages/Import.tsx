// src/pages/Import.tsx
// Updated Import page with two-table CSV workflow

import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { CsvUploadsTable } from '@/components/import/CsvUploadsTable';
import { StagedTransactionsTable } from '@/components/import/StagedTransactionsTable';
import CsvUploader from '@/components/import/CsvUploader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  getCsvUploads, 
  getImportSession, 
  processCsvFile, 
  deleteCsvUploadWithTransactions,
  updateTransactionTagging,
  applySuggestionToTransaction,
  approveTransactionsForExport,
  exportToLedgerFormat
} from '@/services/importService';
import { ledgerService } from '@/services/ledgerService';
import type { CsvUpload, StagedTransaction, ImportSession, MappingObject } from '@/types/import';

type ViewMode = 'uploads' | 'transactions';

const ImportPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('uploads');
  const [uploads, setUploads] = useState<CsvUpload[]>([]);
  const [currentSession, setCurrentSession] = useState<ImportSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const data = await getCsvUploads();
      setUploads(data);
    } catch (error) {
      console.error('Failed to load uploads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load CSV uploads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, mapping?: MappingObject) => {
    try {
      setProcessing(true);
      toast({
        title: 'Processing CSV',
        description: `Uploading and processing ${file.name}...`,
      });

      // If a mapping was provided (from Mapping Modal), pass it into processing.
      if (mapping) {
        await processCsvFile(file, mapping);
      } else {
        await processCsvFile(file);
      }
      
      toast({
        title: 'Success',
        description: 'CSV file processed successfully with LLM suggestions',
      });

      // Reload uploads to show the new one
      await loadUploads();

      // If mapping drove immediate navigation, open the transactions view for the new upload
      // Find the newly inserted upload by matching original_file_name and recent timestamp
      const uploadsAfter = await getCsvUploads();
      const created = uploadsAfter.find(u => u.original_file_name === file.name);
      if (created) {
        // navigate to staged transactions for the created upload
        await handleViewTransactions(created.id);
      }
    } catch (error) {
      console.error('Failed to process CSV:', error);
      toast({
        title: 'Error',
        description: `Failed to process CSV: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewTransactions = async (uploadId: string) => {
    try {
      setLoading(true);
      const session = await getImportSession(uploadId);
      if (session) {
        setCurrentSession(session);
        setViewMode('transactions');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load transaction data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      await deleteCsvUploadWithTransactions(uploadId);
      toast({
        title: 'Success',
        description: 'CSV upload deleted successfully',
      });
      await loadUploads();
    } catch (error) {
      console.error('Failed to delete upload:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete upload',
        variant: 'destructive',
      });
    }
  };

  const handleExportUpload = async (uploadId: string) => {
    try {
      const ledgerText = await exportToLedgerFormat(uploadId);
      
      // Create and download file
      const blob = new Blob([ledgerText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${uploadId.slice(0, 8)}.ledger`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Ledger file exported successfully',
      });
    } catch (error) {
      console.error('Failed to export:', error);
      toast({
        title: 'Error',
        description: 'Failed to export ledger file',
        variant: 'destructive',
      });
    }
  };

  const handleTransactionUpdate = async (transactionId: string, updates: Partial<StagedTransaction>) => {
    try {
      await updateTransactionTagging(transactionId, updates);
      
      // Update local state
      if (currentSession) {
        const updatedTransactions = currentSession.transactions.map(t =>
          t.id === transactionId ? { ...t, ...updates, status: 'manually-tagged' as const } : t
        );
        setCurrentSession({
          ...currentSession,
          transactions: updatedTransactions,
        });
      }

      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      });
    }
  };

  const handleApplySuggestion = async (transactionId: string) => {
    try {
      const updatedTransaction = await applySuggestionToTransaction(transactionId);
      
      // Update local state
      if (currentSession) {
        const updatedTransactions = currentSession.transactions.map(t =>
          t.id === transactionId ? updatedTransaction : t
        );
        setCurrentSession({
          ...currentSession,
          transactions: updatedTransactions,
        });
      }

      toast({
        title: 'Success',
        description: 'AI suggestions applied successfully',
      });
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply AI suggestions',
        variant: 'destructive',
      });
    }
  };

  const handleBulkApplySuggestions = async () => {
    if (!currentSession) return;

    try {
      const pendingTransactions = currentSession.transactions.filter(t => t.status === 'pending');
      
      for (const transaction of pendingTransactions) {
        await applySuggestionToTransaction(transaction.id);
      }

      // Reload the session to get updated data
      await handleViewTransactions(currentSession.upload.id);

      toast({
        title: 'Success',
        description: `Applied suggestions to ${pendingTransactions.length} transactions`,
      });
    } catch (error) {
      console.error('Failed to apply bulk suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply bulk suggestions',
        variant: 'destructive',
      });
    }
  };

  const handleApproveAll = async () => {
    if (!currentSession) return;

    try {
      await approveTransactionsForExport(currentSession.upload.id);
      
      // Reload the session to get updated data
      await handleViewTransactions(currentSession.upload.id);
      
      // Also reload uploads to update status
      await loadUploads();

      toast({
        title: 'Success',
        description: 'All transactions approved for export',
      });
    } catch (error) {
      console.error('Failed to approve transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve transactions',
        variant: 'destructive',
      });
    }
  };

  const handleBackToUploads = () => {
    setViewMode('uploads');
    setCurrentSession(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileSpreadsheet className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Import Transactions</h1>
            <p className="text-muted-foreground">
              {viewMode === 'uploads' 
                ? 'Upload and manage CSV files with AI-assisted categorization'
                : 'Review and tag transactions before exporting to ledger format'
              }
            </p>
          </div>
        </div>
      </div>

      {viewMode === 'uploads' ? (
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Upload CSV File</h3>
                <p className="text-muted-foreground">
                  Drag and drop your CSV file or click to browse
                </p>
              </div>
              <CsvUploader onUpload={handleFileUpload} />
              {processing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing CSV with AI suggestions...
                </div>
              )}
            </div>
          </div>

          {/* Uploads Table */}
          <CsvUploadsTable
            uploads={uploads}
            onViewTransactions={handleViewTransactions}
            onDeleteUpload={handleDeleteUpload}
            onExportUpload={handleExportUpload}
          />
        </div>
      ) : (
        currentSession && (
          <StagedTransactionsTable
            transactions={currentSession.transactions}
            onTransactionUpdate={handleTransactionUpdate}
            onApplySuggestion={handleApplySuggestion}
            onBulkApplySuggestions={handleBulkApplySuggestions}
            onApproveAll={handleApproveAll}
            onBack={handleBackToUploads}
            uploadFileName={currentSession.upload.original_file_name}
          />
        )
      )}
    </div>
  );
};

export default ImportPage;
