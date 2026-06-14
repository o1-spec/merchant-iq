export interface UploadRowError {
  row: number;
  errors: Record<string, string[]>;
  raw: Record<string, unknown>;
}

export interface UploadResponse {
  insertedCount: number;
  failedCount: number;
  errors: UploadRowError[];
  preview: Array<{
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string | null;
    date: string;
    source: 'CSV' | 'DEMO' | 'POS' | 'BANK_STATEMENT';
    paymentMethod: 'CASH' | 'TRANSFER' | 'POS' | 'WALLET';
    direction: 'INFLOW' | 'OUTFLOW';
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
  }>;
  /** Name of the bank/institution detected by AI or from cache. */
  detectedBank: string | null;
  /** True if the layout was resolved from the DB cache (no AI call made). */
  templateCacheHit: boolean;
}

export async function uploadTransactions(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/transactions/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to upload transaction data');
  }

  return json.data as UploadResponse;
}

export async function downloadSampleCsv(): Promise<void> {
  const res = await fetch('/api/demo/sample-csv', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to download sample CSV');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_transactions.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
