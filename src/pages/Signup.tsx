import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) {
      setError(error.message);
    } else {
      alert('Success! You may now log in.');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="relative pt-32 pb-16 px-4 z-0 min-h-screen">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] opacity-40 dark:opacity-20 pointer-events-none -z-10 transition-opacity duration-1000">
        <div className="absolute top-20 right-10 w-64 h-64 bg-emerald-300 dark:bg-emerald-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-400 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-white dark:border-white/5 w-full max-w-md relative z-10 mx-auto mt-12 transition-colors">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">Create Account.</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium transition-colors">Sign up to persistently log your loan calculations.</p>
        
        {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-bold transition-colors">{error}</div>}
        
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-colors">Full Name</label>
            <input 
              className="w-full bg-gray-50 dark:bg-[#09090b]/50 border-none rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder-gray-400 dark:placeholder-gray-600"
              type="text" 
              placeholder="John Doe"
              value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-colors">Email Address</label>
            <input 
              className="w-full bg-gray-50 dark:bg-[#09090b]/50 border-none rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder-gray-400 dark:placeholder-gray-600"
              type="email" 
              placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-colors">Password</label>
            <input 
              className="w-full bg-gray-50 dark:bg-[#09090b]/50 border-none rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder-gray-400 dark:placeholder-gray-600"
              type="password" 
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-white text-white dark:text-indigo-900 py-3.5 rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors">
          Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
