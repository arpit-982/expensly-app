// src/services/ledgerService.ts
// Backend-agnostic service consumed by UI/components.
// Hides Supabase details behind a small repository layer.

import type { LedgerFile, Transaction, LedgerService } from '@/types/ledger';
import { StagedTransaction } from '@/types/autotag';
import {
  selectFiles,
  updateFileContent,
  deleteFile as deleteFileRepo,
  setPrimaryFile as setPrimaryFileRepo,
  selectTransactions,
  upsertTransactions,
} from '@/integrations/supabase/ledger.repo';
import { parseLedger } from '@/services/parsing/ledgerParser';
import { Transaction as LedgerTransaction } from '@/types/ledger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse raw ledger text into structured transactions.
 * Kept as a separate function so we can swap the implementation later (worker/CLI).
 */
async function parseLedgerTextToTransactions(text: string, fileId: number): Promise<Transaction[]> {
  return parseLedger(text, fileId.toString());
}

export const ledgerService: LedgerService = {
  async getFiles() {
    return selectFiles();
  },

  async saveFile(file) {
    await updateFileContent(file);
  },

  async deleteFile(fileId: number) {
    await deleteFileRepo(fileId);
  },

  async setPrimaryFile(fileId: number) {
    await setPrimaryFileRepo(fileId);
  },

  async parseAndUpsert(fileId: number) {
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

  async listTransactions(fileId: number) {
    return selectTransactions(fileId);
  },

  async addTransactions(transactions: StagedTransaction[], fileId: number) {
    const prepared: LedgerTransaction[] = transactions.map((t) => ({
      id: uuidv4(),
      file_id: fileId,
      date: t.date,
      narration: t.description,
      amount: t.amount,
      tags: [],
      postings: [
        { account: t.account, amount: t.amount },
        { account: t.suggestedAccount, amount: -t.amount },
      ],
    }));
    await upsertTransactions(fileId, prepared);
  }
};
