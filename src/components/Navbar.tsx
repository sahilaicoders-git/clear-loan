import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../utils/supabase';
import { useTheme } from '../context/ThemeProvider';

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="fixed top-6 left-0 right-0 w-full flex justify-center z-[100] px-4 pointer-events-none animate-enter">
      <div className={`w-full flex justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}`}>
        <nav className="w-full md:w-[700px] lg:w-[900px] bg-white/30 dark:bg-[#09090b]/60 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-6 py-3 pointer-events-auto transition-all duration-500 hover:bg-white/40 dark:hover:bg-[#09090b]/80">
          <div className="flex justify-between items-center w-full">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <div className="bg-gray-900 dark:bg-white rounded-full flex items-center justify-center w-8 h-8 transition-transform group-hover:scale-110">
              <span className="text-white dark:text-gray-900 font-extrabold text-sm ml-px line-height-none">sp</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white tracking-tight text-lg transition-colors">
              smart<span className="text-gray-500 dark:text-gray-400">loan</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100/50 dark:hover:bg-white/10"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
            </button>

            {user ? (
              <>
                <Link to="/loans" className="hidden sm:block text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  My Portfolio
                </Link>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block mx-1 transition-colors"></div>
                
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-900 dark:text-white leading-none transition-colors">{user.user_metadata?.full_name || 'User'}</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 transition-colors">Verified</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-gray-100/50 dark:bg-white/5 rounded-full"
                    title="Sign Out"
                  >
                    <LogOut size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Log In
                </Link>
                <Link to="/signup" className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-full hover:scale-95 transition-transform shadow-md">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        </nav>
      </div>
    </div>
  );
}
