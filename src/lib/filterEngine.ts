export interface FilterCondition {
  field: 'date' | 'amount' | 'narration' | 'debitAccounts' | 'creditAccounts' | 'tags';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'before' | 'after' | 'on' | 'has' | 'has_not' | 'contains_all' | 'contains_any';
  value: any;
  value2?: any; // for 'between' operations
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface FilterConfig {
  groups: FilterGroup[];
  groupLogic: 'AND' | 'OR';
}

export interface Transaction {
  id: string;
  date: string;
  narration: string;
  debitAccounts: string[];
  creditAccounts: string[];
  amount: number;
  tags: string[];
}

// Field configurations for UI
export const filterFields = {
  date: {
    label: 'Date',
    operators: ['equals', 'before', 'after', 'between', 'on'] as const,
    inputType: 'date' as const,
  },
  amount: {
    label: 'Amount',
    operators: ['equals', 'greater_than', 'less_than', 'between'] as const,
    inputType: 'number' as const,
  },
  narration: {
    label: 'Narration',
    operators: ['equals', 'contains', 'starts_with', 'ends_with'] as const,
    inputType: 'text' as const,
  },
  debitAccounts: {
    label: 'Debit Accounts',
    operators: ['has', 'has_not', 'contains_all', 'contains_any'] as const,
    inputType: 'multiSelect' as const,
  },
  creditAccounts: {
    label: 'Credit Accounts',
    operators: ['has', 'has_not', 'contains_all', 'contains_any'] as const,
    inputType: 'multiSelect' as const,
  },
  tags: {
    label: 'Tags',
    operators: ['has', 'has_not', 'contains_all', 'contains_any'] as const,
    inputType: 'multiSelect' as const,
  },
};

// Core filter evaluation functions
export function filterTransactions(transactions: Transaction[], config: FilterConfig): Transaction[] {
  if (config.groups.length === 0) return transactions;
  
  return transactions.filter(transaction => evaluateFilterConfig(transaction, config));
}

function evaluateFilterConfig(transaction: Transaction, config: FilterConfig): boolean {
  const groupResults = config.groups.map(group => evaluateGroup(transaction, group));
  
  return config.groupLogic === 'AND' 
    ? groupResults.every(result => result)
    : groupResults.some(result => result);
}

function evaluateGroup(transaction: Transaction, group: FilterGroup): boolean {
  if (group.conditions.length === 0) return true;
  
  const conditionResults = group.conditions.map(condition => 
    evaluateCondition(transaction, condition)
  );
  
  return group.logic === 'AND'
    ? conditionResults.every(result => result)
    : conditionResults.some(result => result);
}

function evaluateCondition(transaction: Transaction, condition: FilterCondition): boolean {
  const fieldValue = getFieldValue(transaction, condition.field);
  
  switch (condition.operator) {
    // Date operators
    case 'equals':
      return new Date(fieldValue).getTime() === new Date(condition.value).getTime();
    case 'before':
      return new Date(fieldValue) < new Date(condition.value);
    case 'after':
      return new Date(fieldValue) > new Date(condition.value);
    case 'between':
      return new Date(fieldValue) >= new Date(condition.value) && 
             new Date(fieldValue) <= new Date(condition.value2);
    case 'on':
      return new Date(fieldValue).toDateString() === new Date(condition.value).toDateString();
    
    // Number operators
    case 'greater_than':
      return fieldValue > condition.value;
    case 'less_than':
      return fieldValue < condition.value;
    
    // Text operators
    case 'contains':
      return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
    case 'starts_with':
      return fieldValue.toLowerCase().startsWith(condition.value.toLowerCase());
    case 'ends_with':
      return fieldValue.toLowerCase().endsWith(condition.value.toLowerCase());
    
    // Array operators
    case 'has':
      return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
    case 'has_not':
      return Array.isArray(fieldValue) && !fieldValue.includes(condition.value);
    case 'contains_all':
      return Array.isArray(fieldValue) && 
             Array.isArray(condition.value) &&
             condition.value.every(item => fieldValue.includes(item));
    case 'contains_any':
      return Array.isArray(fieldValue) && 
             Array.isArray(condition.value) &&
             condition.value.some(item => fieldValue.includes(item));
    
    default:
      return fieldValue === condition.value;
  }
}

function getFieldValue(transaction: Transaction, field: string): any {
  switch (field) {
    case 'date':
      return transaction.date;
    case 'amount':
      return transaction.amount;
    case 'narration':
      return transaction.narration;
    case 'debitAccounts':
      return transaction.debitAccounts;
    case 'creditAccounts':
      return transaction.creditAccounts;
    case 'tags':
      return transaction.tags;
    default:
      return null;
  }
}

// Utility functions for filter management
export function createFilterGroup(): FilterGroup {
  return {
    id: crypto.randomUUID(),
    logic: 'AND',
    conditions: [],
  };
}

export function createFilterCondition(field: FilterCondition['field']): FilterCondition {
  const fieldConfig = filterFields[field];
  return {
    field,
    operator: fieldConfig.operators[0],
    value: field === 'date' ? new Date().toISOString().split('T')[0] : '',
  };
}

export function createEmptyFilterConfig(): FilterConfig {
  return {
    groups: [createFilterGroup()],
    groupLogic: 'AND',
  };
} 