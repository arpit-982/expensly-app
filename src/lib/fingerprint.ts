import { AutoTagInput } from '../types/autotag.js';

/**
 * Normalizes a string by converting to lowercase and removing non-alphanumeric characters.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Creates a stable fingerprint for a transaction input.
 * This is used for similarity matching to find past, similar transactions.
 *
 * @param input The transaction details.
 * @returns A string fingerprint.
 */
export function generateFingerprint(input: Pick<AutoTagInput, 'rawNarration' | 'amount'>): string {
  const normalizedNarration = normalize(input.rawNarration);
  // Using a fixed number of decimal places for the amount to ensure consistency.
  const amountString = Math.abs(input.amount).toFixed(2);
  return `${normalizedNarration}|${amountString}`;
}
