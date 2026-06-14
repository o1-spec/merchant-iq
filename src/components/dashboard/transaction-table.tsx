import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/lib/dashboard-client';

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

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-primary-light text-primary border-primary-light/40',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  FAILED: 'bg-red-50 text-red-700 border-red-100',
};

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-card-border rounded-2xl p-10 text-center">
        <p className="text-sm font-semibold text-slate-700">No transactions yet</p>
        <p className="text-xs text-slate-400 mt-1">Upload a CSV or connect your POS to see transaction history here.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-card-border rounded-2xl overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-card-border bg-slate-50/70">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                    {fmtDate(tx.date)}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-semibold whitespace-nowrap text-xs">
                    {tx.category}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs hidden sm:table-cell max-w-[200px] truncate">
                    {tx.description ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-bold tabular-nums">
                    <span className={tx.direction === 'INFLOW' ? 'text-slate-900' : 'text-red-600'}>
                      {tx.direction === 'INFLOW' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center hidden md:table-cell">
                    <span className={`inline-block text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusStyles[tx.status] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-400 font-medium">
            Showing <span className="font-semibold text-slate-700">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, transactions.length)}</span> of <span className="font-semibold text-slate-700">{transactions.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-250
                rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white hover:border-slate-350"
            >
              <ChevronLeft className="w-3.5 h-3.5" />Previous
            </button>
            <span className="text-xs font-bold text-slate-500 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-250
                rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white hover:border-slate-350"
            >
              Next<ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
