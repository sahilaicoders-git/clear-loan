import { useState } from 'react';
import { Download, Save } from 'lucide-react';
import type { AmortizationRow } from '../utils/loanCalculator';

interface Props {
  data: AmortizationRow[];
  interactive?: boolean;
  oneTimePrepayments?: Record<number, number>;
  onPrepaymentChange?: (month: number, amount: number) => void;
  onSavePrepayment?: (month: number) => void;
}

export function AmortizationTable({ data, interactive = false, oneTimePrepayments, onPrepaymentChange, onSavePrepayment }: Props) {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');

  // If running yearly view, filter out entries so we only show the last month of each year
  const displayData = viewMode === 'yearly' 
    ? data.filter(row => row.month % 12 === 0 || row.month === data.length)
    : data;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const handleExportCSV = () => {
    const headers = ['Period', 'Principal Paid', 'Interest Paid', 'Prepayment', 'Remaining Balance'];
    const csvRows = displayData.map(row => {
      const period = viewMode === 'yearly' ? row.date.getFullYear().toString() : row.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return [
        period,
        row.principalPaid.toFixed(2),
        row.interestPaid.toFixed(2),
        row.prepayment.toFixed(2),
        row.balance.toFixed(2)
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `amortization_schedule_${viewMode}.csv`;
    link.click();
  };

  return (
    <div className="w-full animate-enter">
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white dark:bg-[#18181b] border-b border-gray-100 dark:border-white/10 gap-4 transition-colors">
        
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg shadow-sm transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>

        <div className="inline-flex bg-gray-100 dark:bg-black/40 rounded-full p-1 border border-gray-200/50 dark:border-white/5 transition-colors">
          <button 
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'yearly' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}
            onClick={() => setViewMode('yearly')}
          >
            Yearly
          </button>
          <button 
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}
            onClick={() => setViewMode('monthly')}
          >
            Month-wise
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto max-h-[500px] custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-[#09090b] sticky top-0 z-20 shadow-sm transition-colors">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">Period</th>
              <th className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">Principal</th>
              <th className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">Interest</th>
              <th className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10">Paid</th>
              {interactive && viewMode === 'monthly' && (
                 <th className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-wider border-b border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 transition-colors">Extra Inject</th>
              )}
              <th className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/10 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#18181b] transition-colors">
            {displayData.map((row, index) => {
              const rowYear = row.date.getFullYear();
              const rowMonth = row.date.getMonth();
              
              const isPast = rowYear < currentYear || (rowYear === currentYear && rowMonth < currentMonth);
              const isCurrent = rowYear === currentYear && rowMonth === currentMonth;

              return (
              <tr 
                key={index} 
                className={`transition-all duration-300
                  ${isPast ? 'opacity-40 bg-gray-50/50 dark:bg-white/[0.02] grayscale hover:opacity-100 hover:grayscale-0' : ''}
                  ${isCurrent ? 'bg-indigo-50/80 dark:bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30 relative z-10 shadow-sm' : !isPast ? 'hover:bg-indigo-50/50 dark:hover:bg-white/5' : ''}
                `}
              >
                <td className={`px-2 sm:px-4 py-3 text-[11px] sm:text-sm font-bold border-b border-gray-100 dark:border-white/5 flex items-center gap-1.5 sm:gap-2 ${isCurrent ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {viewMode === 'yearly' ? row.date.getFullYear().toString() : row.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {isCurrent && viewMode === 'monthly' && (
                    <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative" title="Current Active Month">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
                    </span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-3 text-[11px] sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-white/5 tracking-tight">{formatCurrency(row.principalPaid)}</td>
                <td className="px-2 sm:px-4 py-3 text-[11px] sm:text-sm font-bold text-rose-500 dark:text-rose-400 border-b border-gray-100 dark:border-white/5 tracking-tight">{formatCurrency(row.interestPaid)}</td>
                <td className="px-2 sm:px-4 py-3 text-[11px] sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 border-b border-gray-100 dark:border-white/5 tracking-tight">{formatCurrency(row.prepayment)}</td>
                
                {interactive && viewMode === 'monthly' && (
                  <td className="px-2 sm:px-4 py-2 border-b border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5 transition-colors">
                    <div className="flex flex-row items-center gap-1.5">
                      <div className="relative flex items-center w-[85px] sm:w-[110px] focus-within:ring-2 focus-within:ring-emerald-500 rounded shadow-sm">
                        <span className="absolute left-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] sm:text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={oneTimePrepayments?.[row.month] || ''}
                          onChange={(e) => onPrepaymentChange?.(row.month, parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-[#18181b] border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-100 text-[11px] sm:text-sm font-black rounded py-1.5 sm:py-2 pl-5 sm:pl-6 pr-1 sm:pr-2 focus:outline-none transition-colors hide-spin-button"
                          placeholder="0"
                        />
                      </div>
                      <button 
                        onClick={() => onSavePrepayment?.(row.month)} 
                        className="shrink-0 p-1.5 sm:p-2 bg-emerald-600 dark:bg-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-500/40 text-white dark:text-emerald-400 rounded transition-all shadow-sm active:scale-95"
                        title="Sync Payment to Vault"
                      >
                        <Save size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                )}

                <td className="px-2 sm:px-4 py-3 text-[11px] sm:text-sm font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 text-right tracking-tight">{formatCurrency(row.balance)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
