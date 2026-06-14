import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { generateGeminiJson } from '@/lib/gemini';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Index-based config resolved from DB cache or Gemini.
 * Using indices (not column names) makes extraction robust even when the CSV
 * has no recognizable header row.
 */
interface ParseConfig {
  headerRowIndex: number;
  detectedBankName?: string;
  dateColumnIndex: number;
  descriptionColumnIndex: number;
  /** >=0 when bank uses a single signed-value amount column */
  amountColumnIndex: number;
  /** >=0 when bank uses separate credit/inflow column */
  inflowColumnIndex: number;
  /** >=0 when bank uses separate debit/outflow column */
  outflowColumnIndex: number;
}

/** The shape of JSON Gemini must return — all column references are 0-based indices. */
interface AiMappingResponse {
  detectedBankName?: string;
  /** 0-indexed row number where the transaction table begins (skip metadata above). */
  headerRowIndex: number;
  dateColumnIndex: number;
  descriptionColumnIndex: number;
  /** Set when bank uses ONE amount column (positive = inflow, negative = outflow). */
  amountColumnIndex?: number;
  /** Set when bank uses SEPARATE credit column. */
  inflowColumnIndex?: number;
  /** Set when bank uses SEPARATE debit column. */
  outflowColumnIndex?: number;
}

// ─── File Parsing ─────────────────────────────────────────────────────────────

async function parseFileToRows(file: File): Promise<string[][]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    const result = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    return result.data as string[][];
  }

  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
  }

  throw new Error('Unsupported file format. Please upload a .csv, .xls, or .xlsx file.');
}

// ─── Header Fingerprinting ────────────────────────────────────────────────────

const FINANCIAL_KEYWORDS = [
  'date', 'amount', 'narration', 'description', 'debit', 'credit',
  'balance', 'particulars', 'remarks', 'transaction', 'reference',
  'withdrawal', 'deposit', 'value', 'dr', 'cr', 'tran',
];

/**
 * Scans the first N rows for the most likely transaction table header row.
 * Returns the 0-based index and the non-empty column names found there.
 */
function detectHeaderRow(rows: string[][]): { headerRowIndex: number; headers: string[] } {
  let bestRowIndex = -1;
  let maxMatchCount = 0;
  let bestRowHeaders: string[] = [];

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i];
    const matchCount = row.filter((cell) =>
      FINANCIAL_KEYWORDS.some((kw) => cell.trim().toLowerCase() === kw || cell.toLowerCase().includes(kw))
    ).length;

    if (matchCount >= 2 && matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestRowIndex = i;
      bestRowHeaders = row.map((c) => String(c).trim());
    }
  }

  if (bestRowIndex >= 0) {
    return {
      headerRowIndex: bestRowIndex,
      headers: bestRowHeaders,
    };
  }

  // No recognizable header row — treat all rows as data, use -1 to indicate no header
  return { headerRowIndex: -1, headers: [] };
}

/** Produces a stable fingerprint from the first data row values (not header names).
 *  This is used when the file has no clear header row. */
function buildDataSignature(row: string[]): string {
  // Use only the structural pattern (number of columns + types), not actual values
  const pattern = row
    .map((cell) => {
      const s = String(cell).trim();
      if (!s || s === '--') return 'empty';
      if (!isNaN(parseFloat(s.replace(/[,₦$€£\s]/g, '')))) return 'number';
      if (/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(s) || /\d{1,2}\s+\w+\s+\d{2,4}/i.test(s)) return 'date';
      return 'text';
    })
    .join('|');
  return `__data__${row.length}cols__${pattern}`;
}

/** Produces a stable fingerprint from header column names. */
function buildHeaderSignature(headers: string[]): string {
  return headers
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0)
    .sort()
    .join('|');
}

// ─── AI Layout Detection ──────────────────────────────────────────────────────

async function askGeminiForMapping(snippet: string, hasHeaders: boolean): Promise<AiMappingResponse> {
  const prompt = `You are an expert financial data parser for African (especially Nigerian) bank statements.

You will be given the first rows of a raw bank statement file as plain text (rows are numbered).
Your task is to return the EXACT 0-based column indices needed to extract transaction data.

Context:
- ${hasHeaders ? 'Row 0 in the snippet appears to be the transaction header row.' : 'This file has NO recognizable header row — all rows are transaction data. Set headerRowIndex to -1.'}
- Many Nigerian banks (OPay, GTBank, Moniepoint, etc.) use "--" to mean "not applicable" in a split debit/credit layout.

Our internal fields and how to map them:
- "dateColumnIndex"         → 0-based index of the column containing the transaction date
- "descriptionColumnIndex"  → 0-based index of the narration / description / remarks column
- "amountColumnIndex"       → 0-based index if the bank has ONE signed-value amount column
- "inflowColumnIndex"       → 0-based index of the Credit / Deposit column (when split layout)
- "outflowColumnIndex"      → 0-based index of the Debit / Withdrawal column (when split layout)

Rules:
- Set EITHER "amountColumnIndex" OR ("inflowColumnIndex" + "outflowColumnIndex"), NEVER both.
- "headerRowIndex" is the 0-indexed row number containing the transaction table headers. The backend reads from headerRowIndex + 1. If no headers are present and transaction data starts immediately, set headerRowIndex to -1.
- Omit any field you cannot confidently determine.
- Guess "detectedBankName" from context (e.g. "OPay", "GTBank", "Moniepoint"). Omit if unclear.

Respond ONLY with a single JSON object:
{
  "detectedBankName": string | undefined,
  "headerRowIndex": number,
  "dateColumnIndex": number,
  "descriptionColumnIndex": number,
  "amountColumnIndex": number | undefined,
  "inflowColumnIndex": number | undefined,
  "outflowColumnIndex": number | undefined
}

Here are the first rows of the file (format: "Row N: cell0 | cell1 | cell2 ..."):
---
${snippet}
---`;

  return generateGeminiJson<AiMappingResponse>(prompt);
}

// ─── Amount Parsing & Helpers ──────────────────────────────────────────────────

function parseNumberOrDash(str: string): number | null {
  const s = str.trim();
  if (s === '--' || s === '-' || s === '') return 0;
  const n = parseFloat(s.replace(/[₦$€£,\s]/g, ''));
  return isNaN(n) ? null : Math.abs(n);
}

function isDateStr(str: string): boolean {
  const s = str.trim();
  if (!s) return false;
  if (/\d/.test(s) === false) return false;
  if (/^\d+$/.test(s)) return false;
  const ts = Date.parse(s);
  return !isNaN(ts);
}

function parseAmount(raw: unknown): number {
  if (typeof raw === 'number') return Math.abs(raw);
  const str = String(raw ?? '').replace(/[₦$€£,\s]/g, '').trim();
  if (!str || str === '--' || str === '-' || str === 'N/A') return 0;
  const n = parseFloat(str);
  return isNaN(n) ? 0 : Math.abs(n);
}

function parseDate(raw: unknown): Date {
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  const str = String(raw ?? '').trim();
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function isSignedNegative(raw: unknown): boolean {
  const str = String(raw ?? '').replace(/[₦$€£,\s]/g, '').trim();
  return str.startsWith('-') || str.startsWith('(');
}

function autoCategorize(description: string, direction: 'INFLOW' | 'OUTFLOW'): string {
  const desc = description.toLowerCase().trim();
  if (!desc) {
    return direction === 'INFLOW' ? 'Other Revenue' : 'Supplier Payment';
  }

  if (direction === 'INFLOW') {
    if (
      desc.includes('sales') ||
      desc.includes('pos') ||
      desc.includes('payment') ||
      desc.includes('customer') ||
      desc.includes('transfer from') ||
      desc.includes('received') ||
      desc.includes('deposit') ||
      desc.includes('payout')
    ) {
      return 'Customer Payment';
    }
    if (
      desc.includes('interest') ||
      desc.includes('bonus') ||
      desc.includes('owealth withdrawal') ||
      desc.includes('savings withdrawal')
    ) {
      return 'Investment/Savings Income';
    }
    return 'Other Revenue';
  } else {
    if (
      desc.includes('salary') ||
      desc.includes('wage') ||
      desc.includes('staff') ||
      desc.includes('payroll') ||
      desc.includes('allowance')
    ) {
      return 'Salary/Wages';
    }
    if (
      desc.includes('rent') ||
      desc.includes('office rent') ||
      desc.includes('lease') ||
      desc.includes('landlord') ||
      desc.includes('shop rent')
    ) {
      return 'Rent & Lease';
    }
    if (
      desc.includes('electricity') ||
      desc.includes('power') ||
      desc.includes('water') ||
      desc.includes('utility') ||
      desc.includes('ekedc') ||
      desc.includes('ikedc') ||
      desc.includes('phcn') ||
      desc.includes('waste')
    ) {
      return 'Utilities';
    }
    if (
      desc.includes('save') ||
      desc.includes('owealth') ||
      desc.includes('investment') ||
      desc.includes('piggyvest') ||
      desc.includes('cowrywise')
    ) {
      return 'Savings & Investments';
    }
    if (
      desc.includes('transport') ||
      desc.includes('fuel') ||
      desc.includes('uber') ||
      desc.includes('bolt') ||
      desc.includes('petrol') ||
      desc.includes('diesel') ||
      desc.includes('logistics') ||
      desc.includes('delivery') ||
      desc.includes('dispatch') ||
      desc.includes('fare')
    ) {
      return 'Transport/Logistics';
    }
    if (
      desc.includes('fee') ||
      desc.includes('charge') ||
      desc.includes('tax') ||
      desc.includes('vat') ||
      desc.includes('commission') ||
      desc.includes('stamp duty') ||
      desc.includes('sms alert')
    ) {
      return 'Bank Fees & Taxes';
    }
    if (
      desc.includes('inventory') ||
      desc.includes('stock') ||
      desc.includes('purchase') ||
      desc.includes('supplier') ||
      desc.includes('wholesale') ||
      desc.includes('goods') ||
      desc.includes('material') ||
      desc.includes('supply') ||
      desc.includes('restock') ||
      desc.includes('flour') ||
      desc.includes('sugar') ||
      desc.includes('cement') ||
      desc.includes('drinks')
    ) {
      return 'Inventory Purchase';
    }
    return 'Supplier Payment';
  }
}

function detectOpayLayout(rows: string[][]): ParseConfig | null {
  // 1. Check for header row containing OPay keywords
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i];
    if (row.length < 6) continue;
    const normalized = row.map((c) => String(c).trim().toLowerCase());
    
    const hasTransDate = normalized.some((cell) => cell.includes('trans. date') || cell === 'trans date');
    const hasDesc = normalized.some((cell) => cell === 'description' || cell === 'narration' || cell === 'particulars');
    const hasDebit = normalized.some((cell) => cell.includes('debit') || cell.includes('dr.') || cell.includes('withdrawal') || cell.includes('outflow') || cell === 'dr');
    const hasCredit = normalized.some((cell) => cell.includes('credit') || cell.includes('cr.') || cell.includes('deposit') || cell.includes('inflow') || cell === 'cr');
    const hasBalance = normalized.some((cell) => cell.includes('balance'));
    
    if (hasTransDate && hasDesc && (hasDebit || hasCredit) && hasBalance) {
      const dateColumnIndex = row.findIndex((c) => {
        const val = String(c).toLowerCase();
        return val.includes('trans. date') || val === 'trans date' || val === 'date';
      });
      const descriptionColumnIndex = row.findIndex((c) => {
        const val = String(c).toLowerCase();
        return val === 'description' || val === 'narration' || val === 'particulars';
      });
      const outflowColumnIndex = row.findIndex((c) => {
        const val = String(c).toLowerCase();
        return val.includes('debit') || val.includes('dr.') || val.includes('withdrawal') || val === 'dr';
      });
      const inflowColumnIndex = row.findIndex((c) => {
        const val = String(c).toLowerCase();
        return val.includes('credit') || val.includes('cr.') || val.includes('deposit') || val === 'cr';
      });

      return {
        headerRowIndex: i,
        detectedBankName: 'OPay',
        dateColumnIndex: dateColumnIndex >= 0 ? dateColumnIndex : 0,
        descriptionColumnIndex: descriptionColumnIndex >= 0 ? descriptionColumnIndex : 2,
        outflowColumnIndex: outflowColumnIndex >= 0 ? outflowColumnIndex : 3,
        inflowColumnIndex: inflowColumnIndex >= 0 ? inflowColumnIndex : 4,
        amountColumnIndex: -1,
      };
    }
  }

  // 2. Check for headerless OPay-like 8-column layout
  let matchingRowsCount = 0;
  let firstMatchingRowIndex = -1;
  
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (row.length !== 8) continue;
    
    const col0IsDate = isDateStr(row[0]);
    const col2IsDesc = row[2].trim().length > 0 && !isDateStr(row[2]) && parseNumberOrDash(row[2]) === null;
    const col3Amt = parseNumberOrDash(row[3]);
    const col4Amt = parseNumberOrDash(row[4]);
    const col5Amt = parseNumberOrDash(row[5]);
    
    if (col0IsDate && col2IsDesc && col3Amt !== null && col4Amt !== null && col5Amt !== null) {
      matchingRowsCount++;
      if (firstMatchingRowIndex === -1) {
        firstMatchingRowIndex = i;
      }
    }
  }
  
  if (matchingRowsCount >= 2) {
    return {
      headerRowIndex: firstMatchingRowIndex - 1,
      detectedBankName: 'OPay',
      dateColumnIndex: 0,
      descriptionColumnIndex: 2,
      outflowColumnIndex: 3,
      inflowColumnIndex: 4,
      amountColumnIndex: -1,
    };
  }
  
  return null;
}

function detectLayoutByHeaders(headers: string[], headerRowIndex: number): ParseConfig | null {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  
  const dateIdx = normalized.findIndex((h) => 
    h === 'date' || h === 'trans date' || h === 'trans. date' || h === 'transaction date' || h === 'value date' || h.includes('date')
  );
  
  const descIdx = normalized.findIndex((h) => 
    h === 'narration' || h === 'description' || h === 'particulars' || h === 'remarks' || h === 'memo' ||
    h.includes('narration') || h.includes('description') || h.includes('particulars') || h.includes('remark')
  );
  
  const debitIdx = normalized.findIndex((h) => 
    h === 'debit' || h === 'dr' || h === 'dr.' || h === 'withdrawal' || h === 'outflow' || h === 'paid' || h === 'payment out' ||
    h.includes('debit') || h.includes('withdrawal') || h.includes('outflow')
  );
  
  const creditIdx = normalized.findIndex((h) => 
    h === 'credit' || h === 'cr' || h === 'cr.' || h === 'deposit' || h === 'inflow' || h === 'received' || h === 'payment in' ||
    h.includes('credit') || h.includes('deposit') || h.includes('inflow')
  );
  
  const amtIdx = normalized.findIndex((h) => 
    h === 'amount' || h === 'value' || h === 'sum' || h === 'tran amount' || h === 'transaction amount' || h === 'amt' ||
    h.includes('amount')
  );

  if (dateIdx >= 0 && descIdx >= 0) {
    if (debitIdx >= 0 && creditIdx >= 0) {
      return {
        headerRowIndex,
        dateColumnIndex: dateIdx,
        descriptionColumnIndex: descIdx,
        amountColumnIndex: -1,
        inflowColumnIndex: creditIdx,
        outflowColumnIndex: debitIdx,
      };
    }
    if (amtIdx >= 0) {
      return {
        headerRowIndex,
        dateColumnIndex: dateIdx,
        descriptionColumnIndex: descIdx,
        amountColumnIndex: amtIdx,
        inflowColumnIndex: -1,
        outflowColumnIndex: -1,
      };
    }
  }

  return null;
}

function validateParseConfig(config: ParseConfig, rows: string[][]) {
  const maxCols = Math.max(...rows.map((r) => r.length));

  if (config.headerRowIndex < -1 || config.headerRowIndex >= rows.length) {
    throw new Error(`Invalid headerRowIndex: ${config.headerRowIndex}`);
  }

  const indices = [
    config.dateColumnIndex,
    config.descriptionColumnIndex,
  ];

  if (config.amountColumnIndex >= 0) {
    indices.push(config.amountColumnIndex);
  }
  if (config.inflowColumnIndex >= 0) {
    indices.push(config.inflowColumnIndex);
  }
  if (config.outflowColumnIndex >= 0) {
    indices.push(config.outflowColumnIndex);
  }

  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= maxCols) {
      throw new Error(`Invalid column mapping index: ${index}`);
    }
  }

  const hasAmount = config.amountColumnIndex >= 0;
  const hasSplit = config.inflowColumnIndex >= 0 || config.outflowColumnIndex >= 0;

  if (!hasAmount && !hasSplit) {
    throw new Error("No valid amount, inflow, or outflow column was detected.");
  }
}

// ─── Config from DB record ────────────────────────────────────────────────────

function configFromCache(cached: {
  headerRowIndex: number;
  detectedBankName: string | null;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string | null;
  inflowColumn: string | null;
  outflowColumn: string | null;
}): ParseConfig {
  return {
    headerRowIndex: cached.headerRowIndex,
    detectedBankName: cached.detectedBankName ?? undefined,
    dateColumnIndex: parseInt(cached.dateColumn, 10),
    descriptionColumnIndex: parseInt(cached.descriptionColumn, 10),
    amountColumnIndex: cached.amountColumn !== null ? parseInt(cached.amountColumn, 10) : -1,
    inflowColumnIndex: cached.inflowColumn !== null ? parseInt(cached.inflowColumn, 10) : -1,
    outflowColumnIndex: cached.outflowColumn !== null ? parseInt(cached.outflowColumn, 10) : -1,
  };
}

function configFromAi(ai: AiMappingResponse): ParseConfig {
  return {
    headerRowIndex: ai.headerRowIndex,
    detectedBankName: ai.detectedBankName,
    dateColumnIndex: ai.dateColumnIndex,
    descriptionColumnIndex: ai.descriptionColumnIndex,
    amountColumnIndex: ai.amountColumnIndex ?? -1,
    inflowColumnIndex: ai.inflowColumnIndex ?? -1,
    outflowColumnIndex: ai.outflowColumnIndex ?? -1,
  };
}

// ─── Zod Validation ───────────────────────────────────────────────────────────

const ingestionRowSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1).default('Uncategorised'),
  description: z.string().nullable().optional(),
  date: z.date(),
  source: z.literal('BANK_STATEMENT'),
  paymentMethod: z.literal('TRANSFER'),
  direction: z.enum(['INFLOW', 'OUTFLOW']),
  status: z.literal('COMPLETED'),
});

// ─── Main Route Handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return errorResponse('No file uploaded', 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('File size exceeds the 5MB limit', 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
      return errorResponse('Invalid file format. Only .csv, .xls, and .xlsx files are accepted.', 400);
    }

    // ── 1. Parse file into raw 2D rows ─────────────────────────────────────
    let rows: string[][];
    try {
      rows = await parseFileToRows(file);
    } catch (parseErr) {
      return errorResponse((parseErr as Error).message, 400);
    }
    if (rows.length < 2) {
      return errorResponse('The uploaded file contains no data rows.', 400);
    }

    // ── 2. Detect header row and build fingerprint ─────────────────────────
    const { headerRowIndex: detectedHeaderRow, headers } = detectHeaderRow(rows);
    const hasHeaders = detectedHeaderRow >= 0;

    // Build a unique fingerprint:
    // - If headers found: based on sorted column names (stable across time)
    // - If no headers: based on the structural pattern of the first data row
    const signature = hasHeaders
      ? buildHeaderSignature(headers)
      : buildDataSignature(rows[0]);

    // ── 3. Resolve Parse Config ────────────────────────────────────────────
    let config: ParseConfig | null = null;
    let cacheHit = false;

    // Phase 1: Known template detection first
    const opayConfig = detectOpayLayout(rows);
    if (opayConfig) {
      console.log('[upload] Phase 1: Deterministic OPay layout detected.');
      config = opayConfig;
    }

    // Phase 2: Keyword header detection second
    if (!config && hasHeaders) {
      const headerConfig = detectLayoutByHeaders(headers, detectedHeaderRow);
      if (headerConfig) {
        console.log('[upload] Phase 2: Confident keyword-based header layout detected.');
        config = headerConfig;
      }
    }

    // Phase 3: Template cache lookup third
    if (!config) {
      const cached = await prisma.statementTemplate.findUnique({
        where: { headersSignature: signature },
      });

      if (cached) {
        console.log(`[upload] Phase 3: Template cache HIT for: ${cached.detectedBankName ?? signature}`);
        config = configFromCache(cached);
        cacheHit = true;
      }
    }

    // Phase 4: Gemini fallback fourth
    if (!config) {
      console.log(`[upload] Phase 4: Cache MISS. Invoking Gemini fallback. hasHeaders=${hasHeaders}`);

      // Build a numbered snippet so Gemini can identify rows by index
      const snippet = rows
        .slice(0, 15)
        .map((r, i) => `Row ${i}: ${r.map((c) => String(c).trim()).join(' | ')}`)
        .join('\n');

      let aiResult: AiMappingResponse | null = null;
      let aiSucceeded = false;

      try {
        aiResult = await askGeminiForMapping(snippet, hasHeaders);
        aiSucceeded = true;
        console.log(`[upload] Gemini mapped: ${JSON.stringify(aiResult)}`);
      } catch (aiErr) {
        console.error('[upload] Gemini failed, falling back:', aiErr);
      }

      if (aiSucceeded && aiResult) {
        const potentialConfig = configFromAi(aiResult);
        try {
          validateParseConfig(potentialConfig, rows);
          config = potentialConfig;
        } catch (validationError) {
          console.warn('[upload] AI configuration failed validation:', validationError);
          aiSucceeded = false;
        }
      }

      if (aiSucceeded && aiResult && config) {
        // Persist for future uploads of the same layout
        try {
          await prisma.statementTemplate.create({
            data: {
              headersSignature: signature,
              detectedBankName: aiResult.detectedBankName ?? null,
              headerRowIndex: aiResult.headerRowIndex,
              dateColumn: String(aiResult.dateColumnIndex),
              descriptionColumn: String(aiResult.descriptionColumnIndex),
              amountColumn: (aiResult.amountColumnIndex ?? -1) >= 0
                ? String(aiResult.amountColumnIndex)
                : null,
              inflowColumn: (aiResult.inflowColumnIndex ?? -1) >= 0
                ? String(aiResult.inflowColumnIndex)
                : null,
              outflowColumn: (aiResult.outflowColumnIndex ?? -1) >= 0
                ? String(aiResult.outflowColumnIndex)
                : null,
            },
          });
          console.log(`[upload] Template saved for: ${aiResult.detectedBankName ?? 'Unknown Bank'}`);
        } catch (saveErr) {
          console.warn('[upload] Could not persist template:', saveErr);
        }
      }
    }

    // Phase 5: Absolute heuristic fallback
    if (!config) {
      console.log('[upload] Phase 5: Using default/heuristic fallback.');
      const hdrRow = hasHeaders ? rows[detectedHeaderRow] : rows[0];
      const fi = (keyword: string) =>
        hdrRow.findIndex((h) => h.trim().toLowerCase().includes(keyword));

      const dateIdx = fi('date') >= 0 ? fi('date') : fi('value dat');
      const descIdx = fi('narration') >= 0 ? fi('narration')
        : fi('description') >= 0 ? fi('description')
        : fi('remark') >= 0 ? fi('remark')
        : fi('particulars');
      const amtIdx = fi('amount') >= 0 ? fi('amount') : fi('tran');
      const inflowIdx = fi('credit') >= 0 ? fi('credit') : fi('deposit');
      const outflowIdx = fi('debit') >= 0 ? fi('debit') : fi('withdrawal');

      const useSplit = inflowIdx >= 0 && outflowIdx >= 0;
      config = {
        headerRowIndex: hasHeaders ? detectedHeaderRow : 0,
        dateColumnIndex: dateIdx >= 0 ? dateIdx : 0,
        descriptionColumnIndex: descIdx >= 0 ? descIdx : 1,
        amountColumnIndex: useSplit ? -1 : (amtIdx >= 0 ? amtIdx : -1),
        inflowColumnIndex: useSplit ? inflowIdx : -1,
        outflowColumnIndex: useSplit ? outflowIdx : -1,
      };

      // Also validate heuristic config bounds
      try {
        validateParseConfig(config, rows);
      } catch (hError) {
        console.error('[upload] Heuristic config is invalid:', hError);
        // absolute fallback
        config = {
          headerRowIndex: hasHeaders ? detectedHeaderRow : 0,
          dateColumnIndex: 0,
          descriptionColumnIndex: Math.min(rows[0].length - 1, 2),
          amountColumnIndex: -1,
          inflowColumnIndex: Math.min(rows[0].length - 1, 4),
          outflowColumnIndex: Math.min(rows[0].length - 1, 3),
        };
      }
    }

    // ── 4. Validate resolved config & slice data rows ──────────────────────
    try {
      validateParseConfig(config, rows);
    } catch (validationErr) {
      console.error('[upload] Final configuration validation failed:', validationErr);
      return errorResponse(`Could not map the file structure: ${(validationErr as Error).message}`, 400);
    }

    const dataRows = rows.slice(config.headerRowIndex + 1);

    /** Mirrors the Transaction model fields accepted by createMany. */
    interface IngestionRow {
      merchantId: string;
      amount: number;
      type: string;
      category: string;
      description?: string | null;
      date: Date;
      source: string;
      paymentMethod: string;
      direction: string;
      status: string;
    }
    const validRows: IngestionRow[] = [];
    interface RowError {
      row: number;
      errors: Record<string, string[]>;
      raw: unknown;
    }
    const errors: RowError[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.every((c) => !c || String(c).trim() === '')) continue;

      const rawDate = config.dateColumnIndex >= 0 ? row[config.dateColumnIndex] : undefined;
      const rawDesc = config.descriptionColumnIndex >= 0 ? row[config.descriptionColumnIndex] : undefined;

      let amount = 0;
      let direction: 'INFLOW' | 'OUTFLOW' = 'INFLOW';

      if (config.amountColumnIndex >= 0) {
        // Single signed-value column
        const raw = row[config.amountColumnIndex];
        amount = parseAmount(raw);
        direction = isSignedNegative(raw) ? 'OUTFLOW' : 'INFLOW';
      } else if (config.inflowColumnIndex >= 0 || config.outflowColumnIndex >= 0) {
        // Split credit/debit columns — "--" means N/A for that column
        const rawInflow = config.inflowColumnIndex >= 0 ? row[config.inflowColumnIndex] : '';
        const rawOutflow = config.outflowColumnIndex >= 0 ? row[config.outflowColumnIndex] : '';
        const inflowAmt = parseAmount(rawInflow);
        const outflowAmt = parseAmount(rawOutflow);

        if (outflowAmt > 0) {
          amount = outflowAmt;
          direction = 'OUTFLOW';
        } else {
          amount = inflowAmt;
          direction = 'INFLOW';
        }
      }

      // Skip balance rows, separator rows, and sub-headers (zero-amount rows)
      if (amount <= 0) continue;

      const candidate = {
        amount,
        type: direction === 'INFLOW' ? ('INCOME' as const) : ('EXPENSE' as const),
        category: autoCategorize(rawDesc ? String(rawDesc).trim() : '', direction),
        description: rawDesc ? String(rawDesc).trim() || null : null,
        date: parseDate(rawDate),
        source: 'BANK_STATEMENT' as const,
        paymentMethod: 'TRANSFER' as const,
        direction,
        status: 'COMPLETED' as const,
      };

      const result = ingestionRowSchema.safeParse(candidate);
      if (result.success) {
        validRows.push({ merchantId, ...result.data });
      } else {
        errors.push({
          row: i + config.headerRowIndex + 2,
          errors: result.error.flatten().fieldErrors,
          raw: row,
        });
      }
    }

    // ── 6. Bulk insert valid rows ──────────────────────────────────────────
    if (validRows.length > 0) {
      await prisma.transaction.createMany({ data: validRows });

      return successResponse({
        insertedCount: validRows.length,
        failedCount: errors.length,
        errors,
        preview: validRows.slice(0, 5),
        detectedBank: config.detectedBankName ?? null,
        templateCacheHit: cacheHit,
        ...(process.env.NODE_ENV === 'development' ? {
          mappingDebug: {
            headerRowIndex: config.headerRowIndex,
            dateColumnIndex: config.dateColumnIndex,
            descriptionColumnIndex: config.descriptionColumnIndex,
            amountColumnIndex: config.amountColumnIndex,
            inflowColumnIndex: config.inflowColumnIndex,
            outflowColumnIndex: config.outflowColumnIndex,
            sampleDataRow: rows[config.headerRowIndex + 1] || null,
          }
        } : {}),
      });
    } else {
      return successResponse({
        insertedCount: 0,
        failedCount: errors.length,
        errors,
        preview: [],
        detectedBank: config.detectedBankName ?? null,
        templateCacheHit: cacheHit,
        warning: 'No transaction rows were extracted. Please check your column mappings or upload template.',
        mappingDebug: {
          headerRowIndex: config.headerRowIndex,
          dateColumnIndex: config.dateColumnIndex,
          descriptionColumnIndex: config.descriptionColumnIndex,
          amountColumnIndex: config.amountColumnIndex,
          inflowColumnIndex: config.inflowColumnIndex,
          outflowColumnIndex: config.outflowColumnIndex,
          sampleDataRow: rows[config.headerRowIndex + 1] || null,
        }
      });
    }
  } catch (err) {
    const error = err as Error;
    console.error('[upload] Unhandled error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
