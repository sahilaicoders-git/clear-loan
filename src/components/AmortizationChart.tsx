import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Legend
} from 'recharts';
import type { AmortizationRow } from '../utils/loanCalculator';
import { useTheme } from '../context/ThemeProvider';

interface Props {
  data: AmortizationRow[];
}

export function AmortizationChart({ data }: Props) {
  const { isDark } = useTheme();
  const isLongTerm = data.length > 60;
  
  const chartData = isLongTerm 
    ? data.filter(r => r.month % 12 === 0).map(r => ({ 
        ...r, 
        period: r.date.getFullYear().toString()
      }))
    : data.map(r => ({ 
        ...r, 
        period: r.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="w-full h-[450px] p-2 sm:p-6 bg-white dark:bg-[#18181b] animate-enter transition-colors rounded-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#818CF8" : "#4F46E5"} stopOpacity={isDark ? 0.3 : 0.2}/>
              <stop offset="95%" stopColor={isDark ? "#818CF8" : "#4F46E5"} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
            </linearGradient>
            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#FB7185" : "#F43F5E"} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={isDark ? "#FB7185" : "#F43F5E"} stopOpacity={0.3}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? '#27272a' : '#F3F4F6'} />
          <XAxis 
            dataKey="period" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: isDark ? '#A1A1AA' : '#6B7280', fontWeight: 600 }} 
            dy={15} 
          />
          <YAxis 
            yAxisId="left" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: isDark ? '#A1A1AA' : '#6B7280', fontWeight: 600 }} 
            tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} 
            dx={-10} 
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: isDark ? '#A1A1AA' : '#6B7280', fontWeight: 600 }} 
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
            dx={10} 
            hide={true}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#09090b' : '#ffffff',
              color: isDark ? '#f4f4f5' : '#111827',
              borderRadius: '16px', 
              border: `1px solid ${isDark ? '#27272a' : '#F3F4F6'}`, 
              boxShadow: isDark ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              fontWeight: 600
            }}
            formatter={(value: any) => formatCurrency(value)}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '14px', color: isDark ? '#e4e4e7' : '#374151' }} 
            iconType="circle"
          />
          
          <Bar yAxisId="right" dataKey="principalPaid" name="Principal Paid" stackId="a" fill="url(#colorPrincipal)" radius={[0, 0, 4, 4]} animationDuration={1500} />
          <Bar yAxisId="right" dataKey="interestPaid" name="Interest Paid" stackId="a" fill="url(#colorInterest)" radius={[4, 4, 0, 0]} animationDuration={1500} />
          <Area yAxisId="left" type="monotone" dataKey="balance" name="Remaining Balance" stroke={isDark ? "#818CF8" : "#4F46E5"} strokeWidth={4} fillOpacity={1} fill="url(#colorBalance)" animationDuration={1500} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
