// ledgerParser.js
// =================
// Core parsing function: converts a Ledger-CLI transaction block into structured JSON

/**
 * parseEntry - Parses a single Ledger-CLI transaction block into a structured JSON object.
 * This function handles:
 *  1. Extracting the transaction date and payee from the header line.
 *  2. Collecting any comment lines (starting with `;`).
 *  3. Parsing each posting line to extract account names, amounts, and optional currencies.
 *  4. Identifying a single balancing posting (lines without an amount) and computing its value
 *     so that the sum of all postings equals zero.
 *
 * @param {string} text - Raw transaction block (header + optional comment lines + posting lines).
 * @returns {object} An object with the following shape:
 *  {
 *    date: string,                   // Transaction date in YYYY-MM-DD format
 *    payee: string,                  // Full header description (payee/narration)
 *    comments: string[],             // Array of comment text (without leading `; `)
 *    postings: Array<{               // Array of posting objects
 *      account: string,              // Ledger account name (e.g. Expenses:Food)
 *      amount: number,               // Numeric value of the posting (positive or negative)
 *      currency: string | null       // Optional currency symbol (e.g. '€', '$') or null
 *    }>
 *  }
 *
 * @example
 * const entry = `2025/01/10 Groceries\n    ; Blinkit; Split with Non\n    Expenses:Household:Groceries 233\n    Liabilities:Payables:Ananya 233\n    Assets:Checking:Bank of Baroda`;
 * const parsed = parseEntry(entry);
 * // parsed.postings = [ {account: 'Expenses...'}, {account: 'Liabilities...'}, {account: 'Assets...', amount: -466} ]
 */
export function parseEntry(text) {
  // 1) Split the raw block into trimmed lines and remove leading whitespace
  const lines = text
    .trim()
    .split(/\r?\n/)        // Split on CRLF or LF
    .map(line => line.trimStart()); // Remove leading indentation spaces

  // Validate header
  if (!lines[0]) {
    throw new Error('Empty entry block supplied to parser');
  }

  // 2) Parse header for date and payee
  const headerRegex = /^(\d{4}[\/\-]\d{2}[\/\-]\d{2})\s+(.+)$/;
  const headerMatch = lines[0].match(headerRegex);
  if (!headerMatch) {
    throw new Error('Invalid entry header format: ' + lines[0]);
  }
  const date = headerMatch[1];          // e.g. '2025-01-10'
  const payee = headerMatch[2];         // e.g. 'Groceries'

  // 3) Collect comment lines (lines starting with ';')
  const comments = lines
    .filter(line => line.startsWith(';'))   // Keep only comment lines
    .map(line => line.replace(/^;\s*/, '')); // Strip leading '; ' prefix

  // 4) Parse postings
  const postings = [];
  let blankIndex = -1; // Tracks index of the balancing posting (no amount)

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty or comment lines
    if (!line || line.startsWith(';')) continue;

    // Regex to match: account <two+ spaces> amount <optional currency>
    const postingRegex = /^([\w: ]+?)\s{2,}(-?\d+(?:[.,]\d*)?)\s*([A-Za-z$€₹]*)$/;
    const match = line.match(postingRegex);

    if (match) {
      // 4a) Standard posting with explicit amount
      const account = match[1].trim();
      const rawAmount = match[2];
      const amount = parseFloat(rawAmount.replace(',', '')); // Handle thousands separators if any
      const currency = match[3] || null;                     // Currency symbol or null
      postings.push({ account, amount, currency });
    } else {
      // 4b) Balancing posting (no amount specified)
      const account = line.trim();
      postings.push({ account, amount: null, currency: null });
      blankIndex = postings.length - 1;
    }
  }

  // 5) Compute the missing amount for the balancing posting, if present
  if (blankIndex > -1) {
    // Sum all explicit amounts (null treated as zero)
    const total = postings.reduce((sum, p) => sum + (p.amount || 0), 0);
    // Assign negative sum to balancing posting to ensure total zero
    postings[blankIndex].amount = -total;
  }

  // 6) Return the structured object
  return { date, payee, comments, postings };
}

/**
 * parseMultipleEntries - Parses multiple transaction blocks from a complete ledger file
 * @param {string} content - Full ledger file content
 * @returns {Array} Array of parsed transaction objects
 */
export function parseMultipleEntries(content) {
  if (!content || !content.trim()) {
    return [];
  }

  // Split content by double newlines to separate transaction blocks
  const blocks = content.split(/\n\s*\n/).filter(block => block.trim());
  
  const transactions = [];
  for (const block of blocks) {
    try {
      const parsed = parseEntry(block);
      transactions.push(parsed);
    } catch (error) {
      console.warn('Failed to parse transaction block:', error.message);
      // Continue parsing other blocks even if one fails
    }
  }

  return transactions;
}