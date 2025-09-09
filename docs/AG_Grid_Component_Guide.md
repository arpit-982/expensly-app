# AG Grid Component — Developer Guide

Overview
This document describes the canonical AG Grid wrapper and how to use it when creating tables in Expensly.
The canonical implementation lives at [`src/components/ag-grid/AgGrid.tsx:1`](src/components/ag-grid/AgGrid.tsx:1) and the higher-level composition at [`src/components/ag-grid/DataGrid.tsx:1`](src/components/ag-grid/DataGrid.tsx:1).
We keep compatibility shims at [`src/components/ui/AgGrid.tsx:1`](src/components/ui/AgGrid.tsx:1) and [`src/components/ui/DataGrid.tsx:1`](src/components/ui/DataGrid.tsx:1) to avoid breaking imports while migrating.

Goals
- Provide a single, consistent entry-point for tables across the app.
- Enforce shared defaults (sorting/filtering/resizing/pagination) and theming.
- Centralize cell renderers and formatters so debit/credit derivation and currency formatting are uniform.

Files
- Wrapper: [`src/components/ag-grid/AgGrid.tsx:1`](src/components/ag-grid/AgGrid.tsx:1)
- High-level DataGrid: [`src/components/ag-grid/DataGrid.tsx:1`](src/components/ag-grid/DataGrid.tsx:1)
- Test page: [`src/pages/AgGridTest.tsx:1`](src/pages/AgGridTest.tsx:1)
- Global styles & quartz overrides: [`src/index.css:1`](src/index.css:1)

Usage contract (what you pass)
- columns: ColDef[] (ag-grid column definitions — prefer small, declarative helpers)
- data: local array of rows (client-mode) OR server-side contract (onQuery) — current test page uses client-mode
- rowKey: stable id field or function
- selection: 'none' | 'single' | 'multiple'

Example (minimal)
import { DataGrid } from '@/components/ag-grid/DataGrid';
import { sampleTransactions } from '@/data/sampleTransactions';

<DataGrid
  columns={columns}
  data={sampleTransactions}
  rowKey="id"
  selection="multiple"
/>

Implementation notes
- The wrapper applies the Quartz theme class and adds a data attribute with the resolved theme to scope dark-mode CSS.
- AG Grid CSS is imported in [`src/index.css:1`](src/index.css:1) after Tailwind to reduce Preflight overrides.
- TypeScript compatibility: the wrapper uses conservative typing (some any) for gridOptions to avoid large refactors. We will tighten types later.

Theming and dark mode
- The wrapper computes the active theme via next-themes (resolvedTheme) and applies:
  - ag-theme-quartz (light)
  - ag-theme-quartz-dark (dark)
- Because some AG Grid theme parts can be overridden by Tailwind, we added targeted overrides in [`src/index.css:101`](src/index.css:101) to cover:
  - headers, rows, cells
  - pagination/status bar controls
  - fallbacks using [data-grid-theme="dark"] attribute

Recommended pattern for new tables
1. Define column definitions using shared helpers (text/date/money/tag) — helper API to come.
2. Use DataGrid in your page/component: pass columns, data, rowKey, selection.
3. Avoid importing ag-grid-react directly — use the wrapper instead.
4. If you need custom renderers, implement them as reusable components and register them via columnDefs cellRenderer.

Example column that derives debit/credit from postings:
{
  headerName: 'Debit Accounts',
  field: 'postings',
  valueGetter: ({ data }) => splitPostings(data.postings).debitAccounts,
  cellRenderer: AccountsRenderer,
}

Debugging tips
- If styling looks off:
  - Confirm `ag-theme-quartz` / `ag-theme-quartz-dark` class exists on the wrapper element. Inspect the wrapper added by [`src/components/ag-grid/AgGrid.tsx:1`](src/components/ag-grid/AgGrid.tsx:1) — it includes data-grid-theme.
  - Verify `ag-theme-quartz.css` is loaded in Network tab; it is imported in [`src/index.css:1`](src/index.css:1).
- To test dark mode: toggle the .dark class on <html> or set system preference; wrapper reads next-themes.

Migration guidance (recommended)
- Sprint approach:
  - Sprint 1: implement wrapper, column helpers, basic renderers, test page (done)
  - Sprint 2: migrate 2–3 representative pages (Transactions, StagedTransactions, CsvUploads)
  - Sprint 3: run codemod, add ESLint rule to forbid direct imports, remove compatibility shims
- To migrate a page:
  - Replace any direct AgGridReact usage with DataGrid or AgGrid wrapper
  - Move custom cell renderers into shared renderer folder when they are reused

Lint / guardrails
- Plan to add an ESLint rule that forbids importing 'ag-grid-react' outside of the `src/components/ag-grid/*` folder.
- Until the rule is enforced, prefer using the compatibility shims (`src/components/ui/*`) if immediate migration is disruptive.

Storybook & recipes
- Create story files for:
  - Client-mode grid
  - Server-side grid (useGridData)
  - Selection + bulk actions
  - Inline editing
  - Column visibility persistence
- Reference story file path when added (e.g. [`src/components/ag-grid/AgGrid.stories.tsx:1`](src/components/ag-grid/AgGrid.stories.tsx:1))

Testing
- Component tests should mount the DataGrid with sample data and assert:
  - rows render, column headers present
  - currency/date formatting applied
  - selection behavior
- Visual tests (Storybook snapshots) for light & dark themes

Developer workflow (quickstart)
1. Start dev server: npm run dev
2. Open test route: http://localhost:5173/ag-grid-test
3. Inspect wrapper for `data-grid-theme` and the presence of quartz classes
4. If you need to quickly test dark mode, toggle `.dark` on <html> in devtools and refresh.

Troubleshooting common issues
- Heavy borders or unwanted shadows: wrapper includes a border and small shadow. You can override by passing className or adjusting the wrapper in [`src/components/ag-grid/AgGrid.tsx:1`](src/components/ag-grid/AgGrid.tsx:1).
- Missing dark styling on pagination/status: we added targeted CSS in [`src/index.css:101`](src/index.css:101). If still present, inspect element classes and report them back.

Future work (next iterations)
- Implement column helper library and shared formatters
- Add useGridData and useGridSelection hooks
- Tighten TypeScript typings for gridOptions and rowSelection
- Add ESLint rule and codemod to finish migration

Contacts
- For questions about design or currency formatting contact the UI owner (see repo Ownership doc).
- For backend/service questions contact ledgerService owners.

Appendix — quick reference imports
- Wrapper: [`src/components/ag-grid/AgGrid.tsx:1`](src/components/ag-grid/AgGrid.tsx:1)
- DataGrid: [`src/components/ag-grid/DataGrid.tsx:1`](src/components/ag-grid/DataGrid.tsx:1)
- Test page: [`src/pages/AgGridTest.tsx:1`](src/pages/AgGridTest.tsx:1)
