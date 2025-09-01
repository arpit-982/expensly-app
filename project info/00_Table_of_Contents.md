# Expensly – Central Knowledge Base (TOC)

**Purpose:** Entry point for any AI/chat. Read this first, then open the linked files for deep context.

## How to use this knowledge
- If you are an AI, load `01_PRD_and_Architecture.md` to understand scope & architecture,
  `02_Development_Context.md` to follow my coding expectations,
  `03_Parsing_Strategy.md` for ingestion/export logic,
  `04_Codebase_Refactor_Plan.md` to implement the cleanup before new features,
  and `06_Chat_Instructions.md` to understand required chat behavior.
- Keep responses concise, code-heavy, and aligned with these documents.

## Files
1. **01_PRD_and_Architecture.md**  
   Core product scope, architecture choices, data model, terminology.  
   Use when: scoping, making architectural changes, modeling data.

2. **02_Development_Context.md**  
   My coding preferences, UI conventions, folder layout, integration rules.  
   Use when: writing/refactoring code or proposing implementations.

3. **03_Parsing_Strategy.md**  
   Ledger parsing plan (Paisa-style CLI → structured DB), fallback options, sync rules.  
   Use when: working on import/export, ingestion, and ledger compatibility.

4. **04_Codebase_Refactor_Plan.md**  
   Step-by-step plan to clean the current repo, unify types, add service layer, remove custom parser.  
   Use when: preparing the codebase for features.

5. **05_Chat_Instructions.md**  
   Rules for AI behavior when interacting in this project.  
   Use when: establishing or reminding behavior expectations for a chat.

6. **05_Research_Report.pdf**  
   Deep research report on Paisa, Ledger, and architectural insights. Use as reference when comparing or planning.

7. **ledger3.text**
   Ledger documentation for syntax reference

## Reference Links
- Paisa (reference app): https://github.com/ananthakumaran/paisa  
- Expensly GitHub: https://github.com/arpit-982/expensly-app  
- Ledger CLI docs: https://www.ledger-cli.org/  
- hledger: https://hledger.org/  
- AG Grid docs: https://www.ag-grid.com/  
- Monarch (UI reference): https://www.monarchmoney.com/
- Mantine (UI library): https://github.com/mantinedev/mantine
