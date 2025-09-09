# Parsing Strategy (Authoritative)

## Chosen Approach (Paisa-style)

- Canonical: raw `.ledger` text stored in Supabase (`ledger_files` table).
- Parse: run Ledger/HLedger CLI (preferred) to convert text to structured transactions/postings.
- Persist: store structured results in DB (normalized tables or JSONB column).
- UI: always queries structured data (never reparses raw text during render).

## Fallback (client-only)

- WebWorker parser using Tree-sitter or a JS grammar.
- Output reduced AST into Transaction and Posting objects.
- Upsert parsed data into Supabase for multi-device consistency.
- All parsing hidden behind a stable `parseLedger(content)` interface so we can swap later.

## Service Layer Interface

```ts
// services/ledgerService.ts (shape)
async function getFiles(): Promise<LedgerFile[]>;
async function saveFile(file: Pick<LedgerFile,'id'|'content'>): Promise<void>;
async function parseAndUpsert(fileId: string): Promise<void>; // runs CLI or fallback, then writes DB
async function listTransactions(fileId: string): Promise<Transaction[]>;
```

## Sync Rules

- On file save:

  1. Update `ledger_files.content`
  2. Trigger `parseAndUpsert(fileId)`
  3. Show spinner until parsing done
  4. Refresh transaction list via `listTransactions`

- On import (CSV/XLS/PDF):

  - Convert into ledger-format text first, append to file, then parse (same flow).

- On UI edit (future):

  - Update structured object → regenerate/patch ledger text → parse again → persist structured.

## Storage Options

- Normalized:
  - `transactions (id, file_id, date, narration, payee?, amount, tags[])`
  - `postings (id, transaction_id, account, amount, currency?)`
- Semi-normalized:
  - `transactions (…, postings JSONB)`

Normalized = better for queries, JSONB = simpler writes.

## Validation & Errors

- CLI parse errors: show error message in UI with line/column.
- Fallback errors: report AST error location, block save until fixed.
- Ensure balanced transactions, enforce ISO date format.

## Performance

- Parse on save (debounced if editing).
- Cache parse hash to skip unchanged files.
- Batch Supabase writes.
- Optionally cache locally (IndexedDB) for offline.

## References

- Paisa: [https://github.com/ananthakumaran/paisa](https://github.com/ananthakumaran/paisa)
- Ledger CLI: [https://www.ledger-cli.org/](https://www.ledger-cli.org/)
- hledger: [https://hledger.org/](https://hledger.org/)

