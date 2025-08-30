// src/types/filters.ts
// Defines the data structures for the filter engine's Abstract Syntax Tree (AST).

export type FilterField = 'date' | 'amount' | 'narration' | 'account' | 'tag';

// A map of valid operators for each field type.
export const validOperators = {
  date: ['is_on', 'is_not', 'is_before', 'is_after'] as const,
  amount: ['is', 'is_not', 'greater_than', 'less_than'] as const,
  narration: [
    'is',
    'is_not',
    'contains',
    'does_not_contain',
    'starts_with',
    'ends_with',
    'is_blank',
    'is_not_blank',
  ] as const,
  account: ['is', 'is_not', 'contains', 'does_not_contain'] as const,
  tag: ['contains', 'does_not_contain', 'is_blank', 'is_not_blank'] as const,
};

// Derive operator types from the validOperators object.
type DateOperator = (typeof validOperators.date)[number];
type AmountOperator = (typeof validOperators.amount)[number];
type NarrationOperator = (typeof validOperators.narration)[number];
type AccountOperator = (typeof validOperators.account)[number];
type TagOperator = (typeof validOperators.tag)[number];

// Discriminated union for a single filter rule.
export type FilterCondition =
  | { id: string; field: 'date'; operator: DateOperator; value: string }
  | { id: string; field: 'amount'; operator: AmountOperator; value: number | string }
  | { id: string; field: 'narration'; operator: NarrationOperator; value: string }
  | { id: string; field: 'account'; operator: AccountOperator; value: string }
  | { id: string; field: 'tag'; operator: TagOperator; value: string };

// A group of conditions or other groups, combined with a conjunction.
export interface FilterGroup {
  id: string;
  conjunction: 'and' | 'or';
  children: (FilterCondition | FilterGroup)[];
}

export type FilterNode = FilterCondition | FilterGroup;
