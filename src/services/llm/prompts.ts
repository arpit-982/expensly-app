import { AutoTagSuggestion } from '../../types/autotag.js';

export const JSON_PROMPT = `
You are an expert accountant assisting with categorizing financial transactions.
For each transaction, provide a likely categorization.
Your response MUST be a valid JSON array of objects, where each object conforms to the AutoTagSuggestion interface.
Do not include any markdown formatting or other text outside of the JSON.

Example Input:
{
  "date": "2023-10-26",
  "amount": -25.50,
  "rawNarration": "STARBUCKS"
}

Example Output:
[
  {
    "narration": "Starbucks Coffee",
    "splits": [
      { "account": "Expenses:Coffee" }
    ],
    "confidence": 0.9,
    "rationale": "STARBUCKS is a well-known coffee shop.",
    "model": "gemini-1.5-flash"
  }
]
`;

// A simple validator to check if the LLM output conforms to the expected structure.
// In a real-world scenario, you might use a more robust validation library like Zod.
export function validateSuggestions(data: any): data is AutoTagSuggestion[][] {
  if (!Array.isArray(data)) return false;
  for (const suggestions of data) {
    if (!Array.isArray(suggestions)) return false;
    for (const suggestion of suggestions) {
      if (typeof suggestion.confidence !== 'number') return false;
      if (typeof suggestion.model !== 'string') return false;
    }
  }
  return true;
}
