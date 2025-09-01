export interface AutoTagInput {
  date: string;
  amount: number;
  currency?: string | null;
  rawNarration: string;
  fingerprint?: string;
  context?: Record<string, string>;
}

export interface AutoTagSuggestion {
  narration?: string;
  tags?: string[];
  splits?: Array<{ account: string; amount?: number; percent?: number }>;
  confidence: number; // 0..1
  rationale?: string;
  model: string;
}

export interface RuleApplication {
  ruleId: string;
  tags: string[];
  category?: string;
  source: 'rule';
}

export interface TxnAutoTagMeta {
  transactionId: string;
  ruleApplied?: RuleApplication;
  suggestions?: AutoTagSuggestion[];
  createdAt: string;
}

export interface StagedTransaction {
  date: string;
  description: string;
  amount: number;
  account: string;
  suggestedAccount: string;
}
