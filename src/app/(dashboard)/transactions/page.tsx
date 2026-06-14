'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Transaction,
  type TransactionFilters,
  type CreateTransactionPayload,
  type Pagination,
} from '@/lib/transactions-client';
import { useToast } from '@/components/ui/toast';

const LIMIT = 10;

const TYPES = ['INCOME', 'EXPENSE'] as const;
const DIRECTIONS = ['INFLOW', 'OUTFLOW'] as const;
const SOURCES = ['CSV', 'DEMO', 'POS', 'BANK_STATEMENT'] as const;
const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'POS', 'WALLET'] as const;
const STATUSES = ['COMPLETED', 'PENDING', 'FAILED'] as const;

function fmt(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const statusBadge: Record<string, string> = {
  COMPLETED: 'bg-primary-light text-primary border-primary-light/40',
  PENDING: 'bg-amber-50   text-amber-700   border-amber-100',
  FAILED: 'bg-red-50     text-red-600     border-red-100',
};

function TableSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex gap-6">
        {['Date', 'Description', 'Category', 'Type', 'Amount', 'Status', ''].map((h, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded w-16" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-slate-100 flex gap-6 items-center">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-3 bg-slate-100 rounded w-32" />
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-3 bg-slate-100 rounded w-16" />
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-3 bg-slate-100 rounded w-16" />
          <div className="h-3 bg-slate-100 rounded w-12" />
        </div>
      ))}
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">{children}</label>;
}

function Input({
  id, type = 'text', value, onChange, placeholder, disabled, className,
}: {
  id: string; type?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean; className?: string;
}) {
  return (
    <input
      id={id} type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900
        placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary
        focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-all ${className ?? ''}`}
    />
  );
}

function Select({
  id, value, onChange, options, disabled, placeholder,
}: {
  id: string; value: string; onChange: (v: string) => void;
  options: readonly string[] | string[]; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:bg-slate-50 disabled:text-slate-400 transition-all appearance-none pr-8 cursor-pointer font-semibold"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2050/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
}

const emptyForm = (): CreateTransactionPayload => ({
  amount: 0,
  type: 'INCOME',
  category: '',
  description: '',
  date: todayStr(),
  source: 'POS',
  paymentMethod: 'CASH',
  direction: 'INFLOW',
  status: 'COMPLETED',
});

function TransactionForm({
  initial,
  onSave,
  onCancel,
  saving,
  apiError,
}: {
  initial: CreateTransactionPayload;
  onSave: (p: CreateTransactionPayload) => void;
  onCancel: () => void;
  saving: boolean;
  apiError: string;
}) {
  const [form, setForm] = useState<CreateTransactionPayload>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTransactionPayload, string>>>({});

  function set<K extends keyof CreateTransactionPayload>(key: K, value: CreateTransactionPayload[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      
      if (key === 'type') {
        next.direction = value === 'INCOME' ? 'INFLOW' : 'OUTFLOW';
      }
      return next;
    });
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.amount || form.amount <= 0) e.amount = 'Amount must be greater than 0.';
    if (!form.category.trim()) e.category = 'Category is required.';
    if (!form.date) e.date = 'Date is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {apiError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f-amount">Amount (₦)</Label>
          <Input
            id="f-amount" type="number"
            value={form.amount === 0 ? '' : form.amount}
            onChange={(v) => set('amount', parseFloat(v) || 0)}
            placeholder="0" disabled={saving}
          />
          {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
        </div>
        <div>
          <Label htmlFor="f-date">Date</Label>
          <Input
            id="f-date" type="date"
            value={form.date ?? todayStr()}
            onChange={(v) => set('date', v)}
            disabled={saving}
          />
          {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
        </div>
      </div>

      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f-type">Type</Label>
          <Select
            id="f-type" value={form.type}
            onChange={(v) => set('type', v as 'INCOME' | 'EXPENSE')}
            options={TYPES} disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="f-direction">Direction</Label>
          <div
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed select-none"
            title="Direction is set automatically based on Type"
          >
            {form.direction}
          </div>
        </div>
      </div>

      
      <div>
        <Label htmlFor="f-category">Category</Label>
        <Input
          id="f-category" value={form.category}
          onChange={(v) => set('category', v)}
          placeholder="e.g. Stock Purchase, Sales" disabled={saving}
        />
        {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
      </div>
      <div>
        <Label htmlFor="f-desc">Description (optional)</Label>
        <Input
          id="f-desc" value={form.description ?? ''}
          onChange={(v) => set('description', v)}
          placeholder="Short note about this transaction" disabled={saving}
        />
      </div>

      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f-source">Source</Label>
          <Select id="f-source" value={form.source}
            onChange={(v) => set('source', v as CreateTransactionPayload['source'])}
            options={SOURCES} disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="f-pm">Payment Method</Label>
          <Select id="f-pm" value={form.paymentMethod}
            onChange={(v) => set('paymentMethod', v as CreateTransactionPayload['paymentMethod'])}
            options={PAYMENT_METHODS} disabled={saving}
          />
        </div>
      </div>

      
      <div>
        <Label htmlFor="f-status">Status</Label>
        <Select id="f-status" value={form.status}
          onChange={(v) => set('status', v as CreateTransactionPayload['status'])}
          options={STATUSES} disabled={saving}
        />
      </div>

      
      <div className="flex gap-2 justify-end pt-3 border-t border-card-border">
        <button
          type="button" onClick={onCancel}
          className="px-4 py-2.5 text-sm font-semibold text-slate-655 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:border-slate-350 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-primary hover:bg-primary-hover
            disabled:bg-slate-300 text-white rounded-xl transition-all cursor-pointer"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving…' : 'Save transaction'}
        </button>
      </div>
    </form>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div
        ref={ref}
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-card-border"
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-card-border">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function DeleteConfirm({
  tx, onConfirm, onCancel, deleting,
}: { tx: Transaction; onConfirm: () => void; onCancel: () => void; deleting: boolean }) {
  return (
    <Modal title="Delete transaction" onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="bg-slate-50/70 border border-card-border rounded-xl p-3.5 text-sm space-y-1.5 font-semibold text-slate-700">
          <p><span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Category:</span> {tx.category}</p>
          <p><span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Amount:</span> {fmt(tx.amount)}</p>
          <p><span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1.5">Date:</span> {fmtDate(tx.date)}</p>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onCancel} disabled={deleting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:border-slate-350 cursor-pointer"
          >
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700
              disabled:bg-slate-300 text-white rounded-xl transition-all cursor-pointer"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function TransactionsPage() {
  const { success, error: toastError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1, limit: LIMIT,
    type: '', direction: '', category: '', startDate: '', endDate: '',
  });

  
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState('');

  
  const load = useCallback(async (f: TransactionFilters) => {
    setLoading(true);
    setError('');
    try {
      const res = await getTransactions(f);
      setTransactions(res.transactions);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters); }, []);

  function applyFilters(next: Partial<TransactionFilters>) {
    const updated = { ...filters, ...next, page: 1 };
    setFilters(updated);
    load(updated);
  }

  function goToPage(p: number) {
    const updated = { ...filters, page: p };
    setFilters(updated);
    load(updated);
  }

  
  async function handleCreate(payload: CreateTransactionPayload) {
    setSaving(true);
    setModalError('');
    try {
      await createTransaction(payload);
      setShowAdd(false);
      load(filters);
      success('Transaction added successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create transaction.';
      setModalError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: CreateTransactionPayload) {
    if (!editTx) return;
    setSaving(true);
    setModalError('');
    try {
      await updateTransaction(editTx.id, payload);
      setEditTx(null);
      load(filters);
      success('Changes saved successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update transaction.';
      setModalError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTx) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTx.id);
      setDeleteTx(null);
      load(filters);
      success('Transaction deleted successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete transaction.';
      setError(msg);
      toastError(msg);
      setDeleteTx(null);
    } finally {
      setDeleting(false);
    }
  }

  
  return (
    <div className="space-y-6 max-w-[1200px]">

      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-card-border">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Manage the records MerchantIQ uses to understand your business.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200
              hover:bg-slate-50 rounded-xl transition-all bg-white hover:border-slate-350"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </Link>
          <button
            onClick={() => { setModalError(''); setShowAdd(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold bg-primary
              hover:bg-primary-hover text-white rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add transaction
          </button>
        </div>
      </div>

      <div className="bg-white border border-card-border rounded-2xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          <div>
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Type</label>
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) => applyFilters({ type: e.target.value as TransactionFilters['type'] })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none
                  focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none pr-8 cursor-pointer font-semibold"
              >
                <option value="">All types</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          
          <div>
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Direction</label>
            <div className="relative">
              <select
                value={filters.direction}
                onChange={(e) => applyFilters({ direction: e.target.value as TransactionFilters['direction'] })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none
                  focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none pr-8 cursor-pointer font-semibold"
              >
                <option value="">All directions</option>
                {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Category</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={filters.category}
                onChange={(e) => applyFilters({ category: e.target.value })}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none
                  focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          
          <div>
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => applyFilters({ startDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none
                focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          
          <div>
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">To</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => applyFilters({ endDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none
                focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          
          <div className="flex items-end">
            <button
              onClick={() => {
                const cleared = { page: 1, limit: LIMIT, type: '' as const, direction: '' as const, category: '', startDate: '', endDate: '' };
                setFilters(cleared);
                load(cleared);
              }}
              className="w-full px-3 py-2 text-sm font-bold text-slate-500 border border-slate-200
                rounded-xl hover:bg-slate-50 transition-all hover:border-slate-350 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="font-semibold text-slate-800">Failed to load transactions</p>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={() => load(filters)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-800">No transactions yet</p>
          <p className="text-sm text-slate-500">Add a transaction or upload a CSV to begin.</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Add transaction
            </button>
            <span className="text-slate-300">·</span>
            <Link href="/upload" className="text-sm font-semibold text-emerald-700 hover:underline">
              Upload CSV
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white border border-card-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-card-border bg-slate-50/70">
                    {['Date', 'Description', 'Category', 'Type', 'Direction', 'Method', 'Status', 'Amount', ''].map((h) => (
                      <th key={h} className={`px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider
                        ${h === 'Amount' || h === '' ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">{fmtDate(tx.date)}</td>
                      <td className="px-5 py-4 text-slate-800 font-semibold max-w-[180px] truncate" title={tx.description ?? ''}>
                        {tx.description ?? <span className="text-slate-300 font-normal">—</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-semibold whitespace-nowrap text-xs">{tx.category}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider
                          ${tx.type === 'INCOME' ? 'bg-primary-light text-primary border-primary-light/40' : 'bg-orange-50 text-orange-700 border-orange-100/50'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-550 text-xs font-semibold whitespace-nowrap">{tx.direction}</td>
                      <td className="px-5 py-4 text-slate-550 text-xs font-semibold whitespace-nowrap">{tx.paymentMethod}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusBadge[tx.status] ?? ''}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold tabular-nums whitespace-nowrap">
                        <span className={tx.direction === 'INFLOW' ? 'text-slate-900' : 'text-red-600'}>
                          {tx.direction === 'INFLOW' ? '+' : '-'}{fmt(tx.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setModalError(''); setEditTx(tx); }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTx(tx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-400 font-medium">
                Showing <span className="font-semibold text-slate-750">{((pagination.page - 1) * pagination.limit) + 1}</span>–
                <span className="font-semibold text-slate-750">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-slate-750">{pagination.total}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-605 border border-slate-200
                    rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white hover:border-slate-350 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />Previous
                </button>
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-605 border border-slate-200
                    rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white hover:border-slate-350 cursor-pointer"
                >
                  Next<ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      
      {showAdd && (
        <Modal title="Add transaction" onClose={() => setShowAdd(false)}>
          <TransactionForm
            initial={emptyForm()}
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
            saving={saving}
            apiError={modalError}
          />
        </Modal>
      )}

      
      {editTx && (
        <Modal title="Edit transaction" onClose={() => setEditTx(null)}>
          <TransactionForm
            initial={{
              amount: editTx.amount,
              type: editTx.type,
              category: editTx.category,
              description: editTx.description ?? '',
              date: editTx.date.slice(0, 10),
              source: editTx.source,
              paymentMethod: editTx.paymentMethod,
              direction: editTx.direction,
              status: editTx.status,
            }}
            onSave={handleUpdate}
            onCancel={() => setEditTx(null)}
            saving={saving}
            apiError={modalError}
          />
        </Modal>
      )}

      
      {deleteTx && (
        <DeleteConfirm
          tx={deleteTx}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTx(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

function Receipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  );
}
