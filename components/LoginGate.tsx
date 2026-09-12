import React, { useState, useEffect } from 'react';
import { BarChart3, Loader2, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface LoginGateProps {
  onLogin: () => void;
}

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTXv9PB3EtBUtXpbL7PFkpRmg8URXsJEdG3S5aZFOBV8ni7QavAWZ-j3q5pLj478mcxgMzK-aW6t04i/pub?output=csv';

const LoginGate: React.FC<LoginGateProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error('Failed to connect to the authentication server.');
      }

      const csvText = await response.text();
      const rows = csvText.split(/\r?\n/);
      let isAuthorized = false;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        for (const col of cols) {
          const cellEmail = col.replace(/^"|"$/g, '').trim().toLowerCase();
          if (cellEmail === trimmedEmail) {
            isAuthorized = true;
            break;
          }
        }
        if (isAuthorized) break;
      }

      if (isAuthorized) {
        onLogin();
      } else {
        setError('Access denied. This email is not authorized. Please contact support.');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred while verifying your email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden p-4 font-sans">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen transition-transform duration-[10s] ease-in-out ${mounted ? 'translate-x-10 translate-y-10 scale-110' : ''}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/15 blur-[130px] mix-blend-screen transition-transform duration-[15s] ease-in-out ${mounted ? '-translate-x-20 -translate-y-10 scale-125' : ''}`}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md z-10">
        
        {/* Decorative elements behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-[2rem] blur opacity-20 animate-pulse" style={{ animationDuration: '4s' }}></div>

        <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          
          {/* Header Section */}
          <div className="p-8 pb-6 text-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-white to-blue-500"></div>
            
            {/* Animated Logo */}
            <div className="relative inline-flex group mb-6 mt-2">
              <div className="absolute inset-[-4px] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#3b82f6_50%,#0000_100%)] animate-[spin_3s_linear_infinite] rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-xl">
                <BarChart3 className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            
            <h1 className="text-3xl font-heading font-semibold tracking-tight text-white mb-2 flex items-center justify-center gap-2">
              EG-Finance <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-500">Fx</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500/70" />
              Unlock institutional-grade insights
            </p>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                  Student Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-white transition-colors duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all shadow-inner"
                    placeholder="Enter your authorized email..."
                    disabled={isLoading}
                  />
                  {/* Subtle bottom glow on focus */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-white group-focus-within:w-full transition-all duration-500 rounded-full opacity-50"></div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-300 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="relative w-full group overflow-hidden rounded-xl p-[1px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
              >
                {/* Button Animated Border */}
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-white to-blue-600 bg-[length:200%_auto] animate-[pulse_2s_linear_infinite] opacity-80 group-hover:opacity-100 transition-opacity"></span>
                
                {/* Button Inner */}
                <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 rounded-[11px] transition-all duration-300 group-hover:bg-slate-800/80">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span className="font-medium text-white tracking-wide">Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-white tracking-wide">Access Dashboard</span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="p-5 text-center border-t border-white/5 bg-slate-950/40">
            <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure access restricted to enrolled students
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
