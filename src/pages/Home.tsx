import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CalculatorForm } from '../components/CalculatorForm';
import { ResultsSummary } from '../components/ResultsSummary';
import { AmortizationTable } from '../components/AmortizationTable';
import { AmortizationChart } from '../components/AmortizationChart';
import { calculateLoan } from '../utils/loanCalculator';
import type { LoanInputs } from '../utils/loanCalculator';

export function Home() {
  const location = useLocation();
  const passedLoan = location.state?.loan;

  const [inputs, setInputs] = useState<LoanInputs>({
    principal: passedLoan?.principal || 5000000,
    annualInterestRate: passedLoan?.annual_interest_rate || 8.5,
    tenureYears: passedLoan?.tenure_years || 20,
    monthlyPrepayment: passedLoan?.monthly_prepayment || 0,
    startDate: passedLoan?.start_date || new Date().toISOString().split('T')[0],
    category: passedLoan?.category || 'Home Loan',
    calcMethod: passedLoan?.calc_method || 'standard'
  });

  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const results = useMemo(() => {
    if (inputs.principal > 0 && inputs.annualInterestRate > 0 && inputs.tenureYears > 0) {
      return calculateLoan(inputs);
    }
    return null;
  }, [inputs]);

  const hasPrepayment = inputs.monthlyPrepayment > 0;

  return (
    <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-enter z-0">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] opacity-40 dark:opacity-20 pointer-events-none -z-10 transition-opacity duration-1000">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-indigo-400 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-rose-300 dark:bg-rose-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-300 dark:bg-emerald-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="text-center mb-16 relative z-10 transition-colors">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-sm rounded-full text-gray-800 dark:text-gray-300 text-xs font-bold tracking-widest uppercase mb-6 transition-colors">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span> Live Interactive Dashboard
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500 transition-colors">
          Supercharge Your Loan.
        </h1>
        <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium transition-colors">Take full control of your financial trajectory. View live EMIs, visualize exact prepayment impact, and map your fastest route to being totally debt-free.</p>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        {/* Top Row: Metrics Cards */}
        {results ? (
           <ResultsSummary results={results} hasPrepayment={hasPrepayment} inputs={inputs} />
        ) : (
          <div className="bg-white dark:bg-[#18181b] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center p-12 transition-colors">
             <p className="text-gray-500 dark:text-gray-400 font-medium">
               Enter your loan details below to generate your analytics.
             </p>
          </div>
        )}

        {/* Bottom Row: Controls & Data Table */}
        <div className="grid grid-cols-1 xl:grid-cols-[450px_1fr] gap-8 items-start">
          <CalculatorForm inputs={inputs} setInputs={setInputs} />
          
          {results && (
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Amortization Trajectory</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Detailed breakdown of principal and interest progress.</p>
                </div>
                
                <div className="inline-flex bg-gray-100/80 dark:bg-black/40 p-1 rounded-full border border-gray-200/50 dark:border-white/5 self-start sm:self-auto transition-colors">
                  <button 
                    onClick={() => setViewMode('chart')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'chart' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    Interactive Chart
                  </button>
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                  >
                    Data Table
                  </button>
                </div>
              </div>
              
              <div className="w-full flex-1 min-h-[400px]">
                {viewMode === 'chart' ? (
                  <AmortizationChart data={hasPrepayment ? results.prepaymentAmortization : results.standardAmortization} />
                ) : (
                  <AmortizationTable data={hasPrepayment ? results.prepaymentAmortization : results.standardAmortization} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
