// src/types/ledger.ts
// Authoritative domain types for the app. Keep terminology aligned with plain-text accounting.

export interface Posting {
  account: string;
  amount: number; // > 0 = debit, < 0 = credit
  currency?: string | null;
}

export interface Transaction {
  id: string; // uuid
  file_id: string; // FK -> LedgerFile.id
  date: string; // ISO yyyy-mm-dd
  narration: string; // free-text description
  payee?: string; // optional counterparty
  amount: number; // canonical per-transaction amount
  tags: string[];
  postings: Posting[]; // single source of truth for debits/credits
}

export interface LedgerFile {
  id: string;
  name: string;
  content: string; // canonical .ledger text
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface LedgerService {
  getFiles(): Promise<LedgerFile[]>;
  saveFile(file: Pick<LedgerFile, 'id' | 'content'>): Promise<void>;
  parseAndUpsert(fileId: string): Promise<void>;
  listTransactions(fileId: string): Promise<Transaction[]>;
}
