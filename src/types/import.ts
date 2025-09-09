// Types for CSV import workflow

export interface CsvUpload {
  id: string;
  file_name: string;
  original_file_name: string;
  file_size: number;
  uploaded_at: string;
  status: 'uploaded' | 'processing' | 'staged' | 'approved' | 'rejected';
  total_transactions: number;
  pending_count: number;
  auto_tagged_count: number;
  manually_tagged_count: number;
  reviewed_count: number;
  created_by?: string;
  notes?: string;
  metadata: Record<string, any>;
}

export interface StagedTransaction {
  id: string;
  csv_upload_id: string;
  row_index: number;
  
  // Original CSV data
  original_date: string;
  original_amount: string;
  original_description: string;
  original_data: Record<string, any>;
  
  // Parsed/normalized data
  parsed_date?: string;
  parsed_amount?: number;
  parsed_description?: string;
  currency: string;
  
  // Manual tagging fields
  account?: string;
  counter_account?: string;
  tags: string[];
  narration?: string;
  
  // LLM suggestions
  suggested_account?: string;
  suggested_counter_account?: string;
  suggested_tags: string[];
  suggested_narration?: string;
  
  // State tracking
  status: 'pending' | 'auto-tagged' | 'manually-tagged' | 'reviewed' | 'approved';
  confidence?: number;
  
  // Metadata
  fingerprint?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportSession {
  upload: CsvUpload;
  transactions: StagedTransaction[];
}

// For the review process
export interface TransactionUpdate {
  id: string;
  account?: string;
  counter_account?: string;
  tags?: string[];
  narration?: string;
  status?: StagedTransaction['status'];
}

// For bulk operations
export interface BulkTaggingRule {
  id: string;
  name: string;
  conditions: {
    field: 'description' | 'amount' | 'date';
    operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';
    value: string | number;
  }[];
  actions: {
    account?: string;
    counter_account?: string;
    tags?: string[];
    narration?: string;
  };
  priority: number;
  enabled: boolean;
}

// Column mapping types for CSV import (added for Column-Mapping MVP)
export type CanonicalField =
  | 'date'
  | 'amount'
  | 'narration'
  | 'balance'
  | 'debit'
  | 'credit'
  | 'reference'
  | 'transaction_id';

export interface DetectedField {
  header: string;
  confidence: number; // 0..1
  transform?: string; // e.g., 'combine_debit_credit' | 'signed_amount' | 'date_format:DD/MM/YYYY'
}

export interface MappingObject {
  mapping: Partial<Record<CanonicalField, DetectedField | null>>;
  fingerprintColumns: string[];
  visibleColumns: string[];
  metadata?: { fundingAccount?: string; name?: string };
}

export interface MappingRequest {
  headers: string[];
  sampleRows?: string[][];
  fileName?: string;
}

export interface MappingResponse {
  mapping: MappingObject;
  errors?: string[];
}
