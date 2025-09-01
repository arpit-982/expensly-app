// src/integrations/supabase/ledger.repo.ts
// Thin repository around Supabase tables. No UI logic; no domain decisions here.

import type { LedgerFile, Posting, Transaction } from '@/types/ledger';
import { supabase } from './client';

// Temporary JSON type until we migrate to a normalized schema
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Table names centralization helps future migrations.
const T = {
  files: 'ledger_files',
  transactions: 'transactions',
  // If you choose a normalized postings table later, add it here.
} as const;

export async function selectFiles(): Promise<LedgerFile[]> {
  const { data, error } = await supabase
    .from(T.files)
    .select('id,name,content,is_primary,created_at,last_updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as LedgerFile[];
}

export async function updateFileContent(file: Pick<LedgerFile, 'id' | 'content'>): Promise<void> {
  const { error } = await supabase
    .from(T.files)
    .update({ content: file.content, last_updated_at: new Date().toISOString() })
    .eq('id', file.id);
  if (error) throw error;
}

export async function deleteFile(fileId: number): Promise<void> {
  const { error } = await supabase.from(T.files).delete().eq('id', fileId);
  if (error) throw error;
}

export async function setPrimaryFile(fileId: number): Promise<void> {
  // 1. Unset all other primary flags
  const { error: unsetError } = await supabase
    .from(T.files)
    .update({ is_primary: false })
    .eq('is_primary', true);
  if (unsetError) throw unsetError;

  // 2. Set the new primary flag
  const { error: setError } = await supabase
    .from(T.files)
    .update({ is_primary: true })
    .eq('id', fileId);
  if (setError) throw setError;
}

export async function selectTransactions(fileId: number): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from(T.transactions)
    .select('*')
    .eq('file_id', fileId)
    .order('date', { ascending: false });

  if (error) throw error;

  // Safely map the database rows to our domain model.
  // This is the boundary where we translate from the DB schema to the app's schema.
  return (data ?? []).map((row) => ({
    ...row,
    postings: (row.postings as unknown as Posting[]) ?? [],
    tags: row.tags ?? [],
    comments: row.comments ?? [],
  }));
}

// Upsert parsed transactions in one go. Replace strategy as needed.
export async function upsertTransactions(fileId: number, txs: Transaction[]): Promise<void> {
  // Example strategy: delete-then-insert for the file scope. Replace with a safer diff later.
  const del = await supabase.from(T.transactions).delete().eq('file_id', fileId);
  if (del.error) throw del.error;

  if (txs.length === 0) return;

  // The `postings` are already in a JSON-compatible format (`Posting[]`),
  // so Supabase's client can handle serialization without an unsafe cast.
  const { error } = await supabase.from(T.transactions).insert(txs);
  if (error) throw error;
}
