/**
 * Column mapping detection service (client-friendly).
 *
 * This file provides a simple, testable detection algorithm used by the
 * Column-Mapping MVP. It is intentionally lightweight and dependency-free
 * so it can be invoked directly from the browser during early iterations.
 *
 * Exports:
 * - detectMapping(request: MappingRequest): Promise<MappingResponse>
 *
 * Note: This is an iterative service. The alias lists and heuristics should
 * be extended over time and eventually moved behind an authenticated API
 * if server-side execution is preferred.
 */

import {
  MappingRequest,
  MappingResponse,
  MappingObject,
  CanonicalField,
  DetectedField,
} from '../types/import';

// Canonical fields we attempt to detect. For MVP we only detect the
// fundamental source columns: date, narration, balance, debit, credit.
// Amount will be synthesized from debit/credit when applicable.
const CANONICAL_FIELDS: CanonicalField[] = [
  'date',
  'narration',
  'balance',
  'debit',
  'credit',
];

// Aliases for header matching. Extend this list as new CSV patterns are seen.
const ALIASES: Record<CanonicalField, string[]> = {
  date: ['date', 'transaction date', 'txn date', 'posted date', 'value date'],
  amount: ['amount', 'amt', 'value', 'transaction amount', 'amt (inr)', 'amount (inr)'],
  narration: ['narration', 'description', 'details', 'remark', 'remarks', 'particulars'],
  balance: ['balance', 'running balance', 'acct balance', 'closing balance'],
  debit: ['withdrawal', 'debit', 'debit amount', 'withdrawals'],
  credit: ['deposit', 'credit', 'credit amount', 'deposits'],
  reference: ['reference', 'ref', 'transaction id', 'txn id', 'utr', 'narration id'],
  transaction_id: ['id', 'transaction id', 'txn id', 'ref no'],
};

/** Normalize header text for matching */
function normalizeHeader(h?: string): string {
  if (!h) return '';
  return h
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d"]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Simple Levenshtein distance (safe small implementation) */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[bn][an];
}

/** Score header match against an alias */
function scoreHeaderAgainstAlias(headerNorm: string, alias: string): number {
  if (!headerNorm) return 0;
  const aliasNorm = normalizeHeader(alias);
  if (headerNorm === aliasNorm) return 1.0;
  if (headerNorm.includes(aliasNorm) || aliasNorm.includes(headerNorm)) return 0.9;
  const dist = levenshtein(headerNorm, aliasNorm);
  const maxLen = Math.max(headerNorm.length, aliasNorm.length);
  if (maxLen === 0) return 0;
  const similarity = 1 - dist / maxLen; // 0..1
  if (similarity > 0.7) return 0.8;
  if (similarity > 0.5) return 0.6;
  return 0.0;
}

/** Evaluate sampleRows for field-specific confidence improvements */
function evaluateSampleData(headers: string[], sampleRows: string[][], headerIdx: number, field: CanonicalField): number {
  if (!sampleRows || sampleRows.length === 0) return 0;
  let good = 0;
  let total = 0;
  for (const row of sampleRows.slice(0, 6)) {
    const cell = (row && row[headerIdx]) ?? '';
    if (cell === undefined) continue;
    total++;
    const v = cell.trim();
    if (field === 'amount' || field === 'debit' || field === 'credit' || field === 'balance') {
      // numeric heuristics: remove currency symbols and commas
      const cleaned = v.replace(/[^0-9.\-()]/g, '').replace(/\(|\)/g, '');
      const n = Number(cleaned);
      if (!Number.isNaN(n)) good++;
    } else if (field === 'date') {
      // try Date.parse and simple dd/mm or yyyy-mm-dd detection
      const isoLike = /^\d{4}-\d{2}-\d{2}$/;
      const ddmmyy1 = /^\d{2}\/\d{2}\/\d{4}$/;
      if (isoLike.test(v) || ddmmyy1.test(v)) good++;
      else {
        const ts = Date.parse(v);
        if (!Number.isNaN(ts)) good++;
      }
    } else {
      // narration/reference - presence of non-empty text increases confidence
      if (v.length > 0) good++;
    }
  }
  if (total === 0) return 0;
  return Math.min(1, good / total);
}

/** Build DetectedField for a header and canonical field */
function buildDetectedField(header: string, score: number): DetectedField {
  // Avoid returning an overconfident 1.00 — cap at 0.99 unless exact alias match.
  const capped = Math.max(0, Math.min(0.99, Number(score.toFixed(2))));
  return {
    header,
    confidence: capped,
  };
}

/** Detect mapping from headers and sample rows */
export async function detectMapping(request: MappingRequest): Promise<MappingResponse> {
  const { headers = [], sampleRows = [] } = request;
  const headerNorms = headers.map(normalizeHeader);

  // Gather candidate matches for each canonical field
  type Candidate = { field: CanonicalField; header: string; score: number };
  const candidates: Candidate[] = [];

  for (const field of CANONICAL_FIELDS) {
    const aliases = ALIASES[field] ?? [];
    let bestHeader = '';
    let bestScore = 0;

    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      const hn = headerNorms[i];

      // Score based on alias matching
      let aliasScore = 0;
      for (const a of aliases) {
        const s = scoreHeaderAgainstAlias(hn, a);
        if (s > aliasScore) aliasScore = s;
        if (aliasScore >= 1) break;
      }

      // Data-driven score based on sample content
      const dataScore = evaluateSampleData(headers, sampleRows, i, field);

      // Combine scores (favor alias matches but allow strong data signals)
      const finalScore = aliasScore * 0.75 + dataScore * 0.25;

      // Require some alias signal unless dataScore is very high
      if (finalScore > bestScore && (aliasScore > 0 || dataScore > 0.85)) {
        bestScore = finalScore;
        bestHeader = h;
      }
    }

    if (bestScore > 0.2 && bestHeader) {
      candidates.push({ field, header: bestHeader, score: bestScore });
    }
  }

  // Assign headers to fields uniquely: highest-score first
  const assigned = new Set<string>();
  const mapping: Partial<Record<CanonicalField, DetectedField | null>> = {};
  candidates
    .sort((a, b) => b.score - a.score)
    .forEach((c) => {
      if (!assigned.has(c.header)) {
        mapping[c.field] = buildDetectedField(c.header, c.score);
        assigned.add(c.header);
      } else {
        mapping[c.field] = null;
      }
    });

  // Ensure all canonical fields exist in mapping
  for (const f of CANONICAL_FIELDS) {
    if (!(f in mapping)) mapping[f] = null;
  }

  // Post-processing heuristics
  // If both debit and credit exist, recommend combine_debit_credit for amount transformation
  if (mapping['debit'] && mapping['credit'] && (!mapping['amount'] || mapping['amount']!.confidence < 0.6)) {
    mapping['amount'] = {
      header: `${mapping['debit']!.header} / ${mapping['credit']!.header}`,
      confidence: Math.min(1, (mapping['debit']!.confidence + mapping['credit']!.confidence) / 2),
      transform: 'combine_debit_credit',
    };
  } else if (mapping['amount'] && mapping['amount']!.header.toLowerCase().includes('withdrawal')) {
    mapping['amount']!.transform = 'signed_amount';
  }

  // Build mapping object
  const detected: MappingObject = {
    mapping,
    fingerprintColumns: [], // default empty; UI will select
    visibleColumns: headers.slice(0, 6), // default preview subset
    metadata: {},
  };

  // Return mapping with minimal errors
  const response: MappingResponse = {
    mapping: detected,
    errors: [],
  };
  return response;
}

export default {
  detectMapping,
};
