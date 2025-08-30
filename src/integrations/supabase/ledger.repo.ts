// src/integrations/supabase/ledger.repo.ts
// Thin repository around Supabase tables. No UI logic; no domain decisions here.

import type { LedgerFile, Transaction } from '@/types/ledger';

import { supabase } from './client';

// Table names centralization helps future migrations.
const T = {
  files: 'ledger_files',
  transactions: 'transactions',
  // If you choose a normalized postings table later, add it here.
};

export async function selectFiles(): Promise<LedgerFile[]> {
  const { data, error } = await supabase
    .from(T.files)
    .select('id,name,content,is_primary,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as LedgerFile[];
}

export async function updateFileContent(file: Pick<LedgerFile, 'id' | 'content'>): Promise<void> {
  const { error } = await supabase
    .from(T.files)
    .update({ content: file.content, updated_at: new Date().toISOString() })
    .eq('id', file.id);
  if (error) throw error;
}

export async function selectTransactions(fileId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from(T.transactions)
    .select('*')
    .eq('file_id', fileId)
    .order('date', { ascending: false });

  if (error) throw error;
  // Expecting postings as JSONB in each row per refactor plan.
  return (data ?? []) as Transaction[];
}

// Upsert parsed transactions in one go. Replace strategy as needed.
export async function upsertTransactions(fileId: string, txs: Transaction[]): Promise<void> {
  // Example strategy: delete-then-insert for the file scope. Replace with a safer diff later.
  const del = await supabase.from(T.transactions).delete().eq('file_id', fileId);
  if (del.error) throw del.error;

  if (txs.length === 0) return;

  const { error } = await supabase.from(T.transactions).insert(txs);
  if (error) throw error;
}
