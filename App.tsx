
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import CompareView from './components/CompareView';
import MarketTicker from './components/MarketTicker';
import LoginGate from './components/LoginGate';
import ChatWidget from './components/ChatWidget';
import { parseSummaryCSV, parseHistoryCSV } from './utils';
import { SUMMARY_SHEET_URL, HISTORY_SHEET_URL } from './constants';
import { BarChart3, RefreshCw, AlertCircle, Loader2, Sun, LogOut } from 'lucide-react';
import { SummaryRow, HistoryRow, ThemeMode } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'compare'>('dashboard');
  const [compareAssets, setCompareAssets] = useState<string[]>([]);

  // Theme State
  const [themeMode, setThemeMode] = useState<ThemeMode>('ocean');

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        fetch(SUMMARY_SHEET_URL),
        fetch(HISTORY_SHEET_URL)
      ]);

      if (!summaryRes.ok) throw new Error("Failed to fetch Summary data");
      if (!historyRes.ok) throw new Error("Failed to fetch History data");

      const summaryText = await summaryRes.text();
      const historyText = await historyRes.text();

      const summary = parseSummaryCSV(summaryText);
      const history = parseHistoryCSV(historyText);

      setSummaryData(summary);
      setHistoryData(history.data);
      setHistoryDates(history.dates);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Failed to load data from Google Sheets. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  // Calculate the latest date from the data
  const latestDate = React.useMemo(() => {
    if (historyDates.length === 0) return null;
    try {
        // Sort dates descending to find the most recent one
        const sorted = [...historyDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        return sorted[0];
    } catch (e) {
        return null;
    }
  }, [historyDates]);

  // Determine App Wrapper Classes based on theme
  const getThemeBackground = () => {
    switch (themeMode) {
        case 'light':
            return 'bg-slate-50 text-slate-900 bg-[radial-gradient(at_0%_0%,_hsla(210,100%,96%,1)_0,_transparent_50%),_radial-gradient(at_50%_100%,_hsla(210,100%,98%,1)_0,_transparent_50%)]';
        case 'ocean':
        default:
            return 'bg-[#0f172a] text-blue-50 bg-[radial-gradient(at_0%_0%,_hsla(222,47%,25%,1)_0,_transparent_50%),_radial-gradient(at_50%_100%,_hsla(217,91%,35%,0.2)_0,_transparent_50%),_radial-gradient(at_100%_0%,_hsla(210,100%,30%,1)_0,_transparent_50%)]';
    }
  };

  const getHeaderStyles = () => {
    switch (themeMode) {
        case 'light': return 'bg-white/80 border-slate-200';
        case 'ocean': default: return 'bg-slate-900/80 border-blue-800/20';
    }
  };

  if (!isAuthenticated) {
    return <LoginGate onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen font-sans overflow-hidden flex flex-col transition-colors duration-700 ${getThemeBackground()} bg-fixed bg-cover`}>
      {/* Fixed Header Container */}
      <div className="fixed top-0 w-full z-50 flex flex-col">
        {/* Main Navbar */}
        <header className={`w-full border-b backdrop-blur-xl h-14 transition-colors duration-500 ${getHeaderStyles()}`}>
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg shadow-lg ring-1 ring-white/10 ${themeMode === 'light' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-600 to-cyan-600'}`}>
                    <BarChart3 className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className={`text-xl font-heading font-bold tracking-tight leading-none ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    EG-Finance <span className="text-cyan-400 font-extrabold">Fx</span> <span className={themeMode === 'light' ? 'text-blue-600 font-medium' : 'text-blue-300 font-medium'}>COT Data</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Theme Switcher */}
                <div className={`flex items-center gap-1 p-1 rounded-lg border ${themeMode === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/50 border-white/5'}`}>
                    <button 
                        onClick={() => setThemeMode('ocean')}
                        className={`p-1.5 rounded-md transition-all ${themeMode === 'ocean' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        title="Ocean Dark"
                    >
                        <div className="w-4 h-4 bg-blue-900 rounded-full border border-blue-400"></div>
                    </button>
                    <button 
                        onClick={() => setThemeMode('light')}
                        className={`p-1.5 rounded-md transition-all ${themeMode === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        title="Light Mode"
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                </div>

                <div className="h-6 w-px bg-current opacity-10 mx-1"></div>

                {latestDate && (
                    <div className={`hidden sm:flex flex-col items-end mr-2 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                        <span className="text-[10px] uppercase font-bold opacity-60 leading-none">Data Date</span>
                        <span className="text-xs font-mono font-bold leading-none mt-0.5">{latestDate}</span>
                    </div>
                )}

                {lastUpdated && !isLoading && (
                <span className={`hidden lg:block text-xs font-mono ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Synced: {lastUpdated.toLocaleTimeString()}
                </span>
                )}
                <button 
                onClick={fetchData} 
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 
                    ${themeMode === 'light' 
                        ? 'bg-white hover:bg-slate-50 border-slate-200 text-blue-600' 
                        : 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 text-blue-400'}`}
                >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
                </button>

                <button 
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all 
                    ${themeMode === 'light' 
                        ? 'bg-white hover:bg-red-50 border-red-200 text-red-600' 
                        : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'}`}
                >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
                </button>
            </div>
            </div>
        </header>
        
        {/* Ticker Tape */}
        <MarketTicker data={summaryData} themeMode={themeMode} />
      </div>

      {/* Main Content - Adjusted top padding for header + ticker */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-4 flex-1 flex flex-col overflow-hidden">
        {isLoading && summaryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 h-full">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className={`font-mono text-sm animate-pulse ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>EG-Finance Fx Cot loading .....</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-1 h-full">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center max-w-md text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <h3 className={`${themeMode === 'light' ? 'text-slate-900' : 'text-white'} font-bold mb-2`}>Sync Error</h3>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : currentView === 'compare' ? (
          <div className="animate-fade-in flex-1 flex flex-col">
            <CompareView 
              assets={compareAssets}
              summaryData={summaryData}
              historyData={historyData}
              historyDates={historyDates}
              themeMode={themeMode}
              onBack={() => setCurrentView('dashboard')}
            />
          </div>
        ) : (
          <div className="animate-fade-in flex-1 flex flex-col">
             <Dashboard 
              summaryData={summaryData} 
              historyData={historyData}
              historyDates={historyDates}
              themeMode={themeMode}
              latestDate={latestDate}
              onNavigateToCompare={(assets) => {
                setCompareAssets(assets);
                setCurrentView('compare');
              }}
            />
          </div>
        )}
      </main>

      <ChatWidget themeMode={themeMode} />
    </div>
  );
};

export default App;
