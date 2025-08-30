// src/services/ledgerService.ts
// Backend-agnostic service consumed by UI/components.
// Hides Supabase details behind a small repository layer.

import type { LedgerFile, Transaction, LedgerService } from '@/types/ledger';
import {
  selectFiles,
  updateFileContent,
  selectTransactions,
  upsertTransactions,
} from '@/integrations/supabase/ledger.repo';
import { parseLedger } from '@/services/parsing/ledgerParser';

/**
 * Parse raw ledger text into structured transactions.
 * Kept as a separate function so we can swap the implementation later (worker/CLI).
 */
async function parseLedgerTextToTransactions(text: string, fileId: string): Promise<Transaction[]> {
  return parseLedger(text, fileId);
}

export const ledgerService: LedgerService = {
  async getFiles() {
    return selectFiles();
  },

  async saveFile(file) {
    await updateFileContent(file);
  },

  async parseAndUpsert(fileId) {
    // Load the current file content
    const files = await selectFiles();
    const file = files.find((f) => f.id === fileId);
    if (!file) throw new Error('Ledger file not found');

    // Parse into Transaction[]
    const txs = await parseLedgerTextToTransactions(file.content, fileId);

    // Ensure each transaction carries the correct foreign key
    const prepared: Transaction[] = txs.map((t) => ({ ...t, file_id: fileId }));

    // Upsert into the DB (current strategy: delete-then-insert for the file scope)
    await upsertTransactions(fileId, prepared);
  },

  async listTransactions(fileId) {
    return selectTransactions(fileId);
  },
};
