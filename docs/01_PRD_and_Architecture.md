# Product Requirements Document (PRD)

## 1. Overview
A hybrid text‑and‑data expense manager that uses **ledger‑CLI plain‑text journals** as the canonical source, built with a **Mantine + Tailwind CSS UI**, backed by **Supabase**, and enhanced with **rules‑ and model‑based tagging, CSV imports, analytics, and two‑way sync**.

---

## 2. Problems & Goals
- **Pain Point**: Pure CLI workflows are powerful but lack discoverability and ease of use for manual or bulk entry.  
- **Goal**: Preserve the auditability and flexibility of ledger‑CLI while offering an intuitive UI, high performance on large files, and advanced categorization features.

---

## 3. Target Users
- Text‑savvy individuals and power‑users who want a friendly interface.  
- Freelancers or small businesses needing precise split‑transaction support.  
- Users transitioning from spreadsheets or consumer finance apps.

---

## 4. Feature Breakdown by Phase

### Phase 1
Implements core file, parsing, manual/bulk entry, rule engine, basic review and export.
1. **File Management**  
   Upload, edit, version, and designate primary/reference `.ledger` files with a code‑editor UI (syntax highlighting, line numbers, find/replace).
2. **Manual & Bulk Transaction Input**  
   - **Manual Form**: Date, payee, postings (account, amount, currency), inline validation, account autocomplete, split‑transaction support.  
   - **CSV Import**: Drag‑and‑drop CSV uploader, interactive column‑to‑field mapping, preview/edit rows, commit as ledger entries.
3. **Parsing & Structured Storage**  
   Full parse of raw text into `ledger_transactions` (JSONB postings), plus `ledger_files` for source text.
4. **Rule Engine**  
   JSON‑based rules (conditions → category/tags), priority/order, activation toggles, bulk apply with audit log.
5. **Transaction Review & Export**  
   Tabular view with filters, inline tag edits, one‑click apply, and export that regenerates or patches the `.ledger` file from the database.

*Dependencies:* Parsing must precede rules and review. Manual/CSV inputs feed into parser/DB. Export uses parsed cache to produce canonical text.

---

### Phase 2
Adds predictive tagging, advanced review, analytics, and robust sync.
1. **Predictive Tagging**  
   In‑app statistical model trained on historical data → top‑n category suggestions with confidence scores.
2. **Enhanced Transaction Review**  
   Accept/reject workflow for model suggestions, tagging metrics, and improved UI controls.
3. **Analytics & Reporting**  
   Dashboards: spending by category, budgets vs. actual, timelines, net‑worth reports, rule/model performance.
4. **Export & Sync Enhancements**  
   Delta‑tracking table, patch application via Supabase Edge Functions, conflict detection/fallback full‑regen, scheduled sync.

*Dependencies:* Relies on stable rule‑tagged transactions from Phase 1. Model trains on Phase 1 data. Dashboards pull from updated tables. Sync layer builds on basic export in Phase 1.

---

### Phase 3
Integrates LLM assistance for rule discovery and narrative insights.
1. **AI Assistant**  
   - LLM‑powered suggestions for new tagging rules based on misclassified transactions.  
   - Automated conflict resolution when rules overlap.  
   - Natural‑language monthly summaries and insights.

*Dependencies:* Requires mature rule engine, predictive model, clean transaction history, and strong data integrity from Phases 1 & 2.

---

## 5. Tech Stack
- **Frontend**: Mantine + Tailwind CSS (no Next.js/Loveable; Mantine used natively for components and layout)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)  
- **Parser**: JavaScript module (with optional ledger‑CLI shell calls)  
- **Modeling**: In‑app (Naive Bayes/logistic regression); external API in Phase 3  
- **Deployment**: Vercel for frontend; Supabase‑hosted backend

---

## 6. Success Metrics
- **Efficiency**: ≥ 80% of transactions auto‑tagged by rules alone.  
- **Accuracy**: Model suggestion acceptance rate ≥ 80%.  
- **Input UX**: Manual/bulk entry time < 2 minutes.  
- **Performance**: UI render < 200 ms on 10k‑entry files.  
- **Retention**: Weekly active use for core workflows ≥ 90%.

---

## 7. Risks & Mitigations
- **Parsing edge cases** → Comprehensive test suite, real‑world journal samples.  
- **Merge conflicts** in patch sync → Delta queue with full‑regen fallback.  
- **UI performance** on large files → Incremental caching, virtualization, lazy loading.  
- **Learning curve** → Contextual help, guided onboarding.

---

This PRD outlines a phased approach to deliver a performant, user‑friendly ledger‑based expense manager with advanced tagging and analytics.

