// ledgerParser.ts
// Minimal Ledger-like parser (safe subset).
// Supported transaction block:
//
// 2025-08-01 Coffee #food #coffee
//   Expenses:Food            120 INR
//   Assets:Cash             -120 INR
//
// Rules:
// - Blank line separates transactions.
// - Lines starting with ';' are treated as comments and attached to the current tx.
// - Currency is optional and detected if the last token is 2–5 uppercase letters (e.g., INR, USD).
// - Amount sign determines debit (>0) vs credit (<0).
//
// Exports:
// - parseLedger(text, fileId): Transaction[]  <-- preferred (provides file_id)
// - parseMultipleEntries(text): Transaction[] <-- legacy compatibility

import type { Transaction, Posting } from '@/types/ledger';

// Simple uuid fallback; tries crypto.randomUUID if available.
function uuid(): string {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return 'tx_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parseAmountCurrency(tokens: string[]): { amount: number; currency?: string | null } {
  // tokens may look like: ['-120.50', 'USD'] or ['120']
  if (tokens.length === 0) return { amount: 0, currency: null };

  let currency: string | null = null;
  const last = tokens[tokens.length - 1];
  if (/^[A-Z]{2,5}$/.test(last)) {
    currency = last;
    tokens = tokens.slice(0, -1);
  }

  const amtStr = tokens.join('').replace(/,/g, '');
  const amount = Number(amtStr);
  return { amount: Number.isFinite(amount) ? amount : 0, currency };
}

function parsePosting(line: string): Posting | null {
  // Expected formats:
  // "  Account:Sub           120 INR"
  // "  Account:Sub          -120"
  // "  Account:Sub" (amount omitted → treated as 0)
  //
  // Keep the regex tolerant of multiple spaces before amount.
  const m = line.match(/^\s{2,}(.+?)\s+([+-]?\d[\d.,]*)(?:\s+([A-Z]{2,5}))?\s*$/);
  if (m) {
    const account = m[1].trim();
    const numberToken = m[2];
    const currencyToken = m[3];
    const tokens = currencyToken ? [numberToken, currencyToken] : [numberToken];
    const { amount, currency } = parseAmountCurrency(tokens);
    return { account, amount, currency };
  }

  // Account-only posting with zero amount
  const m2 = line.match(/^\s{2,}(.+?)\s*$/);
  if (m2) {
    return { account: m2[1].trim(), amount: 0, currency: null };
  }

  return null;
}

function parseHeader(line: string): { date: string; narration: string; tags: string[] } | null {
  // Header example:
  // "2025-08-01 Coffee at Blue Tokai #coffee #food"
  const m = line.match(/^(\d{4}[-/]\d{2}[-/]\d{2})\s+(.*)$/);
  if (!m) return null;

  const dateRaw = m[1];
  const rest = m[2].trim();
  const date = dateRaw.replace(/\//g, '-');

  // Extract tags like #food #bill
  const tags = (rest.match(/#[\p{L}\p{N}_-]+/gu) || []).map((t) => t.slice(1));

  // Remove tags from narration
  const narration = rest.replace(/#[\p{L}\p{N}_-]+/gu, '').trim();

  return { date, narration, tags };
}

export function parseLedger(text: string, fileId: string): Transaction[] {
  const lines = text.split(/\r?\n/);
  const txs: Transaction[] = [];

  let curHeader: ReturnType<typeof parseHeader> | null = null;
  let curPostings: Posting[] = [];
  let curComments: string[] = [];

  const flush = () => {
    if (!curHeader) return;
    if (curPostings.length === 0) return;

    // Balance transaction if one posting has an elided amount.
    // A posting with an elided amount is parsed as having amount=0 and currency=null.
    const elidedPostings = curPostings.filter((p) => p.amount === 0 && p.currency === null);

    if (elidedPostings.length === 1) {
      const elidedPosting = elidedPostings[0];
      const totalsByCurrency = new Map<string, number>();

      // Sum amounts for each currency, excluding the elided one.
      for (const p of curPostings) {
        if (p !== elidedPosting) {
          const currencyKey = p.currency || 'NULL_CURRENCY';
          const currentTotal = totalsByCurrency.get(currencyKey) || 0;
          totalsByCurrency.set(currencyKey, currentTotal + p.amount);
        }
      }

      const originalElidedPostingIndex = curPostings.indexOf(elidedPosting);
      if (originalElidedPostingIndex > -1) {
        // Remove the placeholder elided posting.
        curPostings.splice(originalElidedPostingIndex, 1);

        // For each currency total, add a new posting with the inverse amount.
        // This handles transactions with multiple currencies.
        for (const [currencyKey, total] of totalsByCurrency.entries()) {
          curPostings.splice(originalElidedPostingIndex, 0, {
            account: elidedPosting.account,
            amount: -total,
            currency: currencyKey === 'NULL_CURRENCY' ? null : currencyKey,
          });
        }
      }
    }

    // The canonical amount of a transaction is the sum of its positive postings (debits).
    const amount = curPostings.filter((p) => p.amount > 0).reduce((sum, p) => sum + p.amount, 0);

    const tx: Transaction = {
      id: uuid(),
      file_id: Number(fileId),
      date: curHeader.date,
      narration: curHeader.narration,
      payee: curHeader.narration,
      amount,
      tags: curHeader.tags,
      postings: curPostings,
    };

    // Optional comments: not part of canonical type; UI can access via a type guard if needed.
    // @ts-ignore
    (tx as any).comments = curComments.slice();

    txs.push(tx);
    curHeader = null;
    curPostings = [];
    curComments = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Blank line separates transactions
    if (line === '') {
      flush();
      continue;
    }

    // Whole-line comments start with ';'
    if (/^\s*;/.test(line)) {
      curComments.push(line.replace(/^\s*;\s?/, ''));
      continue;
    }

    // A header is a line with no leading whitespace
    if (!/^\s/.test(raw)) {
      flush();
      const h = parseHeader(line);
      if (h) {
        curHeader = h;
      }
      // If header does not parse, ignore until next blank line
      continue;
    }

    // Otherwise it should be a posting (indented)
    const p = parsePosting(raw);
    if (p) curPostings.push(p);
  }

  // Flush last transaction if pending
  flush();

  return txs;
}

// Legacy compatibility for existing callers that expect a no-fileId API.
// Uses an empty string for file_id; callers are expected to fill it in later if needed.
export function parseMultipleEntries(text: string): Transaction[] {
  return parseLedger(text, '');
}
