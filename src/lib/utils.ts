import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Splits an array of transaction postings into debits and credits
 * based on the sign of the amount.
 * 
 * @param postings - Array of posting entries with account and amount
 * @returns An object with debitAccounts and creditAccounts as string arrays
 */
export function splitPostings(postings: { account: string; amount: number }[]) {
  const debitAccounts: string[] = [];
  const creditAccounts: string[] = [];

  postings.forEach(({ account, amount }) => {
    // Format as "AccountName 123.45"
    const formatted = `${account} ${Math.abs(amount).toFixed(2)}`;

    if (amount >= 0) {
      // Positive or zero amounts → debit
      debitAccounts.push(formatted);
    } else {
      // Negative amounts → credit
      creditAccounts.push(formatted);
    }
  });

  return {
    debitAccounts,
    creditAccounts,
  };
}
