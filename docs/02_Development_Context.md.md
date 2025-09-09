# Development Context (How to work on this project)

## Collaboration Rules (for AI/codegen)

- Never overstate capabilities.
- Always ask clarifying questions when unclear.
- Never assume anything that has not been explicitly stated or requested.
- Propose small, atomic changes with diff-ready code snippets.
- Only include helpful inline comments explaining **why**, not **what**.
- Default to TypeScript, React/Next.js, Tailwind CSS.
- Use AG Grid for all tabular data — prefer `valueGetter` or cell renderers over data duplication.
- Keep modular: no direct Supabase calls in components; use the service layer.

## UI Conventions

- Sidebar navigation across all pages.
- Transactions page: toggle between table and card view.
- Filters: Notion-style, compact, space-efficient. Combine column header sort/filter with a top-bar advanced filter row.
- Theming: Prefer AG Grid’s theme engine; supplement with Tailwind utilities if needed.

## Folder Layout (target)

```
src/
  components/        # UI components (grouped by feature if needed)
  features/
    transactions/    # Table, card, filters, hooks
  domain/
    ledger/          # Parsing utils (client fallback)
  services/          # Data access (Supabase, parser bridge)
  types/             # Shared domain types
  utils/             # Helpers
```

## Types (single source of truth)

```ts
// src/types/ledger.ts
export interface Posting { account: string; amount: number; currency?: string | null; }
export interface Transaction {
  id: string; file_id: string; date: string;
  narration: string; payee?: string;
  amount: number; tags: string[];
  postings: Posting[];
}
export interface LedgerFile {
  id: string; name: string; content: string;
  is_primary: boolean; created_at: string; updated_at: string;
}
```

## Data Access Rules

- UI must never query Supabase directly.
- All DB operations go through `services/ledgerService.ts`:
  - `getFiles()`
  - `saveFile()`
  - `parseAndUpsert(fileId)`
  - `listTransactions(fileId)`

## Table & Filter Behavior

- Debit accounts: `postings.filter(p => p.amount > 0)`
- Credit accounts: `postings.filter(p => p.amount < 0)`
- Filters apply to:
  - `date`
  - `amount`
  - `narration`
  - `tags`
  - `account` names from postings

## Style & Comments

- Minimal, useful inline comments for future debugging.
- Link decisions back to the Decision Log when relevant.

