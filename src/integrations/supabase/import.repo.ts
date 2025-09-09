// src/integrations/supabase/import.repo.ts
// Repository for CSV import workflow - follows project patterns

import type { CsvUpload, StagedTransaction } from '@/types/import';
import { supabase } from './client';

// Table names centralization
const T = {
  csvUploads: 'csv_uploads',
  stagedTransactions: 'staged_transactions',
} as const;

// CSV Uploads operations
export async function selectCsvUploads(): Promise<CsvUpload[]> {
  const { data, error } = await supabase
    .from(T.csvUploads)
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data as CsvUpload[];
}

export async function selectCsvUpload(id: string): Promise<CsvUpload | null> {
  const { data, error } = await supabase
    .from(T.csvUploads)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as CsvUpload;
}

export async function insertCsvUpload(upload: Omit<CsvUpload, 'id' | 'uploaded_at' | 'total_transactions' | 'pending_count' | 'auto_tagged_count' | 'manually_tagged_count' | 'reviewed_count'>): Promise<CsvUpload> {
  const { data, error } = await supabase
    .from(T.csvUploads)
    .insert({
      file_name: upload.file_name,
      original_file_name: upload.original_file_name,
      file_size: upload.file_size,
      status: upload.status,
      created_by: upload.created_by,
      notes: upload.notes,
      metadata: upload.metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CsvUpload;
}

export async function updateCsvUploadStatus(id: string, status: CsvUpload['status'], notes?: string): Promise<void> {
  const { error } = await supabase
    .from(T.csvUploads)
    .update({ status, notes })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCsvUpload(id: string): Promise<void> {
  const { error } = await supabase
    .from(T.csvUploads)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Staged Transactions operations
export async function selectStagedTransactions(csvUploadId: string): Promise<StagedTransaction[]> {
  const { data, error } = await supabase
    .from(T.stagedTransactions)
    .select('*')
    .eq('csv_upload_id', csvUploadId)
    .order('row_index', { ascending: true });

  if (error) throw error;
  return data as StagedTransaction[];
}

export async function insertStagedTransactions(transactions: Omit<StagedTransaction, 'id' | 'created_at' | 'updated_at'>[]): Promise<StagedTransaction[]> {
  const { data, error } = await supabase
    .from(T.stagedTransactions)
    .insert(transactions)
    .select();

  if (error) throw error;
  return data as StagedTransaction[];
}

export async function updateStagedTransaction(id: string, updates: Partial<StagedTransaction>): Promise<StagedTransaction> {
  const { data, error } = await supabase
    .from(T.stagedTransactions)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as StagedTransaction;
}

export async function applySuggestionsToTransaction(id: string): Promise<StagedTransaction> {
  // Get current transaction with suggestions
  const { data: transaction, error: selectError } = await supabase
    .from(T.stagedTransactions)
    .select('*')
    .eq('id', id)
    .single();

  if (selectError) throw selectError;

  // Apply suggestions to actual fields
  const updates: Partial<StagedTransaction> = {
    account: transaction.suggested_account || transaction.account,
    counter_account: transaction.suggested_counter_account || transaction.counter_account,
    tags: transaction.suggested_tags?.length > 0 ? transaction.suggested_tags : transaction.tags,
    narration: transaction.suggested_narration || transaction.narration,
    status: 'auto-tagged' as const,
  };

  return updateStagedTransaction(id, updates);
}

export async function upsertStagedTransactionsBulk(csvUploadId: string, transactions: Omit<StagedTransaction, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  // Delete existing transactions for this upload
  const { error: deleteError } = await supabase
    .from(T.stagedTransactions)
    .delete()
    .eq('csv_upload_id', csvUploadId);

  if (deleteError) throw deleteError;

  // Insert new transactions
  if (transactions.length > 0) {
    const { error: insertError } = await supabase
      .from(T.stagedTransactions)
      .insert(transactions);

    if (insertError) throw insertError;
  }
}

export async function deleteStagedTransactions(csvUploadId: string): Promise<void> {
  const { error } = await supabase
    .from(T.stagedTransactions)
    .delete()
    .eq('csv_upload_id', csvUploadId);

  if (error) throw error;
}
