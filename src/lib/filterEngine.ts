// src/lib/filterEngine.ts
// A structured filter engine for Transaction[].
// Replaces the simple FilterConfig with a more powerful system
// of nested filter groups and conditions.
import type { Transaction, Posting } from '@/types/ledger';
import type { FilterField, FilterCondition, FilterGroup, FilterNode } from '@/types/filters';
import type { FilterField, FilterCondition, FilterGroup, FilterNode } from '@/types/filters';
















































// --- Helper Functions ---
function norm(s: string): string {
  return s.normalize('NFKC').toLowerCase();
}

function toISODate(d: string): string {
  // Accepts YYYY-MM-DD or anything Date can parse; outputs YYYY-MM-DD.
  // Note: `new Date('YYYY-MM-DD')` is parsed as UTC midnight. This function
  // relies on this consistent behavior for date-only string comparisons.
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}
function accountsFromPostings(tx: Transaction): string[] {
  return (tx.postings ?? []).map((p: Posting) => p.account);
}

// --- Evaluation Logic ---

function checkCondition(tx: Transaction, cond: FilterCondition): boolean {
  switch (cond.field) {
    case 'date': {
      const txDate = toISODate(tx.date);
      const valDate = toISODate(cond.value);
      if (!txDate || !valDate) return false;
      switch (cond.operator) {
        case 'is_on':
          return txDate === valDate;
        case 'is_not':
          return txDate !== valDate;
        case 'is_before':
          return txDate < valDate;
        case 'is_after':
          return txDate > valDate;
      }
      break;
    }

    case 'amount': {
      const txAmount = tx.amount;
      const valAmount = parseFloat(String(cond.value));
      if (Number.isNaN(valAmount)) return false;
      switch (cond.operator) {
        case 'is':
          return txAmount === valAmount;
        case 'is_not':
          return txAmount !== valAmount;
        case 'greater_than':
          return txAmount > valAmount;
        case 'less_than':
          return txAmount < valAmount;
      }
      break;
    }

    case 'narration': {
      const hay = norm(tx.narration ?? '');
      const needle = norm(cond.value);
      switch (cond.operator) {
        case 'is':
          return hay === needle;
        case 'is_not':
          return hay !== needle;
        case 'contains':
          return hay.includes(needle);
        case 'does_not_contain':
          return !hay.includes(needle);
        case 'starts_with':
          return hay.startsWith(needle);
        case 'ends_with':
          return hay.endsWith(needle);
        case 'is_blank':
          return hay.trim() === '';
        case 'is_not_blank':
          return hay.trim() !== '';
      }
      break;
    }

    case 'account': {
      const accounts = accountsFromPostings(tx).map(norm);
      const needle = norm(cond.value);
      if (!needle) return false;
      switch (cond.operator) {
        case 'is':
          return accounts.some((acc) => acc === needle);
        case 'is_not':
          return accounts.every((acc) => acc !== needle);
        case 'contains':
          return accounts.some((acc) => acc.includes(needle));
        case 'does_not_contain':
          return accounts.every((acc) => !acc.includes(needle));
      }
      break;
    }

    case 'tag': {
      const tags = (tx.tags ?? []).map(norm);
      const needle = norm(cond.value);
      switch (cond.operator) {
        case 'contains':
          return needle ? tags.includes(needle) : false;
        case 'does_not_contain':
          return needle ? !tags.includes(needle) : true;
        case 'is_blank':
          return tags.length === 0;
        case 'is_not_blank':
          return tags.length > 0;
      }
      break;
    }
  }
  return false;
}

function evaluateNode(tx: Transaction, node: FilterNode): boolean {
  // Type guard to distinguish between FilterCondition and FilterGroup
  if ('field' in node) {
    return checkCondition(tx, node);
  }

  // It's a FilterGroup
  const group = node;
  if (group.children.length === 0) {
    return true; // An empty group doesn't filter anything out
  }

  if (group.conjunction === 'and') {
    return group.children.every((child) => evaluateNode(tx, child));
  } else {
    // 'or'
    return group.children.some((child) => evaluateNode(tx, child));
  }
}
/**
 * Returns a new array filtered by the provided filter group.
 */
export function filterTransactions(
  transactions: Transaction[],
  filter?: FilterGroup | null,
): Transaction[] {

    return transactions ?? [;

    return transactions ?? [;
  }
  return (transactions ?? []).filter((tx) => evaluateNode(tx, filter));
}

// --- Factory Functions ---

export function createFilterCondition(field: FilterField = 'date'): FilterCondition {
  const common = { id: crypto.randomUUID() };
  switch (field) {
    case 'date':
      return { ...common, field, operator: 'is_on', value: new Date().toISOString().slice(0, 10) };
    case 'amount':
      return { ...common, field, operator: 'is', value: 0 };
    case 'narration':
    case 'account':
    case 'tag':
      return { ...common, field, operator: 'contains', value: '' };
    default:
      // This exhaustiveness check ensures we handle all field types.
      const _: never = field;
      throw new Error(`Unknown field type: ${field}`);
  }
}

export function createFilterGroup(): FilterGroup {
  return {
    id: crypto.randomUUID(),
    conjunction: 'and',
    children: [],

