# Codebase Refactor Plan (Do this before new features)

## Objectives

- Remove custom parser from render path.
- Unify types and terminology.
- Add a backend‑agnostic service layer (Supabase today).
- Simplify UI to read structured data only.
- Establish a modular folder structure for future features (tags, budgeting).

## Tasks (checklist)

### 1) Types & Terminology

- Define the **single source of truth** for domain types in `src/types.ts`:
  - `export interface Posting { account: string; amount: number; currency?: string | null }`
  - `export interface Transaction { id: string; file_id: string; date: string; narration: string; payee?: string; amount: number; tags: string[]; postings: Posting[] }`
  - `export interface LedgerFile { id: string; name: string; content: string; is_primary: boolean; created_at: string; updated_at: string }`
- Replace all scattered/duplicate interfaces (e.g., in `filterEngine.ts`, `Transactions.tsx`) with imports from `@/types`.
- Use **ledger terminology** consistently: `narration` (free text), optional `payee` (counterparty), `postings` (entries).
- Derive **debit/credit** strictly from posting sign in UI or service helpers (no duplicate arrays in the model).
- Add/confirm TS path aliases in `tsconfig.json` (e.g., `"@/*": ["./src/*"]`).

### 2) Service Layer

- Create `src/services/ledgerService.ts` exposing **only** these methods:
  - `getFiles(): Promise<LedgerFile[]>`
  - `saveFile(file: Pick<LedgerFile, 'id' | 'content'>): Promise<void>`
  - `parseAndUpsert(fileId: string): Promise<void>`\
    (runs CLI or fallback parser; upserts `transactions` + `postings`)
  - `listTransactions(fileId: string): Promise<Transaction[]>`
- Move all Supabase-specific code into `src/integrations/supabase/*` and keep `ledgerService` backend‑agnostic.
- UI components must never call Supabase directly — they call the service only.

### 3) Parsing Integration

- Remove `ledgerParser.js` from any render path.
- Implement `parseAndUpsert(fileId)` to:
  1. Read canonical ledger text from `ledger_files.content`.
  2. Prefer server/edge function running `ledger`/`hledger`; fallback to a WebWorker JS parser.
  3. Produce `Transaction[]` with nested `Posting[]`.
  4. Upsert into `transactions` and `postings` (or `transactions.postings` JSONB) in one transaction.
- On file **save**: update file → trigger parse → refresh the transactions list.

### 4) Transactions Page

- Refactor `src/features/transactions/TransactionsPage.tsx` to use only `ledgerService.listTransactions(fileId)`.
- Ensure columns:
  - **Date**, **Narration**, **Amount** (formatted, sign‑aware).
  - **Debit Accounts** = `postings.filter(p => p.amount > 0)` rendered with multi‑line cell renderer.
  - **Credit Accounts** = `postings.filter(p => p.amount < 0)` rendered similarly.
- Centralize advanced filters in `filterEngine.ts` (date/amount/narration/tags/account includes) — avoid ad‑hoc filtering in the grid.
- Preserve table/card toggle; keep layout responsive.

### 5) Folder Structure (target)

```
src/
  components/
    transactions/
  features/
    transactions/
      TransactionsPage.tsx
      filterEngine.ts
  integrations/
    supabase/
  services/
    ledgerService.ts
  types.ts
  utils/
```

### 6) Schema (Supabase)

- `ledger_files` (id, name, content, is\_primary, created\_at, updated\_at)
- `transactions` (id, file\_id, date, narration, payee, amount, tags[])
- `postings` (id, transaction\_id, account, amount, currency?)
  - **OR**: `transactions.postings` JSONB if you prefer semi‑normalized storage.

### 7) Cleanup & Guardrails

- Delete dead code (old parser, duplicate types, unused mocks).
- Enforce imports from `@/types` across the codebase.
- Add lightweight tests for `ledgerService` (mocks for DB).
- Prettier + ESLint + strict TS on.

## Acceptance Criteria

- One authoritative types file; no duplicate interfaces remain.
- No component imports Supabase directly.
- Saving a ledger file re‑parses and refreshes the transactions table.
- Debit/credit rendering is derived from postings sign consistently.
- Lint + type checks pass; service tests green.

## Milestones

1. Types & Aliases (short)
2. Service Layer + DB Migrations (short)
3. Parsing Bridge (medium)
4. Transactions Page Refactor (short)
5. Cleanup + Tests (short)

