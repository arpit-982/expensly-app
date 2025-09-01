// src/types/ledger.ts
// Authoritative domain types for the app. Keep terminology aligned with plain-text accounting.

export interface Posting {
  account: string;
  amount: number; // > 0 = debit, < 0 = credit
  currency?: string | null;
}

export interface Transaction {
  id: string; // uuid
  file_id: number; // FK -> LedgerFile.id
  date: string; // ISO yyyy-mm-dd
  narration: string; // free-text description
  payee?: string; // optional counterparty
  amount: number; // canonical per-transaction amount
  tags: string[];
  postings: Posting[]; // single source of truth for debits/credits
  comments?: string[];
}

export interface LedgerFile {
  id: number;
  name: string;
  content: string; // canonical .ledger text
  is_primary: boolean;
  created_at: string;
  last_updated_at: string;
}

import { StagedTransaction } from './autotag';

export interface LedgerService {
  getFiles(): Promise<LedgerFile[]>;
  saveFile(file: Pick<LedgerFile, 'id' | 'content'>): Promise<void>;
  deleteFile(fileId: number): Promise<void>;
  setPrimaryFile(fileId: number): Promise<void>;
  parseAndUpsert(fileId: number): Promise<void>;
  listTransactions(fileId: number): Promise<Transaction[]>;
  addTransactions(transactions: StagedTransaction[], fileId: number): Promise<void>;
}
