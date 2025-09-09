import { config } from '../config.js';
import { generateFingerprint } from '../lib/fingerprint.js';
import { AutoTagInput, AutoTagSuggestion, TxnAutoTagMeta } from '../types/autotag.js';
import { GeminiProvider } from './llm/geminiProvider.js';

export interface AutoTagProvider {
  suggest(batch: AutoTagInput[], opts?: { topK?: number }): Promise<AutoTagSuggestion[][]>;
}

export async function enrichWithAutoTags(
  drafts: { id: string; input: AutoTagInput }[],
  ctx: { rules: any[]; provider?: AutoTagProvider },
): Promise<TxnAutoTagMeta[]> {
  // 1. Generate fingerprints for all incoming transactions.
  for (const draft of drafts) {
    draft.input.fingerprint = generateFingerprint(draft.input);
  }

  // 2. Apply deterministic rules (not implemented yet).
  const ruleAppliedDrafts = new Map<string, TxnAutoTagMeta>();

  // 3. For remaining drafts, find similar transactions and call the LLM provider.
  const draftsForLlm = drafts.filter((d) => !ruleAppliedDrafts.has(d.id));
  let suggestions: AutoTagSuggestion[][] = [];

  if (draftsForLlm.length > 0) {
    let provider = ctx.provider;
    // If no provider is passed in, create a default one if the feature is enabled.
    if (!provider && config.featureFlags.enableLlmSuggestions) {
      try {
        provider = new GeminiProvider();
      } catch (error) {
        console.error('Failed to initialize LLM provider:', error);
      }
    }

    if (provider) {
      suggestions = await provider.suggest(draftsForLlm.map((d) => d.input));
    }
  }

  // 4. Assemble and return the metadata.
  const results: TxnAutoTagMeta[] = drafts.map((draft, index) => {
    if (ruleAppliedDrafts.has(draft.id)) {
      return ruleAppliedDrafts.get(draft.id)!;
    }
    const llmSuggestions = suggestions[draftsForLlm.indexOf(draft)] || [];
    return {
      transactionId: draft.id,
      suggestions: llmSuggestions,
      createdAt: new Date().toISOString(),
    };
  });

  return results;
}
