import type { Dispatch, SetStateAction } from 'react';
import type { LoanInputs } from '../utils/loanCalculator';
import { Banknote, Percent, Calendar, Rocket, IndianRupee } from 'lucide-react';

interface Props {
  inputs: LoanInputs;
  setInputs: Dispatch<SetStateAction<LoanInputs>>;
}

export function CalculatorForm({ inputs, setInputs }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === 'startDate' ? value : (parseFloat(value) || 0)
    }));
  };

  const inputContainerClass = "flex items-center bg-white dark:bg-[#18181b] ring-1 ring-gray-900/5 dark:ring-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 transition-all overflow-hidden shadow-sm hover:shadow-md group/input";
  const labelClass = "block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 transition-colors";
  const inputClass = "w-full bg-transparent border-none py-4 px-3 font-black text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-700 transition-colors";
  const iconWrapperClass = "pl-4 text-indigo-500 dark:text-indigo-400 transition-transform group-focus-within/input:scale-110 group-focus-within/input:-rotate-6 duration-300";

  return (
    <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-white dark:border-white/5 p-6 md:p-8 relative overflow-hidden group transition-colors">
      {/* Decorative ambient gradient inside the card */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-10 dark:opacity-5 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity duration-1000" />
      
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner dark:shadow-none transition-colors">
          <Banknote size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Loan Parameters</h2>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-1 transition-colors">Adjust your model in real-time.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6 relative z-10">
        <div className="md:col-span-2">
          <label className={labelClass}>Asset Category</label>
          <div className="flex flex-wrap gap-1.5 bg-gray-100/50 dark:bg-[#09090b]/50 p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-inner">
            {['Home Loan', 'Personal Loan', 'Auto Loan', 'Credit Card', 'Other'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setInputs(prev => ({ ...prev, category: cat }))}
                className={`flex-auto px-4 py-3 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all ${inputs.category === cat ? 'bg-white dark:bg-[#18181b] text-gray-900 dark:text-white shadow ring-1 ring-gray-900/5 dark:ring-white/10' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="principal">Total Principal</label>
          <div className={inputContainerClass}>
            <div className={iconWrapperClass}><IndianRupee size={20} strokeWidth={2.5} /></div>
            <input 
              className={inputClass}
              type="number" 
              id="principal"
              name="principal"
              value={inputs.principal || ''}
              onChange={handleChange}
              placeholder="5000000"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="startDate">Start Date</label>
          <div className={inputContainerClass}>
            <div className={iconWrapperClass}><Calendar size={18} strokeWidth={2.5} /></div>
            <input 
              className={inputClass}
              type="date" 
              id="startDate"
              name="startDate"
              value={inputs.startDate || ''}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="annualInterestRate">Interest Rate</label>
          <div className={inputContainerClass}>
            <div className={iconWrapperClass}><Percent size={18} strokeWidth={2.5} /></div>
            <input 
              className={inputClass}
              type="number" 
              id="annualInterestRate"
              name="annualInterestRate"
              value={inputs.annualInterestRate || ''}
              onChange={handleChange}
              placeholder="8.5"
              step="0.01"
              min="0"
            />
            <span className="pr-4 font-bold text-gray-400 dark:text-gray-600 select-none">%</span>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="tenureYears">Loan Tenure</label>
          <div className={inputContainerClass}>
            <div className={iconWrapperClass}><Calendar size={18} strokeWidth={2.5} /></div>
            <input 
              className={inputClass}
              type="number" 
              id="tenureYears"
              name="tenureYears"
              value={inputs.tenureYears || ''}
              onChange={handleChange}
              placeholder="20"
              min="0"
            />
            <span className="pr-4 font-bold text-gray-400 dark:text-gray-600 select-none">Yrs</span>
          </div>
        </div>

        <div className="md:col-span-2 pt-8 mt-4 border-t border-gray-100/80 dark:border-white/5 transition-colors">
          <label className={labelClass}>Amortization Engine</label>
          <div className="flex bg-gray-100/50 dark:bg-[#09090b]/50 p-1.5 rounded-2xl w-full lg:w-fit border border-gray-200/50 dark:border-white/5 shadow-inner mb-10 overflow-hidden">
            <button
              type="button"
              onClick={() => setInputs(prev => ({ ...prev, calcMethod: 'standard' }))}
              className={`flex-1 lg:px-12 py-3 text-[10px] font-black rounded-xl transition-all tracking-widest uppercase ${inputs.calcMethod === 'standard' ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow ring-1 ring-gray-900/5 dark:ring-white/10' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Standard EMI
            </button>
            <button
              type="button"
              onClick={() => setInputs(prev => ({ ...prev, calcMethod: 'mudra' }))}
              className={`flex-1 lg:px-12 py-3 text-[10px] font-black rounded-xl transition-all tracking-widest uppercase ${inputs.calcMethod === 'mudra' ? 'bg-white dark:bg-[#18181b] text-emerald-600 dark:text-emerald-400 shadow ring-1 ring-gray-900/5 dark:ring-white/10' : 'text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
            >
              Mudra Logic
            </button>
          </div>

          <label className={`text-emerald-600 dark:text-emerald-500 ${labelClass}`} htmlFor="monthlyPrepayment">Monthly Prepayment (Optional)</label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 -mt-1 font-medium transition-colors tracking-tight">Accelerate your payoff by adding extra principal monthly.</p>
          <div className="flex items-center bg-emerald-50/50 dark:bg-[#18181b] ring-1 ring-emerald-200/50 dark:ring-emerald-500/20 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 dark:focus-within:ring-emerald-400 transition-all overflow-hidden shadow-sm group/prepay hover:shadow-md">
            <div className="pl-4 text-emerald-500 dark:text-emerald-400 transition-transform group-focus-within/prepay:translate-x-1 group-focus-within/prepay:-translate-y-1 duration-300"><Rocket size={20} strokeWidth={2.5} /></div>
            <div className="pl-3 text-emerald-600 dark:text-emerald-500"><IndianRupee size={18} strokeWidth={2.5} /></div>
            <input 
              className="w-full bg-transparent border-none py-4 px-2 font-black text-emerald-900 dark:text-emerald-100 text-xl focus:outline-none focus:ring-0 placeholder-emerald-200/80 dark:placeholder-emerald-800"
              type="number" 
              id="monthlyPrepayment"
              name="monthlyPrepayment"
              value={inputs.monthlyPrepayment || ''}
              onChange={handleChange}
              placeholder="10000"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
