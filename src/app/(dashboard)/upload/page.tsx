'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  Loader2,
  HelpCircle,
  Info,
  AlertCircle
} from 'lucide-react';
import {
  uploadTransactions,
  downloadSampleCsv,
  type UploadResponse,
  type UploadRowError
} from '@/lib/upload-client';
import { useToast } from '@/components/ui/toast';

function fmt(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const statusBadge: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PENDING: 'bg-amber-50   text-amber-700   border-amber-100',
  FAILED: 'bg-red-50     text-red-600     border-red-100',
};

export default function UploadPage() {
  const { success, error: toastError, warning } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  
  const [error, setError] = useState<string | null>(null);
  
  const [response, setResponse] = useState<UploadResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const triggerFileInput = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  
  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    
    
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      const msg = 'Invalid file format. Only .csv files are accepted.';
      setError(msg);
      toastError(msg);
      setFile(null);
      return;
    }

    
    if (selectedFile.size > 5 * 1024 * 1024) {
      const msg = 'File size exceeds the 5MB limit.';
      setError(msg);
      toastError(msg);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await uploadTransactions(file);
      setResponse(res);
      
      if (res.failedCount === 0) {
        success(`${res.insertedCount} transactions successfully imported.`);
      } else if (res.insertedCount > 0) {
        warning(`Imported ${res.insertedCount} transactions, but ${res.failedCount} rows failed validation.`);
      } else {
        warning(`All ${res.failedCount} rows failed validation. Check error details below.`);
      }
      
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload and parse file.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  
  const handleDownloadSample = async () => {
    setDownloading(true);
    try {
      await downloadSampleCsv();
      success('Sample CSV template downloaded successfully.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to download sample CSV.');
    } finally {
      setDownloading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setError(null);
    setResponse(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload transaction data</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Import your bank, POS, or wallet transaction records to generate business insights.
          </p>
        </div>
        <button
          onClick={handleDownloadSample}
          disabled={downloading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700
            border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shrink-0 disabled:bg-slate-50 disabled:text-slate-400"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <Download className="w-4 h-4 text-slate-500" />
          )}
          Download sample CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 space-y-6">
          
          
          {!response ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
              
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center
                  ${isDragActive 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  } ${loading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <UploadCloud className={`w-6 h-6 ${isDragActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                
                <h3 className="font-semibold text-slate-800 text-sm">
                  Drag and drop your CSV here, or <span className="text-emerald-600 hover:underline">browse</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supported format: .csv only • Maximum size: 5MB
                </p>
              </div>

              
              {file && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-slate-100 rounded-md shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    disabled={loading}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-40"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-medium">Upload failed</p>
                    <p className="text-red-600/90 text-xs">{error}</p>
                  </div>
                </div>
              )}

              
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-emerald-600
                  hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading and validating...
                  </>
                ) : (
                  <>
                    Upload and analyze
                  </>
                )}
              </button>

            </div>
          ) : (
            
            <div className="space-y-6">
              
              
              <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {response.failedCount === 0 ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">
                      {response.failedCount === 0
                        ? 'Data import completed'
                        : 'Import completed with validation warnings'}
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Ingestion summary of the uploaded CSV transaction data.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Successfully Ingested</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{response.insertedCount}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">rows added to database</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Validation Failures</p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">{response.failedCount}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">rows skipped</p>
                  </div>
                </div>

                
                <div className="flex flex-col sm:flex-row items-center gap-2 border-t border-slate-100 pt-4">
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    View Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/transactions"
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    View Transactions
                  </Link>
                  <button
                    onClick={resetUpload}
                    className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                  >
                    Upload another file
                  </button>
                </div>
              </div>

              
              {response.insertedCount > 0 && response.preview.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden space-y-3 p-5 md:p-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Inserted Rows Preview</h3>
                    <p className="text-xs text-slate-500">Showing up to 5 successfully ingested transaction records.</p>
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-left">
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {response.preview.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(row.date)}</td>
                              <td className="px-4 py-2.5 text-slate-700 font-medium text-xs whitespace-nowrap">{row.category}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wider
                                  ${row.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                  {row.type}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{row.paymentMethod}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full uppercase ${statusBadge[row.status] ?? ''}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">
                                <span className={row.direction === 'INFLOW' ? 'text-emerald-700' : 'text-red-600'}>
                                  {row.direction === 'INFLOW' ? '+' : '-'}{fmt(row.amount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              
              {response.failedCount > 0 && response.errors.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-3">
                  <div>
                    <h3 className="font-semibold text-red-950 text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Row Validation Errors
                    </h3>
                    <p className="text-xs text-slate-500">Correct these errors in your source file and re-upload failed rows.</p>
                  </div>
                  
                  <div className="border border-red-100 rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left min-w-[600px]">
                        <thead>
                          <tr className="bg-red-50/50 border-b border-red-100 text-xs font-semibold text-red-900">
                            <th className="px-4 py-2">Row</th>
                            <th className="px-4 py-2">Field</th>
                            <th className="px-4 py-2">Error Details</th>
                            <th className="px-4 py-2">Raw Content</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {response.errors.flatMap((rowErr) => 
                            Object.entries(rowErr.errors).map(([field, msgs]) => (
                              <tr key={`${rowErr.row}-${field}`} className="hover:bg-red-50/20 text-xs">
                                <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">Row {rowErr.row}</td>
                                <td className="px-4 py-2.5 text-red-700 font-mono font-medium whitespace-nowrap">{field}</td>
                                <td className="px-4 py-2.5 text-red-600">{msgs.join(', ')}</td>
                                <td className="px-4 py-2.5 text-slate-500 font-mono truncate max-w-[200px]" title={JSON.stringify(rowErr.raw)}>
                                  {JSON.stringify(rowErr.raw)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        
        <div className="space-y-6">
          
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Required CSV Format</h3>
                <p className="text-xs text-slate-500">Your CSV file must include the following case-sensitive headers:</p>
              </div>
            </div>

            
            <div className="flex flex-wrap gap-1.5">
              {['date', 'type', 'category', 'amount', 'description', 'direction', 'paymentMethod', 'source', 'status'].map((col) => (
                <span key={col} className="px-2 py-0.5 text-[10px] font-mono bg-slate-50 text-slate-600 rounded border border-slate-200">
                  {col}
                </span>
              ))}
            </div>

            
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-700">Example Row:</p>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 overflow-x-auto text-[10px] font-mono text-slate-600 whitespace-nowrap">
                date,type,category,amount,description,direction,paymentMethod,source,status<br />
                2026-06-13,INCOME,Retail Sales,25000,POS sale,INFLOW,POS,POS,COMPLETED
              </div>
            </div>
          </div>

          
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Where can I get a CSV?</h3>
                <p className="text-xs text-slate-500">Common ways to export transaction data:</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex gap-2">
                <span className="text-emerald-500 font-semibold">•</span>
                <span>
                  <strong>POS Terminals:</strong> Export transaction statement spreadsheets from your POS dashboard (Moniepoint, OPay, etc.) as CSV.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-semibold">•</span>
                <span>
                  <strong>Bank Applications:</strong> Log into bank portal, navigate to Statement History, choose CSV export instead of PDF.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-semibold">•</span>
                <span>
                  <strong>Demo Mode:</strong> Use our sample template containing matching mock data to experiment.
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
