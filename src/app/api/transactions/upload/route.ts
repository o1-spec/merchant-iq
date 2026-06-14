import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import Papa from 'papaparse';
import { z } from 'zod';

const csvRowSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional().nullable(),
  date: z.date(),
  source: z.enum(['CSV', 'DEMO', 'POS', 'BANK_STATEMENT']),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'POS', 'WALLET']),
  direction: z.enum(['INFLOW', 'OUTFLOW']),
  status: z.enum(['COMPLETED', 'PENDING', 'FAILED']),
});

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

    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return errorResponse('Invalid file format. Only .csv files are accepted.', 400);
    }

    const csvText = await file.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    
    const requiredHeaders = ['amount', 'type', 'category', 'direction', 'paymentMethod', 'source', 'status'];
    const headers = parsed.meta.fields || [];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return errorResponse(`Missing required CSV headers: ${missingHeaders.join(', ')}`, 400);
    }

    type CreateManyData = NonNullable<Parameters<typeof prisma.transaction.createMany>[0]>['data'];
    type IngestionRow = Extract<CreateManyData, { amount: number }>;
    const validRows: IngestionRow[] = [];
    interface CSVError {
      row: number;
      errors: Record<string, string[]>;
      raw: unknown;
    }
    const errors: CSVError[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i] as {
        amount?: unknown;
        date?: unknown;
        type?: unknown;
        category?: unknown;
        description?: unknown;
        source?: unknown;
        paymentMethod?: unknown;
        direction?: unknown;
        status?: unknown;
      };
      
      
      if (!row || Object.values(row).every(v => v === undefined || v === '')) {
        continue;
      }

      
      const rawAmount = row.amount;
      const amount = typeof rawAmount === 'number' ? rawAmount : Number(String(rawAmount || '').replace(/,/g, '').trim());

      
      const rawDate = row.date;
      let date: Date | null = null;
      if (rawDate instanceof Date) {
        date = rawDate;
      } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          date = d;
        }
      }
      if (!date) {
        date = new Date();
      }

      const cleanedRow = {
        amount,
        type: String(row.type || '').toUpperCase().trim(),
        category: String(row.category || '').trim(),
        description: row.description ? String(row.description).trim() : null,
        date,
        source: String(row.source || 'CSV').toUpperCase().trim(),
        paymentMethod: String(row.paymentMethod || 'CASH').toUpperCase().trim(),
        direction: String(row.direction || '').toUpperCase().trim(),
        status: String(row.status || 'COMPLETED').toUpperCase().trim(),
      };

      const result = csvRowSchema.safeParse(cleanedRow);
      if (result.success) {
        validRows.push({
          merchantId,
          amount: result.data.amount,
          type: result.data.type,
          category: result.data.category,
          description: result.data.description,
          date: result.data.date,
          source: result.data.source,
          paymentMethod: result.data.paymentMethod,
          direction: result.data.direction,
          status: result.data.status,
        });
      } else {
        errors.push({
          row: i + 1,
          errors: result.error.flatten().fieldErrors,
          raw: row,
        });
      }
    }

    if (validRows.length > 0) {
      await prisma.transaction.createMany({
        data: validRows,
      });
    }

    return successResponse({
      insertedCount: validRows.length,
      failedCount: errors.length,
      errors,
      preview: validRows.slice(0, 5),
    });
  } catch (err) {
    const error = err as Error;
    console.error('CSV upload ingestion error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
