import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, Loader2, Plus, LineChart, ChevronDown, Rocket, X, Maximize2, Filter } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthProvider';
import { calculateLoan } from '../utils/loanCalculator';
import { AmortizationChart } from '../components/AmortizationChart';
import { AmortizationTable } from '../components/AmortizationTable';

export function Loans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [localPrepayment, setLocalPrepayment] = useState<number>(0);
  const [oneTimePrepayments, setOneTimePrepayments] = useState<Record<number, number>>({});
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [filterAmount, setFilterAmount] = useState<{min: string, max: string}>({min: '', max: ''});
  const [filterRate, setFilterRate] = useState<{min: string, max: string}>({min: '', max: ''});

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLoan, setNewLoan] = useState({
    name: 'New Asset',
    principal: 5000000,
    annualInterestRate: 8.5,
    tenureYears: 20,
    monthlyPrepayment: 0,
    startDate: new Date().toISOString().split('T')[0],
    category: 'Home Loan',
    calcMethod: 'standard'
  });

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('loans').insert({
      user_id: user.id,
      name: newLoan.name,
      principal: newLoan.principal,
      annual_interest_rate: newLoan.annualInterestRate,
      tenure_years: newLoan.tenureYears,
      monthly_prepayment: newLoan.monthlyPrepayment,
      start_date: newLoan.startDate,
      category: newLoan.category,
      calc_method: newLoan.calcMethod
    });
    if (!error) {
      setIsAddModalOpen(false);
      const { data } = await supabase.from('loans').select('*').order('created_at', { ascending: false });
      if (data) setLoans(data);
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!user && !loading) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchLoans = async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) setLoans(data);
      setLoading(false);
    };
    fetchLoans();
  }, [user]);

  const deleteLoan = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (!error) setLoans(loans.filter(l => l.id !== id));
    if (expandedLoanId === id) setExpandedLoanId(null);
  };

  const toggleExpand = (loan: any) => {
    if (expandedLoanId === loan.id) {
      setExpandedLoanId(null);
    } else {
      setExpandedLoanId(loan.id);
      setLocalPrepayment(loan.monthly_prepayment || 0);
      setOneTimePrepayments(loan.one_time_prepayments || {});
      setIsTableModalOpen(false);
    }
  };

  const handleSavePrepaymentMap = async () => {
    if (!expandedLoanId) return;
    const { error } = await supabase.from('loans').update({
      one_time_prepayments: oneTimePrepayments
    }).eq('id', expandedLoanId);
    
    if (!error) {
      setLoans(loans.map(l => l.id === expandedLoanId ? { ...l, one_time_prepayments: oneTimePrepayments } : l));
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const filteredLoans = loans.filter(loan => {
    let pass = true;
    if (filterAmount.min && loan.principal < parseFloat(filterAmount.min)) pass = false;
    if (filterAmount.max && loan.principal > parseFloat(filterAmount.max)) pass = false;
    if (filterRate.min && loan.annual_interest_rate < parseFloat(filterRate.min)) pass = false;
    if (filterRate.max && loan.annual_interest_rate > parseFloat(filterRate.max)) pass = false;
    return pass;
  });

  const portfolioMetrics = useMemo(() => {
    let totalPrincipal = 0;
    let totalCurrentPrincipal = 0;
    let totalEmi = 0;
    let totalInterest = 0;

    loans.forEach(loan => {
      totalPrincipal += loan.principal;
      const calc = calculateLoan({
         principal: loan.principal,
         annualInterestRate: loan.annual_interest_rate,
         tenureYears: loan.tenure_years,
         monthlyPrepayment: loan.monthly_prepayment || 0,
         startDate: loan.start_date || new Date().toISOString().split('T')[0],
         category: loan.category || 'Home Loan',
         calcMethod: loan.calc_method || 'standard',
         oneTimePrepayments: loan.one_time_prepayments || {}
      });
      // Calculate current principal for this loan
      const startNode = new Date(loan.start_date || new Date().toISOString().split('T')[0]);
      const nowNode = new Date();
      let cIndex = (nowNode.getFullYear() - startNode.getFullYear()) * 12 + (nowNode.getMonth() - startNode.getMonth()) + 1;
      cIndex = Math.max(1, cIndex);
      const amort = (loan.monthly_prepayment || Object.keys(loan.one_time_prepayments || {}).length > 0)
        ? calc.prepaymentAmortization
        : calc.standardAmortization;
      const activeIndex = Math.min(cIndex - 1, amort.length - 1);
      const currentBalance = amort[activeIndex]?.balance ?? loan.principal;
      totalCurrentPrincipal += currentBalance;
      totalEmi += calc.monthlyEmi + (loan.monthly_prepayment || 0);
      totalInterest += calc.totalInterestWithPrepayment;
    });

    return { totalPrincipal, totalCurrentPrincipal, totalEmi, totalInterest };
  }, [loans]);

  if (!user) return null;

  return (
    <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-enter z-0 min-h-screen">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] opacity-40 dark:opacity-10 pointer-events-none -z-10 transition-opacity">
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob" />
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6 relative z-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white transition-colors">
            My Portfolio
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium transition-colors max-w-xl">
            Click any row to instantly simulate deep prepayment analytics.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm dark:shadow-none">
          <Plus size={16} strokeWidth={2.5} /> New Model
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="animate-spin text-gray-400 dark:text-gray-600" size={32} />
        </div>
      ) : loans.length === 0 ? (
        <div className="relative group overflow-hidden bg-white/50 dark:bg-[#18181b]/50 backdrop-blur-xl border border-dashed border-gray-300 dark:border-white/10 rounded-[2.5rem] p-16 text-center shadow-sm z-10 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors duration-500">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50 dark:opacity-20"></div>
          
          <div className="w-24 h-24 mx-auto bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 bg-indigo-400 dark:bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <Plus size={32} strokeWidth={2.5} className="text-indigo-600 dark:text-indigo-400 relative z-10" />
          </div>
          
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight transition-colors">Start projecting wealth</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto text-sm font-medium leading-relaxed transition-colors tracking-tight">Model your very first loan scenario on the dashboard to unlock real-time predictive analytics and lifetime savings trackers.</p>
          
          <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-900/20 dark:shadow-white/10 relative z-10">
            Launch Simulator <ArrowRight size={18} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Portfolio Grand Totals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 relative z-10 transition-colors">
             <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between transition-colors overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 duration-500"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 block relative z-10">Total Active Principal</span>
               <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight relative z-10">{formatCurrency(portfolioMetrics.totalPrincipal)}</h3>
             </div>

             <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between transition-colors overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 dark:bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors group-hover:bg-emerald-300 dark:group-hover:bg-emerald-400/30 duration-500"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-4 block relative z-10">Total Current Principal</span>
               <h3 className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight relative z-10">{formatCurrency(portfolioMetrics.totalCurrentPrincipal)}</h3>
             </div>

             <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between transition-colors overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 dark:bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors group-hover:bg-indigo-300 dark:group-hover:bg-indigo-400/30 duration-500"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-4 block relative z-10">Aggregated Monthly EMI</span>
               <h3 className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight relative z-10">{formatCurrency(portfolioMetrics.totalEmi)}</h3>
             </div>

             <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between transition-colors overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 dark:bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors group-hover:bg-rose-100 dark:group-hover:bg-rose-500/10 duration-500"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 block relative z-10">Total Lifetime Interest</span>
               <h3 className="text-3xl sm:text-4xl font-black text-rose-500 dark:text-rose-400 tracking-tight relative z-10">{formatCurrency(portfolioMetrics.totalInterest)}</h3>
             </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm p-4 sm:px-6 relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                 <Filter size={18} strokeWidth={2.5} />
               </div>
               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Filter Vault</h3>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 flex-1 xl:justify-end">
               {/* Amount Filter */}
               <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-inner w-full sm:w-auto transition-colors">
                 <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest">Amount (₹)</span>
                 <input type="number" placeholder="Min" value={filterAmount.min} onChange={e => setFilterAmount({...filterAmount, min: e.target.value})} className="w-16 sm:w-20 bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-0 placeholder-gray-400" />
                 <span className="text-gray-300 dark:text-white/20">-</span>
                 <input type="number" placeholder="Max" value={filterAmount.max} onChange={e => setFilterAmount({...filterAmount, max: e.target.value})} className="w-16 sm:w-20 bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-0 placeholder-gray-400" />
               </div>

               {/* Rate Filter */}
               <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-inner w-full sm:w-auto transition-colors">
                 <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest">Rate (%)</span>
                 <input type="number" placeholder="Min" value={filterRate.min} onChange={e => setFilterRate({...filterRate, min: e.target.value})} className="w-12 sm:w-16 bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-0 placeholder-gray-400" />
                 <span className="text-gray-300 dark:text-white/20">-</span>
                 <input type="number" placeholder="Max" value={filterRate.max} onChange={e => setFilterRate({...filterRate, max: e.target.value})} className="w-12 sm:w-16 bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-0 placeholder-gray-400" />
               </div>

               {/* Clear Filters */}
               {(filterAmount.min || filterAmount.max || filterRate.min || filterRate.max) && (
                 <button onClick={() => { setFilterAmount({min: '', max: ''}); setFilterRate({min: '', max: ''}); }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 bg-gray-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/10 rounded-xl transition-all h-full self-start sm:self-auto">Clear</button>
               )}
             </div>
          </div>

        <div className="flex flex-col relative z-10 bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
          
          {/* Table Header Configuration */}
          <div className="hidden lg:flex items-center px-6 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
             <div className="flex-[2] min-w-[200px]">Asset Profile</div>
             <div className="flex-[4] flex items-center justify-between px-8">
               <div className="w-[120px]">Principal</div>
               <div className="w-[120px]">Current Principal</div>
               <div className="w-[70px]">Rate</div>
               <div className="w-[70px]">Tenure</div>
               <div className="w-[120px]">Monthly EMI</div>
             </div>
             <div className="flex-1 text-right">Actions</div>
          </div>

          <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
            {filteredLoans.length === 0 ? (
               <div className="py-20 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-600">
                   <Filter size={24} strokeWidth={2.5}/>
                 </div>
                 <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No assets match your multi-filters</h4>
                 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Clear the filters or enter a different range to uncover trajectory models.</p>
               </div>
            ) : filteredLoans.map((loan) => {
              const isExpanded = expandedLoanId === loan.id;
              
              const liveResults = isExpanded ? calculateLoan({
                principal: loan.principal,
                annualInterestRate: loan.annual_interest_rate,
                tenureYears: loan.tenure_years,
                monthlyPrepayment: localPrepayment !== undefined ? localPrepayment : (loan.monthly_prepayment || 0),
                startDate: loan.start_date || new Date().toISOString().split('T')[0],
                category: loan.category || 'Home Loan',
                calcMethod: loan.calc_method || 'standard',
                oneTimePrepayments
              }) : null;

              let closureData = null;
              if (liveResults) {
                const startNode = new Date(loan.start_date || new Date().toISOString().split('T')[0]);
                const nowNode = new Date();
                let cIndex = (nowNode.getFullYear() - startNode.getFullYear()) * 12 + (nowNode.getMonth() - startNode.getMonth()) + 1;
                cIndex = Math.max(1, cIndex);
                
                const std = liveResults.standardAmortization;
                const activeIndex = Math.min(cIndex - 1, std.length - 1);
                
                const priorBalance = activeIndex > 0 ? std[activeIndex - 1].balance : loan.principal;
                const estPrincipalPaid = std[activeIndex].principalPaid;
                const requiredInjection = priorBalance - estPrincipalPaid;

                if (requiredInjection > 0) {
                  closureData = { monthIndex: activeIndex + 1, injection: requiredInjection, totalDue: priorBalance };
                }
              }

              return (
                <div key={loan.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors relative">
                  {/* Left Accent Bar on Expand */}
                  {isExpanded && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 z-10" />}

                  {/* High Density Sleek Row */}
                  <div 
                    onClick={() => toggleExpand(loan)}
                    className={`flex flex-col lg:flex-row lg:items-center px-4 sm:px-6 py-4 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                  >
                    {/* Identity Column */}
                    <div className="flex items-center gap-4 flex-[2] min-w-[200px]">
                      <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors">
                        <LineChart size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{loan.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] uppercase font-extrabold rounded border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm">{loan.category || 'Home Loan'}</span>
                          <p className="text-[10px] text-gray-500 dark:text-gray-500 font-medium tracking-wide transition-colors">{new Date(loan.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Matrix */}
                    <div className="flex-[4] grid grid-cols-2 lg:flex lg:items-center lg:justify-between px-2 py-4 lg:py-0 lg:px-8 mt-4 lg:mt-0 border-y lg:border-y-0 border-gray-100 dark:border-white/5 gap-y-3 transition-colors">
                      {/* Mobile Labels / Desktop Values */}
                      <div className="w-[120px]">
                        <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Principal</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-200">{formatCurrency(loan.principal)}</span>
                      </div>
                      <div className="w-[120px]">
                        <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Current Principal</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-200">
                          {(() => {
                            // Calculate current principal balance
                            const calc = calculateLoan({
                              principal: loan.principal,
                              annualInterestRate: loan.annual_interest_rate,
                              tenureYears: loan.tenure_years,
                              monthlyPrepayment: loan.monthly_prepayment || 0,
                              startDate: loan.start_date || new Date().toISOString().split('T')[0],
                              category: loan.category || 'Home Loan',
                              calcMethod: loan.calc_method || 'standard',
                              oneTimePrepayments: loan.one_time_prepayments || {}
                            });
                            // Find the current month index
                            const startNode = new Date(loan.start_date || new Date().toISOString().split('T')[0]);
                            const nowNode = new Date();
                            let cIndex = (nowNode.getFullYear() - startNode.getFullYear()) * 12 + (nowNode.getMonth() - startNode.getMonth()) + 1;
                            cIndex = Math.max(1, cIndex);
                            const amort = (loan.monthly_prepayment || Object.keys(loan.one_time_prepayments || {}).length > 0)
                              ? calc.prepaymentAmortization
                              : calc.standardAmortization;
                            const activeIndex = Math.min(cIndex - 1, amort.length - 1);
                            const currentBalance = amort[activeIndex]?.balance ?? loan.principal;
                            return formatCurrency(currentBalance);
                          })()}
                        </span>
                      </div>
                      <div className="w-[70px]">
                        <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Rate</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-200">{loan.annual_interest_rate}%</span>
                      </div>
                      <div className="w-[70px]">
                        <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Tenure</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-200">{loan.tenure_years}Y</span>
                      </div>
                      <div className="w-[120px]">
                        <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase block mb-0.5">EMI</span>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(calculateLoan({
                          principal: loan.principal,
                          annualInterestRate: loan.annual_interest_rate,
                          tenureYears: loan.tenure_years,
                          monthlyPrepayment: 0,
                          startDate: loan.start_date || new Date().toISOString().split('T')[0],
                          category: loan.category || 'Home Loan',
                          calcMethod: loan.calc_method || 'standard'
                        }).monthlyEmi)}</span>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex items-center justify-end gap-2 flex-1 mt-4 lg:mt-0">
                      <button 
                        onClick={(e) => deleteLoan(loan.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Delete Asset"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                      <div className="hidden lg:flex items-center justify-center p-2">
                        <ChevronDown 
                          size={18} 
                          strokeWidth={2.5} 
                          className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'rotate-0'}`} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Sandbox Container */}
                  {isExpanded && liveResults && (
                    <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 p-6 lg:p-10 animate-enter transition-colors shadow-inner">
                      <div className="flex flex-col xl:flex-row gap-8 max-w-6xl mx-auto">
                        
                        {/* Prepayment Input & Savings */}
                        <div className="w-full xl:w-72 shrink-0 bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col transition-colors">
                          <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                            <Rocket size={16} strokeWidth={2.5} /> Accelerator
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">Modify prepayment to recalculate timeline dynamically.</p>
                          
                          <div className="flex items-center bg-gray-50 dark:bg-[#09090b]/50 border border-gray-200 dark:border-white/10 rounded-xl focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 px-4 py-3 shadow-sm transition-all mb-8">
                            <span className="text-emerald-600 dark:text-emerald-500 font-extrabold text-sm mr-2">₹</span>
                            <input 
                              type="number"
                              value={localPrepayment || ''}
                              onChange={(e) => setLocalPrepayment(parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent border-none text-emerald-900 dark:text-emerald-100 font-black text-lg focus:outline-none focus:ring-0 placeholder-emerald-200 dark:placeholder-emerald-800"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          
                          <div className="mt-auto">
                            <div className="pb-4">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-wider mb-1">Total Interest Lifetime</p>
                              <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                {formatCurrency(localPrepayment > 0 ? liveResults.totalInterestWithPrepayment : liveResults.totalInterestStandard)}
                              </p>
                            </div>
                            
                            {localPrepayment > 0 && (
                              <div className="pt-4 border-t border-emerald-100 dark:border-emerald-500/20 transition-colors bg-emerald-50 dark:bg-emerald-500/10 -mx-6 px-6 pb-6 -mb-6 rounded-b-2xl">
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider mb-1">Interest Evaporated</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(liveResults.interestSaved)}</p>
                                <div className="mt-3 text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-500/30 inline-flex px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-400/20 shadow-sm">
                                  Saved {Math.floor(liveResults.monthsSaved / 12)}Y {liveResults.monthsSaved % 12}M Wait
                                </div>
                              </div>
                            )}

                            {closureData && (
                              <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-4 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest">Live Foreclosure</p>
                                  <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] rounded font-bold border border-rose-200/50 dark:border-rose-500/20 shadow-sm flex items-center gap-1">Month {closureData.monthIndex}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">Instantly close the asset trajectory in the current active calendar month.</p>
                                
                                <button
                                  onClick={() => {
                                    setOneTimePrepayments({ [closureData.monthIndex]: closureData.injection });
                                  }}
                                  className="w-full flex items-center justify-between px-4 py-2.5 bg-rose-50/50 hover:bg-rose-100/80 dark:bg-rose-500/5 dark:hover:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-200/50 dark:border-rose-500/20 shadow-sm hover:scale-[1.02] active:scale-95 group"
                                  title="Inject closing principal into math engine"
                                >
                                  <span>Close Asset</span>
                                  <span className="bg-white dark:bg-[#18181b] px-2 py-1 rounded shadow-sm group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 transition-colors">
                                    {formatCurrency(closureData.totalDue)}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sandbox Recharts */}
                        <div className="flex-1 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[400px] transition-colors flex flex-col overflow-hidden">
                          <div className="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider transition-colors">Trajectory Sandbox</h4>
                            
                            <button 
                              onClick={() => setIsTableModalOpen(true)} 
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 hover:text-indigo-800 dark:hover:bg-indigo-500/30 dark:hover:text-indigo-300 transition-all self-start sm:self-auto shadow-sm ring-1 ring-indigo-500/10 dark:ring-indigo-500/20 active:scale-95"
                            >
                              <Maximize2 size={16} strokeWidth={2.5} /> Expand Ledger Matrix
                            </button>
                          </div>
                          
                          <div className="h-[320px] w-full shrink-0 flex-1 animate-enter">
                            <AmortizationChart data={localPrepayment > 0 || Object.keys(oneTimePrepayments).length > 0 ? liveResults.prepaymentAmortization : liveResults.standardAmortization} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Table Modal Overlays */}
                  {isExpanded && liveResults && isTableModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-opacity">
                      <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/90 backdrop-blur-xl animate-fade-in" onClick={() => setIsTableModalOpen(false)} />
                      
                      <div className="relative w-full max-w-[90rem] h-full max-h-[90vh] bg-gray-50 dark:bg-[#09090b] rounded-[2rem] shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden flex flex-col animate-slide-up">
                         
                         <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#18181b] flex items-center justify-between shrink-0 shadow-sm z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                 Interactive Ledger Matrix
                              </h3>
                              <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest self-start sm:self-auto border border-indigo-100 dark:border-indigo-500/20 shadow-sm">{loan.name}</span>
                            </div>
                            <button onClick={() => setIsTableModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors self-start sm:self-auto" title="Close Matrix">
                              <X size={20} strokeWidth={2.5} />
                            </button>
                         </div>

                         <div className="flex-1 overflow-hidden flex flex-col xl:flex-row p-6 sm:p-8 gap-6 sm:gap-8 relative bg-gray-50/50 dark:bg-transparent">
                            
                            {/* Left: Prepayment Core Simulator */}
                            <div className="w-full xl:w-80 shrink-0 bg-white dark:bg-[#18181b] p-6 lg:p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col transition-colors overflow-y-auto custom-scrollbar">
                               <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                                 <Rocket size={16} strokeWidth={2.5} /> Global Matrix Core
                               </label>
                               <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">System-wide accelerator properties applying flat prepayments iteratively over all rows.</p>
                               
                               <div className="flex items-center bg-gray-50 dark:bg-[#09090b]/50 border border-gray-200 dark:border-white/10 rounded-xl focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 px-4 py-3 shadow-sm transition-all mb-8">
                                 <span className="text-emerald-600 dark:text-emerald-500 font-extrabold text-sm mr-2">₹</span>
                                 <input 
                                   type="number"
                                   value={localPrepayment || ''}
                                   onChange={(e) => setLocalPrepayment(parseFloat(e.target.value) || 0)}
                                   className="w-full bg-transparent border-none text-emerald-900 dark:text-emerald-100 font-black text-xl focus:outline-none focus:ring-0 placeholder-emerald-200 dark:placeholder-emerald-800"
                                   placeholder="0"
                                   min="0"
                                 />
                               </div>
                               
                               <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                                  <div className="pb-4">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-wider mb-1">Total Interest Lifetime</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                      {formatCurrency(localPrepayment > 0 || Object.keys(oneTimePrepayments).length > 0 ? liveResults.totalInterestWithPrepayment : liveResults.totalInterestStandard)}
                                    </p>
                                  </div>
                                  
                                  {(localPrepayment > 0 || Object.keys(oneTimePrepayments).length > 0) && (
                                    <div className="pt-4 border-t border-emerald-100 dark:border-emerald-500/20 transition-colors bg-emerald-50 dark:bg-emerald-500/10 -mx-6 lg:-mx-8 px-6 lg:px-8 pb-6 lg:pb-8 -mb-6 lg:-mb-8 rounded-b-2xl">
                                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider mb-1">Interest Evaporated</p>
                                      <p className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(liveResults.interestSaved)}</p>
                                      <div className="mt-3 text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-500/30 inline-flex px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-400/20 shadow-sm">
                                        Saved {Math.floor(liveResults.monthsSaved / 12)}Y {liveResults.monthsSaved % 12}M Wait
                                      </div>
                                    </div>
                                  )}
                               </div>
                            </div>

                            {/* Right: The Complete Table */}
                            <div className="flex-1 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
                               <div className="absolute top-0 left-0 w-full z-10 px-6 py-4 bg-gray-50/90 dark:bg-[#09090b]/90 backdrop-blur border-b border-gray-200 dark:border-white/10 flex items-center justify-between pointer-events-none">
                                 <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">&rarr; Inject custom principal blocks sequentially down the ledger</p>
                               </div>
                               <div className="flex-1 overflow-y-auto w-full custom-scrollbar pt-14">
                                 <AmortizationTable 
                                   data={localPrepayment > 0 || Object.keys(oneTimePrepayments).length > 0 ? liveResults.prepaymentAmortization : liveResults.standardAmortization} 
                                   interactive={true}
                                   oneTimePrepayments={oneTimePrepayments}
                                   onPrepaymentChange={(month, val) => setOneTimePrepayments(prev => ({...prev, [month]: val}))}
                                   onSavePrepayment={() => handleSavePrepaymentMap()}
                                 />
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Modern Append Row */}
            <button onClick={() => setIsAddModalOpen(true)} className="w-full group flex flex-col lg:flex-row lg:items-center px-4 sm:px-6 py-6 cursor-pointer transition-colors bg-gray-50/50 hover:bg-white dark:bg-white/[0.01] dark:hover:bg-white/5 border-t border-dashed border-gray-200 dark:border-white/10">
               <div className="flex items-center gap-4 w-full justify-center lg:justify-start">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-xl transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/20 group-hover:scale-110 duration-300">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Simulate New Trajectory</span>
               </div>
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Modern Add Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#09090b] rounded-[2rem] shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
               <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Add Portfolio Asset</h3>
               <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors">
                 <X size={18} strokeWidth={2.5} />
               </button>
            </div>
            
            <form onSubmit={handleCreateLoan} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar bg-gray-50/30 dark:bg-transparent">
              
              {/* Asset Name */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 transition-colors">Asset Identity</label>
                <div className="flex items-center bg-white dark:bg-[#18181b] ring-1 ring-gray-200 dark:ring-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                  <input type="text" value={newLoan.name} onChange={e => setNewLoan({...newLoan, name: e.target.value})} className="w-full bg-transparent border-none py-4 px-5 font-black text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-0" required />
                </div>
              </div>

              {/* Grid 2x2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 transition-colors">Total Principal</label>
                  <div className="flex items-center bg-white dark:bg-[#18181b] ring-1 ring-gray-200 dark:ring-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                    <input type="number" value={newLoan.principal} onChange={e => setNewLoan({...newLoan, principal: parseFloat(e.target.value)||0})} className="w-full bg-transparent border-none py-4 px-5 font-black text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-0" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 transition-colors">Interest Rate (%)</label>
                  <div className="flex items-center bg-white dark:bg-[#18181b] ring-1 ring-gray-200 dark:ring-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                    <input type="number" step="0.1" value={newLoan.annualInterestRate} onChange={e => setNewLoan({...newLoan, annualInterestRate: parseFloat(e.target.value)||0})} className="w-full bg-transparent border-none py-4 px-5 font-black text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-0" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 transition-colors">Tenure (Years)</label>
                  <div className="flex items-center bg-white dark:bg-[#18181b] ring-1 ring-gray-200 dark:ring-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                    <input type="number" value={newLoan.tenureYears} onChange={e => setNewLoan({...newLoan, tenureYears: parseFloat(e.target.value)||0})} className="w-full bg-transparent border-none py-4 px-5 font-black text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-0" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 transition-colors">Start Date</label>
                  <div className="flex items-center bg-white dark:bg-[#18181b] ring-1 ring-gray-200 dark:ring-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                    <input type="date" value={newLoan.startDate} onChange={e => setNewLoan({...newLoan, startDate: e.target.value})} className="w-full bg-transparent border-none py-4 px-5 font-black text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-0" required />
                  </div>
                </div>
              </div>
              
              {/* Category */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 transition-colors">Asset Category</label>
                <div className="flex flex-wrap gap-1.5 bg-gray-100/50 dark:bg-[#09090b]/50 p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-inner">
                  {['Home Loan', 'Personal Loan', 'Auto Loan', 'Credit Card', 'Other'].map(cat => (
                    <button type="button" key={cat} onClick={() => setNewLoan({...newLoan, category: cat})} className={`flex-auto px-4 py-3 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all ${newLoan.category === cat ? 'bg-white dark:bg-[#18181b] text-gray-900 dark:text-white shadow ring-1 ring-gray-900/5 dark:ring-white/10' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>{cat}</button>
                  ))}
                </div>
              </div>

            </form>
            
            <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#09090b]/80 backdrop-blur-xl shrink-0 flex items-center justify-end gap-3 rounded-b-[2rem]">
               <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Cancel</button>
               <button onClick={handleCreateLoan} disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 dark:bg-white text-white dark:text-gray-900 font-extrabold rounded-xl hover:bg-indigo-700 dark:hover:bg-gray-200 transition-all shadow-md text-sm">
                 {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />} Save Asset
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
