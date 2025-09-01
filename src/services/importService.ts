import { StagedTransaction, AutoTagInput } from '@/types/autotag';
import Papa from 'papaparse';
import { enrichWithAutoTags } from './autoTagService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses a CSV file and returns a list of staged transactions with LLM suggestions.
 * 
 * @param file - The CSV file to parse.
 * @returns A promise that resolves to an array of staged transactions.
 */
export const parseCsvAndGetSuggestions = (file: File): Promise<StagedTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const drafts = results.data.map((row: any) => ({
            id: uuidv4(),
            input: {
              date: row.Date,
              amount: parseFloat(row.Amount),
              rawNarration: row.Description,
            } as AutoTagInput,
          }));

          const suggestions = await enrichWithAutoTags(drafts, { rules: [] });

          const stagedTransactions = drafts.map((draft, index) => {
            const suggestion = suggestions[index]?.suggestions?.[0];
            return {
              date: draft.input.date,
              description: draft.input.rawNarration,
              amount: draft.input.amount,
              account: '',
              suggestedAccount: suggestion?.splits?.[0]?.account || 'Expenses:Unknown',
            };
          });

          resolve(stagedTransactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
