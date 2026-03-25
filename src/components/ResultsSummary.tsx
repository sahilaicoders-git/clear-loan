import { useState } from 'react';
import type { LoanResults, LoanInputs } from '../utils/loanCalculator';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../utils/supabase';
import { Bookmark, Check, Loader2 } from 'lucide-react';

interface Props {
  results: LoanResults;
  hasPrepayment: boolean;
  inputs: LoanInputs;
}

export function ResultsSummary({ results, hasPrepayment, inputs }: Props) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const emiLabel = results.isMudra ? 'First Instalment' : 'Standard EMI';
  const emiSubLabel = results.isMudra ? 'Decreasing Monthly' : 'Fixed Obligation';

  const handleSave = async () => {
    if (!user) return;
    
    const name = window.prompt("Enter a name for this saved calculation:", "Dream Home Loan");
    if (!name) return;

    setIsSaving(true);
    const { error } = await supabase.from('loans').insert({
      user_id: user.id,
      name,
      principal: inputs.principal,
      annual_interest_rate: inputs.annualInterestRate,
      tenure_years: inputs.tenureYears,
      monthly_prepayment: inputs.monthlyPrepayment,
      start_date: inputs.startDate,
      category: inputs.category
    });

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Error saving: " + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-enter delay-100">
         <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-900 text-white rounded-3xl shadow-xl shadow-indigo-500/20 flex flex-col items-center justify-center p-8 transition-all overflow-hidden relative group">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none"></div>
            <p className="text-indigo-100 text-[10px] font-extrabold uppercase tracking-widest mb-1.5 transition-colors relative z-10">{emiSubLabel}</p>
            <h2 className="text-4xl md:text-5xl font-black m-0 tracking-tighter relative z-10">{formatCurrency(results.monthlyEmi)}</h2>
            <p className="text-xs text-indigo-50 mt-2 font-black uppercase tracking-widest transition-colors relative z-10">{emiLabel}</p>
         </div>
         
         <div className="bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl rounded-3xl shadow-lg shadow-gray-200/40 dark:shadow-none ring-1 ring-gray-900/5 dark:ring-white/10 flex flex-col items-center justify-center p-8 transition-colors hover:shadow-xl">
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-extrabold uppercase tracking-widest mb-1.5 transition-colors">Total Interest Burden</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white m-0 tracking-tighter transition-colors">{formatCurrency(results.totalInterestStandard)}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-black uppercase tracking-widest transition-colors">Total Outflow: {formatCurrency(results.totalPaymentStandard)}</p>
         </div>

         {hasPrepayment ? (
           <div className="bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-600 dark:to-teal-800 text-white rounded-3xl shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center p-8 transition-colors relative overflow-hidden group">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none"></div>
              <p className="text-emerald-50 text-[10px] font-extrabold uppercase tracking-widest mb-1.5 transition-colors relative z-10">Wealth Preserved</p>
              <h2 className="text-3xl md:text-4xl font-black m-0 tracking-tighter relative z-10">{formatCurrency(results.interestSaved)}</h2>
              <div className="inline-flex mt-4 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm border border-white/20 relative z-10">
                 Avoided {Math.floor(results.monthsSaved / 12)}Y {results.monthsSaved % 12}M Wait
              </div>
           </div>
         ) : (
           <div className="bg-gray-50/50 dark:bg-white/5 rounded-3xl ring-1 ring-inset ring-gray-900/5 dark:ring-white/5 flex flex-col items-center justify-center p-8 transition-colors border-dashed border-2 border-gray-200 dark:border-white/10">
              <p className="text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-widest mb-2 transition-colors text-center">Prepayment Savings</p>
              <h2 className="text-xl font-bold text-gray-400/50 dark:text-gray-600/50 m-0 transition-colors">No Prepayment</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 transition-colors uppercase tracking-widest font-bold">Model extra payments to unlock.</p>
           </div>
         )}
      </div>

      {/* Floating Save Button */}
      {user && (
        <div className="absolute -top-4 -right-2 transform translate-x-2 -translate-y-2 z-10">
          <button 
            onClick={handleSave}
            disabled={isSaving || saved}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all ${
              saved 
                ? 'bg-emerald-500 text-white scale-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 hover:-translate-y-1 dark:bg-white dark:text-indigo-900 border dark:border-white/10 dark:hover:bg-gray-200'
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Bookmark size={16} />}
            {saved ? 'Saved!' : 'Save Calculation'}
          </button>
        </div>
      )}
    </div>
  );
}
