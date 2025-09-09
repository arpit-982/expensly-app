# Architecture – CSV Import & Categorization

## Data Flow

CSV Upload  
  ↓  
Column Mapping & Funding Account  
  ↓  
Staging Table (AG Grid)  
  ↙                     ↘  
Rules Engine            LLM Suggestions  
  ↓                         ↓  
Proposed Rows (rule + LLM output)  
  ↓  
User Review & Overrides (diffs, reverts, batch apply)  
  ↓  
Commit Transactions  
  ↓  
Database (transactions + postings)  
  ↓  
.ledger Export  

---

## Components

### Frontend
- CSV Parser for header/row preview.
- Staging Table (AG Grid, virtualized).
- Rule Builder Modal:
  - Condition chips with AND/OR/NOT grouping.
  - Action chips for narration, accounts, tags, splits.
- Ledger Entry Editor:
  - Inline editable cell with autocomplete.
- Diff Banner & Revert:
  - Shows unsaved changes.
  - Row-level and batch revert options.
- Commit & Export controls.

### Backend
- Supabase/Postgres:
  - ledger_files
  - transactions
  - postings
  - rules
  - tags
  - splits
- Services:
  - ledgerService.parseAndUpsert → apply rules + parse edits.
  - llmService → request suggestions.
  - exportService → regenerate `.ledger`.

---

## Rule Engine
- Input: transaction row + features.
- Evaluate conditions (boolean AST).
- Apply actions in priority order:
  - narration
  - accounts
  - tags
  - splits
- Produce a deterministic proposed state.
- User overrides always take precedence.

---

## LLM Engine
- Run in batch per import.
- Context = narration, amount, fingerprint fields, user history.
- Output = suggested expense account, tags, confidence.
- Shown in UI; persisted only if accepted.

---

## Validation
- Ledger parser re-checks edited entries.
- Splits validator ensures amounts balance.
- Conflict detection highlights overlapping rules.

---

## Deployment Notes
- Draft layer: unsaved edits live in memory until commit.
- Commit:
  - Writes into transactions + postings.
  - Tracks user overrides separately.
  - Uses optimistic concurrency with version field.
- Auditability:
  - All rule applications + overrides logged.
  - Rules can be edited or disabled later.
