// src/services/importService.ts
// Service layer for CSV import workflow - follows project patterns

import type { CsvUpload, StagedTransaction, ImportSession, MappingObject } from '@/types/import';
import type { AutoTagInput } from '@/types/autotag';
import {
  selectCsvUploads,
  selectCsvUpload,
  insertCsvUpload,
  updateCsvUploadStatus,
  deleteCsvUpload,
  selectStagedTransactions,
  insertStagedTransactions,
  updateStagedTransaction,
  applySuggestionsToTransaction,
  upsertStagedTransactionsBulk,
  deleteStagedTransactions
} from '@/integrations/supabase/import.repo';
import { enrichWithAutoTags } from './autoTagService';
import { generateFingerprint } from '@/lib/fingerprint';
import Papa from 'papaparse';

// CSV Upload Management
export async function getCsvUploads(): Promise<CsvUpload[]> {
  return selectCsvUploads();
}

export async function getCsvUpload(id: string): Promise<CsvUpload | null> {
  return selectCsvUpload(id);
}

export async function getImportSession(csvUploadId: string): Promise<ImportSession | null> {
  const upload = await selectCsvUpload(csvUploadId);
  if (!upload) return null;

  const transactions = await selectStagedTransactions(csvUploadId);
  return { upload, transactions };
}

export async function deleteCsvUploadWithTransactions(id: string): Promise<void> {
  await deleteStagedTransactions(id);
  await deleteCsvUpload(id);
}

// CSV Processing
/**
 * Apply a user-provided mapping to parsed CSV rows. Produces canonical keys:
 * - Date -> out.Date
 * - Narration -> out.Description
 * - Amount derived from Debit/Credit -> out.Amount
 */
function applyMappingToRows(mapping: MappingObject, rows: any[]): any[] {
  const map = mapping.mapping || {};
  const dateHeader = map['date']?.header;
  const narrationHeader = map['narration']?.header;
  const debitHeader = map['debit']?.header;
  const creditHeader = map['credit']?.header;
  const balanceHeader = map['balance']?.header;

  return rows.map((row) => {
    const out: Record<string, any> = { ...row };
    // Date
    if (dateHeader && row[dateHeader] !== undefined) {
      out.Date = row[dateHeader];
    }
    // Narration / description
    if (narrationHeader && row[narrationHeader] !== undefined) {
      out.Description = row[narrationHeader];
    }
    // Amount derived from debit/credit columns if present
    if (debitHeader || creditHeader) {
      const debitVal = debitHeader ? row[debitHeader] : '';
      const creditVal = creditHeader ? row[creditHeader] : '';
      const dnum = parseAmount(debitVal || '');
      const cnum = parseAmount(creditVal || '');
      if (dnum !== 0) out.Amount = -Math.abs(dnum);
      else if (cnum !== 0) out.Amount = Math.abs(cnum);
      else out.Amount = row.Amount ?? row.amount ?? '';
    } else {
      // Fallback: try existing Amount/amount fields
      out.Amount = row.Amount ?? row.amount ?? '';
    }

    // Balance passthrough
    if (balanceHeader && row[balanceHeader] !== undefined) {
      out.Balance = row[balanceHeader];
    }

    return out;
  });
}

/**
 * Process CSV file. Optional `mapping` can be supplied (from Mapping Modal)
 * to influence how columns are interpreted before staged transactions are created.
 */
export async function processCsvFile(file: File, mapping?: MappingObject): Promise<CsvUpload> {
  // Create CSV upload record
  const csvUpload = await insertCsvUpload({
    file_name: `${Date.now()}_${file.name}`,
    original_file_name: file.name,
    file_size: file.size,
    status: 'processing',
    metadata: {},
  });

  try {
    // Parse CSV file
    const parsedData = await parseCsvFile(file);

    // If mapping provided, transform parsedData into canonical keys
    const dataToUse = mapping ? applyMappingToRows(mapping, parsedData) : parsedData;
    
    // Create staged transactions
    const stagedTransactions = await createStagedTransactionsFromCsv(
      csvUpload.id,
      dataToUse
    );

    // Apply LLM suggestions
    await applySuggestionsToStagedTransactions(stagedTransactions);

    // Update status to staged
    await updateCsvUploadStatus(csvUpload.id, 'staged');

    return csvUpload;
  } catch (error) {
    // Update status to failed and re-throw
    await updateCsvUploadStatus(csvUpload.id, 'rejected', `Processing failed: ${error}`);
    throw error;
  }
}

async function parseCsvFile(file: File): Promise<any[]> {
  // Explicitly preserve row order from PapaParse and attach a stable row index
  // so downstream processing can rely on the original CSV ordering.
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }
        // Attach __rowIndex to make ordering explicit and immutable through transformations
        const ordered = (results.data as any[]).map((row, idx) => ({
          ...row,
          __rowIndex: idx,
        }));
        resolve(ordered);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

async function createStagedTransactionsFromCsv(
  csvUploadId: string,
  csvData: any[]
): Promise<StagedTransaction[]> {
  // Use explicit row index if provided by the parser (ensures order stays consistent)
  const transactions: Omit<StagedTransaction, 'id' | 'created_at' | 'updated_at'>[] = csvData.map((row, index) => {
    // Prefer explicit parser-provided index, fallback to current map index
    const rowIndex = typeof row?.__rowIndex === 'number' ? row.__rowIndex : index;

    // Parse date - handle various formats
    const parsedDate = parseDate(row.Date || row.date);
    
    // Parse amount - handle various formats
    const parsedAmount = parseAmount(row.Amount || row.amount);
    
    // Clean description
    const description = (row.Description || row.description || '').toString().trim();

    // Keep original data but avoid storing internal helper fields
    const originalData = { ...row };
    if (Object.prototype.hasOwnProperty.call(originalData, '__rowIndex')) {
      delete originalData.__rowIndex;
    }

    return {
      csv_upload_id: csvUploadId,
      row_index: rowIndex,
      
      // Original CSV data
      original_date: row.Date || row.date || '',
      original_amount: row.Amount || row.amount || '',
      original_description: description,
      original_data: originalData,
      
      // Parsed/normalized data
      parsed_date: parsedDate,
      parsed_amount: parsedAmount,
      parsed_description: description,
      currency: 'INR', // Default currency
      
      // Initialize empty fields
      tags: [],
      suggested_tags: [],
      
      // State
      status: 'pending',
      fingerprint: generateFingerprint({ rawNarration: description, amount: parsedAmount }),
    };
  });

  // Insert staged transactions - retrieval sorts by row_index ascending to preserve ordering
  return insertStagedTransactions(transactions);
}

function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const sRaw = String(dateStr).trim();
  if (!sRaw) return undefined;
  const s = sRaw;

  // Helper to return YYYY-MM-DD using UTC to avoid local timezone shifts
  const toISODateFromPartsUTC = (y: number, monthOneBased: number, day: number) => {
    const utc = Date.UTC(y, monthOneBased - 1, day);
    const d = new Date(utc);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split('T')[0];
  };

  // 1) Explicit year-first formats: YYYY[-/.\/]M[-/.\/]D
  let m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    const parsed = toISODateFromPartsUTC(y, mo, d);
    if (parsed) return parsed;
  }

  // 2) Day/Month/Year or Month/Day/Year (ambiguous). Also accept 2-digit years.
  m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (m) {
    let p1 = Number(m[1]), p2 = Number(m[2]), yRaw = m[3];
    let year = Number(yRaw);
    if (yRaw.length === 2) {
      // two-digit year: interpret as 2000+YY
      year = 2000 + year;
    }

    let day: number, month: number;
    if (p1 > 12 && p2 <= 12) {
      // clearly day-month-year
      day = p1; month = p2;
    } else if (p2 > 12 && p1 <= 12) {
      // clearly month-day-year
      day = p2; month = p1;
    } else {
      // ambiguous (both <=12) - prefer day-first (DD-MM-YYYY) for financial CSVs
      day = p1; month = p2;
    }

    const parsed = toISODateFromPartsUTC(year, month, day);
    if (parsed) return parsed;
  }

  // 3) Textual month names (e.g., "25 Oct 2023") - use native parsing but convert to UTC ISO date without local shift
  if (/[A-Za-z]/.test(s)) {
    const native = new Date(s);
    if (!isNaN(native.getTime())) {
      // Use UTC-based ISO extraction to avoid timezone shifts
      return new Date(Date.UTC(native.getFullYear(), native.getMonth(), native.getDate())).toISOString().split('T')[0];
    }
  }

  // 4) As a last resort, normalize separators and try native parse, then convert to UTC-based ISO date
  const replaced = s.replace(/\./g, '/').replace(/-/g, '/');
  const altDate = new Date(replaced);
  if (!isNaN(altDate.getTime())) {
    return new Date(Date.UTC(altDate.getFullYear(), altDate.getMonth(), altDate.getDate())).toISOString().split('T')[0];
  }

  // 5) Final fallback - attempt native parse directly and return UTC-normalized ISO date
  const final = new Date(s);
  if (!isNaN(final.getTime())) {
    return new Date(Date.UTC(final.getFullYear(), final.getMonth(), final.getDate())).toISOString().split('T')[0];
  }

  return undefined;
}

function parseAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') return amountStr;
  if (!amountStr) return 0;
  
  // Remove currency symbols and commas
  const cleaned = amountStr.toString().replace(/[₹$€£,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

// LLM Integration
async function applySuggestionsToStagedTransactions(transactions: StagedTransaction[]): Promise<void> {
  // Prepare data for LLM
  const drafts = transactions.map(t => ({
    id: t.id,
    input: {
      date: t.parsed_date || t.original_date,
      amount: t.parsed_amount || 0,
      rawNarration: t.parsed_description || t.original_description,
      fingerprint: t.fingerprint,
    } as AutoTagInput,
  }));

  try {
    // Get LLM suggestions
    const suggestions = await enrichWithAutoTags(drafts, { rules: [] });

    // Update transactions with suggestions
    const updates = transactions.map((transaction, index) => {
      const suggestion = suggestions[index]?.suggestions?.[0];
      
      if (suggestion) {
        return updateStagedTransaction(transaction.id, {
          suggested_account: suggestion.splits?.[0]?.account,
          suggested_counter_account: 'Assets:Checking', // Default counter account
          suggested_tags: suggestion.tags || [],
          suggested_narration: suggestion.narration,
          confidence: suggestion.confidence,
          status: 'auto-tagged',
        });
      }
      
      return Promise.resolve(transaction);
    });

    await Promise.all(updates);
  } catch (error) {
    console.error('Failed to apply LLM suggestions:', error);
    // Continue without suggestions - not a fatal error
  }
}

// Transaction Management
export async function updateTransactionTagging(
  transactionId: string,
  updates: {
    account?: string;
    counter_account?: string;
    tags?: string[];
    narration?: string;
  }
): Promise<StagedTransaction> {
  return updateStagedTransaction(transactionId, {
    ...updates,
    status: 'manually-tagged',
  });
}

export async function applySuggestionToTransaction(transactionId: string): Promise<StagedTransaction> {
  return applySuggestionsToTransaction(transactionId);
}

export async function approveTransactionsForExport(csvUploadId: string): Promise<void> {
  // Mark all transactions as approved
  const transactions = await selectStagedTransactions(csvUploadId);
  
  const updates = transactions.map(t => 
    updateStagedTransaction(t.id, { status: 'approved' })
  );
  
  await Promise.all(updates);
  
  // Update CSV upload status
  await updateCsvUploadStatus(csvUploadId, 'approved');
}

// Export to Ledger Format
export async function exportToLedgerFormat(csvUploadId: string): Promise<string> {
  const transactions = await selectStagedTransactions(csvUploadId);
  const approvedTransactions = transactions.filter(t => t.status === 'approved');

  if (approvedTransactions.length === 0) {
    throw new Error('No approved transactions to export');
  }

  // Generate ledger format text
  const ledgerEntries = approvedTransactions.map(transaction => {
    const date = transaction.parsed_date || transaction.original_date;
    const narration = transaction.narration || transaction.parsed_description || transaction.original_description;
    const account = transaction.account || 'Expenses:Unknown';
    const counterAccount = transaction.counter_account || 'Assets:Checking';
    const amount = Math.abs(transaction.parsed_amount || 0);
    const tags = transaction.tags?.length > 0 ? ` ${transaction.tags.map(t => `#${t}`).join(' ')}` : '';

    return `${date} ${narration}${tags}
    ${account}    ${amount.toFixed(2)} ${transaction.currency}
    ${counterAccount}`;
  });

  return ledgerEntries.join('\n\n') + '\n';
}
