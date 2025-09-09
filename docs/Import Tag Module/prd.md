# PRD – CSV Import & Intelligent Categorization Module

## 1. Overview
This module enables users to import raw CSV bank/credit card/cash data, map columns, preview staged transactions, apply rules/LLM suggestions, and export clean ledger entries. It bridges noisy bank statement data with canonical `.ledger` transactions.

---

## 2. Goals
- Simplify onboarding of scattered CSV data.
- Allow flexible mapping and fingerprinting for rule creation.
- Provide transparent staging to review/edit transactions.
- Support splits, tags, and overrides without breaking auditability.
- Export everything into canonical `.ledger` format, consistent with the existing parser/DB sync.

---

## 3. User Journey & Page Breakdown

### A. CSV Upload & Mapping
**Requirements**
- Drag-and-drop CSV or file picker.
- Select **Funding Account** (ledger account this CSV maps to).
- Map columns → `Date`, `Narration`, `Amount`, `Debit/Credit`, `Balance`.
- Toggle visibility for each column (what shows in staging table).
- Choose fingerprinting columns (for grouping & rule creation).
- [Future] Save column mapping template for reuse.

**Functions**
- Parse CSV header & rows (show preview of first 5 lines).
- Persist mapping in memory until commit.
- Validate required fields present.

---

### B. Staging Preview
**Requirements**
- AG Grid with virtualization (10k+ rows).
- Columns: user-mapped CSV fields + system-generated (`Rule Applied`, `LLM Suggestion`, `Tags`, `Split/Ratio`, `Ledger Entry`).
- **Ledger Entry Cell**:
  - Autocomplete for accounts (paisa-style).
  - Pre-filled from rules/LLM.
  - Editable; validation on blur (must balance).
- Per-row Revert pill.
- Batch actions: bulk apply splits/tags/accounts.
- Diff banner when edits made: “27 rows changed”.

**Functions**
- Apply rules deterministically (proposed state).
- Show LLM suggestions with confidence pill.
- Allow overrides (local → DB `user_overrides`).
- Recalculate ledger entry preview instantly.

---

### C. Rule Creation
**Requirements**
- Entry point: row → “Create rule from this row”.
- Modal/Dashboard seeded with:
  - **Conditions**: extracted fingerprint (UPI, merchant, POS, amount band, funding account).
  - **Actions**: from final edited row (narration, expense account, tags, splits).
- Support AND/OR logic builder.
- Live preview: “Matches 27 rows” → view list.
- Option to apply rule now or save for future only.
- Conflict warning if overlapping with higher-priority rule.

**Functions**
- Store rules in DB with JSONB conditions/actions.
- Apply rule in real time to staging table.
- Allow edit/disable/delete in Rule Manager.

---

### D. Commit & Export
**Requirements**
- Commit button validates all staged rows.
- Write transactions + postings to DB.
- Regenerate canonical `.ledger` file.
- Feedback summary: X committed, Y rules applied, Z overrides.

**Functions**
- Validation checks: splits sum, postings balance.
- Error panel for invalid rows.
- Export ledger file to disk or Supabase storage.

---

## 4. Database Requirements

### Tables
1. **ledger_files**
- id, name, content, source_type (`manual|csv`), created_at, updated_at.

2. **transactions**
- id, file_id, date, narration, amount, tags[], raw_metadata (jsonb), status (`staged|committed`).

3. **postings**
- id, transaction_id, account, amount.

4. **rules**
- id, name, active (bool), priority (int).
- conditions (jsonb).
- actions (jsonb).
- scope (`global|funding_account|import`).

5. **splits**
- transaction_id, participant, ratio.

6. **tags**
- id, name, type (`manual|rule|llm`).

---

## 5. LLM Integration
- Inputs: narration, amount, fingerprint columns, history.
- Outputs: suggested account(s), tags, confidence (0–1).
- UI: suggestion chip with confidence pill.
- User can accept/reject.
- [Future] Feedback loop: accepted suggestions generate rules.

---

## 6. UX Requirements
- Empty ledger entry cells = red border until resolved.
- Splits must sum to 100%, remainder auto-rounded to owner account.
- Per-row Revert; batch revert to file baseline.
- Keyboard navigation: Tab/Enter to edit cells.
- Large-file perf: load 10k+ rows <200ms.

---

## 7. Non-Goals (MVP Excludes)
- Template saving.
- Analytics dashboards.
- Multi-currency splits.
- Real-time collaborative staging.

---

## 8. Risks
- Regex rules may overfit → mitigated by condition builder.
- LLM latency/cost → mitigate via caching + optional toggle.
- DB bloat with raw_metadata → retention policy needed.

---
