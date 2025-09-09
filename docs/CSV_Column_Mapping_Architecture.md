# CSV Column Mapping Architecture

## Problem Statement

The current CSV import system uses hardcoded column names (`Date`, `Amount`, `Description`) which doesn't work with different bank CSV formats. User's CSV has columns: `Transaction Date`, `Cheque Number`, `Withdrawal`, `Deposit`, `Balance`, `Narration`.

## Full Solution Architecture

### Phase 1: Enhanced Column Detection Engine

```typescript
interface ColumnMapping {
  csvColumn: string;
  targetField: 'date' | 'amount' | 'description' | 'reference' | 'balance';
  confidence: number;
  dataType: 'date' | 'number' | 'string';
}

interface CsvColumnAnalysis {
  detectedColumns: ColumnMapping[];
  suggestions: ColumnMapping[];
  unmatched: string[];
  sampleData: Record<string, any>[];
}
```

### Phase 2: Smart Column Detection Algorithm

1. **Pattern Matching**
   - Date fields: `date`, `transaction date`, `trans date`, `dt`, etc.
   - Amount fields: `amount`, `withdrawal`, `deposit`, `debit`, `credit`
   - Description: `description`, `narration`, `memo`, `details`
   - Reference: `cheque number`, `ref`, `transaction id`

2. **Data Type Analysis**
   - Analyze first few rows to confirm data types
   - Detect date formats (DD/MM/YYYY, MM/DD/YYYY, etc.)
   - Identify currency symbols and number formats

3. **Confidence Scoring**
   - Exact match: 100%
   - Fuzzy match: 80-95%
   - Data type match: 60-80%
   - Manual override: User confirmation

### Phase 3: Interactive Column Mapping UI

```typescript
interface ColumnMappingProps {
  csvHeaders: string[];
  sampleData: Record<string, any>[];
  onMappingConfirm: (mapping: ColumnMapping[]) => void;
  onMappingCancel: () => void;
}
```

**UI Components:**
1. **Column Preview Table** - Show first 5 rows of CSV
2. **Mapping Interface** - Drag & drop or dropdown selection
3. **Validation Feedback** - Show parsing results in real-time
4. **Template Management** - Save/load mapping templates

### Phase 4: Enhanced Parsing Engine

```typescript
interface ParsedTransaction {
  // Core fields
  date: Date | null;
  amount: number;
  description: string;
  
  // Extended fields
  reference?: string;
  balance?: number;
  transactionType: 'debit' | 'credit' | 'unknown';
  
  // Original data preservation
  originalRow: Record<string, any>;
  columnMapping: ColumnMapping[];
}
```

### Phase 5: Dynamic Table Display

**Enhanced StagedTransactionsTable:**
- Show original CSV columns alongside parsed data
- Color-code mapped vs unmapped columns
- Allow inline editing of column mappings
- Display parsing confidence indicators

## Implementation Plan

### Step 1: Quick Fix (Immediate)
- Update parser to handle user's specific format
- Add support for `Transaction Date`, `Withdrawal/Deposit`, `Narration`

### Step 2: Column Detection Service
- Create `ColumnDetectionService` with pattern matching
- Implement fuzzy string matching for column names
- Add data type analysis for validation

### Step 3: Mapping UI Components
- Create `ColumnMappingModal` component
- Build drag-and-drop interface for column assignment
- Add real-time preview of parsing results

### Step 4: Template System
- Store mapping templates in database
- Allow users to save/reuse mappings
- Auto-suggest templates based on CSV structure

### Step 5: Enhanced Display
- Update `StagedTransactionsTable` to show original columns
- Add column mapping indicators
- Implement inline mapping adjustments

## Database Schema Extensions

```sql
-- Column mapping templates
CREATE TABLE column_mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  mapping JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced csv_uploads table
ALTER TABLE csv_uploads ADD COLUMN column_mapping JSONB;
ALTER TABLE csv_uploads ADD COLUMN template_id UUID REFERENCES column_mapping_templates(id);
```

## Benefits

1. **Universal CSV Support** - Handle any bank/financial institution format
2. **User-Friendly** - Visual mapping interface with real-time feedback
3. **Reusable** - Save templates for recurring imports
4. **Transparent** - Show original data alongside parsed results
5. **Flexible** - Support for additional fields (reference numbers, balances)
6. **Robust** - Confidence scoring and validation feedback

## Next Steps

1. Implement quick fix for current CSV format
2. Build column detection engine
3. Create mapping UI components
4. Add template management system
5. Enhance table display with original columns
