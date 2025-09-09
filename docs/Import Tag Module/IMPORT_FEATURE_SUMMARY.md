# CSV Import (LLM-assisted) — Work Summary

This document summarizes what has been completed so far, what remains pending, decisions made during the implementation, and recommended next steps to continue work on the CSV import + review workflow.

Overview
- Goal: Provide a robust CSV import pipeline that parses arbitrary CSVs, stages transactions, gets LLM-assisted suggestions, allows manual review/tagging in a table UI, and exports approved transactions to ledger format.
- Pattern: Repository + Service + UI layers. AG Grid used for tabular UIs. Supabase (Postgres) used for persistence and RLS.

Completed work (implemented and reviewed)
- Database schema and migrations
  - CSV import tables with RLS and triggers: [`supabase/migrations/20250901160000_create_csv_import_tables.sql`](supabase/migrations/20250901160000_create_csv_import_tables.sql:1)
- Types
  - Import-related types, staged transaction shape: [`src/types/import.ts`](src/types/import.ts:1)
- Repository layer
  - Supabase repository functions for CSV uploads and staged transactions: [`src/integrations/supabase/import.repo.ts`](src/integrations/supabase/import.repo.ts:1)
- Service layer
  - CSV parsing, staged transaction creation, LLM suggestion integration, export flow: [`src/services/importService.ts`](src/services/importService.ts:1)
  - CSV parsing implemented with PapaParse; basic normalization helpers included (date/amount parsing)
- LLM integration
  - Auto-tagging pipeline wired: [`src/services/autoTagService.ts`](src/services/autoTagService.ts:1) and providers
- UI (minimal fully wired flows)
  - AG Grid wrapper component: [`src/components/ui/AgGrid.tsx`](src/components/ui/AgGrid.tsx:1)
  - Upload component and CSV uploads table (simplified to stabilize AG Grid usage)
    - Uploader: [`src/components/import/CsvUploader.tsx`](src/components/import/CsvUploader.tsx:1)
    - Uploads table (minimal working): [`src/components/import/CsvUploadsTable.tsx`](src/components/import/CsvUploadsTable.tsx:1)
  - Staged transactions table (simplified test version): [`src/components/import/StagedTransactionsTable.tsx`](src/components/import/StagedTransactionsTable.tsx:1)
  - Transactions table (used elsewhere and verified working): [`src/components/transactions/TransactionsTable.tsx`](src/components/transactions/TransactionsTable.tsx:1)
  - Import page wiring (upload → select upload → review staged transactions): [`src/pages/Import.tsx`](src/pages/Import.tsx:1)
- Dev fixes and stabilization
  - AG Grid module registration made global in: [`src/main.tsx`](src/main.tsx:1)
  - Resolved multiple AG Grid compatibility issues (filter types changed for Community Edition, removed duplicate CSS imports, moved CSS into global `src/index.css`)

What was learned / key decisions
- AG Grid:
  - Community edition lacks some filters (SetFilter) — replaced with `agTextColumnFilter`.
  - Multiple module registrations were causing conflicts; modules should be registered once globally.
  - Complex React cell renderers and passing complex `context` into AG Grid caused runtime warnings/errors; simplified renderers were used to stabilize.
- CSV parsing:
  - The initial parser assumed fixed column names (Date, Amount, Description). Real-world CSVs vary (bank statements commonly use `Transaction Date`, `Withdrawal`, `Deposit`, `Narration`, etc.), which caused parsed fields to be empty.
- Approach moving forward:
  - Implement a column-detection + mapping system (proposed design committed as architecture doc): [`docs/CSV_Column_Mapping_Architecture.md`](docs/CSV_Column_Mapping_Architecture.md:1)

Pending work (high priority)
1. Column mapping & parsing robustness (high priority)
   - Implement automatic header detection + fuzzy matching
   - Provide interactive mapping UI to confirm/override detected mappings
   - Parse debit/credit styles (Withdrawal/Deposit) into a single numeric amount
   - Reference: planned architecture: [`docs/CSV_Column_Mapping_Architecture.md`](docs/CSV_Column_Mapping_Architecture.md:1)
2. Staged transactions table — restore full feature set
   - Reintroduce inline editors (accounts, tags, narration) safely without reintroducing AG Grid errors
   - Add bulk operations: apply LLM suggestions in bulk, bulk tagging rules UI
   - Re-add progress column and action buttons, implemented using safe, lightweight cell renderers
3. Rule engine
   - Integrate deterministic rules for common recurring categorizations (rule templates + execution engine)
4. Tests & validation
   - Unit tests for parsing (various CSV formats), repository, and service layers
   - E2E tests for the upload → review → export flow
5. UX: Mapping templates & saved presets
   - Save column mapping templates for repeated bank formats
   - Offer onboarding flow for new CSV formats
6. Documentation
   - Expand the README and developer docs to explain how to add new CSV templates, run the import CLI, and debug AG Grid issues

Medium / low priority improvements
- Visual: Restore progress bars, richer cell renderers, and small UI niceties once tables are stable
- Performance: Pagination & virtualized rendering tuning for very large CSV uploads
- Export: Additional ledger export options and audit logs

Immediate next tasks (recommended, in order)
1. Implement quick parser patch for the CSV headers you provided:
   - Map `Transaction Date` → date
   - Map `Withdrawal`/`Deposit` → amount (Withdrawal negative, Deposit positive)
   - Map `Narration` → description
   This fixes your immediate test CSV and should be a 1–2 hour change in [`src/services/importService.ts`](src/services/importService.ts:1).
2. Build a Column Detection Service + Mapping UI (the full solution). Break into 3 subtasks:
   - Backend detection and confidence scoring
   - Modal UI + preview for mapping
   - Persistence of mapping templates
3. Restore full features to staged review table safely:
   - Reintroduce cell editing with typed ColDefs and minimal renderers
   - Re-add action column (view/export/delete) with click handlers outside AG Grid where possible
4. Add tests and run through a few sample bank CSVs (add `data/sample-import.csv` usage)

How to start a new task (suggested)
- If you want the quick fix first, create a task: "Quick parser fix for bank CSV (Transaction Date / Withdrawal / Deposit / Narration)" and assign to dev mode.
- If you prefer the robust long-term approach, create a task: "Implement CSV Column Mapping + Templates", estimate as a sprint (3–5 days depending on UX detail).
- For both, I can produce a detailed implementation plan / PR checklist.

Useful files (entry points)
- Import service (parsing + staged creation): [`src/services/importService.ts`](src/services/importService.ts:1)
- Types for staged transactions: [`src/types/import.ts`](src/types/import.ts:1)
- Minimal uploads table (current): [`src/components/import/CsvUploadsTable.tsx`](src/components/import/CsvUploadsTable.tsx:1)
- Test staged table (minimal): [`src/components/import/StagedTransactionsTable.tsx`](src/components/import/StagedTransactionsTable.tsx:1)
- Global AG Grid registration and app entry: [`src/main.tsx`](src/main.tsx:1)
- Column mapping architecture doc: [`docs/CSV_Column_Mapping_Architecture.md`](docs/CSV_Column_Mapping_Architecture.md:1)

Notes and risks
- AG Grid warnings are noisy — they can mask functional issues; stabilizing column definitions and avoiding complex dynamic props helped reduce noise.
- LLM costs: bulk suggestion runs can be costly; provide option to run suggestions per-upload or per-transaction to control costs.
- RLS and Supabase triggers need careful testing with import workloads for performance and permission correctness.

Deliverables I can produce next (pick one to start)
- Quick parser patch for your CSV format (Transaction Date, Withdrawal/Deposit, Narration)
- Full column-mapping MVP (backend detection + mapping modal + preview)
- Restore full staged table editing (with tests)
- Test suite for CSV parsing + sample bank CSVs

If you confirm which deliverable you want to start, I will create the task and implement it.  
I saved this summary to: [`docs/IMPORT_FEATURE_SUMMARY.md`](docs/IMPORT_FEATURE_SUMMARY.md:1)
