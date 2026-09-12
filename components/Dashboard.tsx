
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { YAxis, PieChart, Pie, LineChart, Cell } from 'recharts';
import { AreaChart, Area } from './charts/area-chart';
import { ComposedChart } from './charts/composed-chart';
import { Line } from './charts/line';
import { ReferenceArea } from './charts/reference-area';
import { XAxis } from './charts/x-axis';
import { ChartTooltip } from './charts/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { SummaryRow, HistoryRow, ThemeMode } from '../types';
import KPICard from './KPICard';
import AssetTrendCard from './AssetTrendCard';
import AIAnalysisOverlay from './AIAnalysisOverlay';
import CompareModal from './CompareModal';
import HeatmapModal from './HeatmapModal';
import EducationalGuideModal from './EducationalGuideModal';
import TradingViewWidget from './TradingViewWidget';
import { formatCurrency, generateLocalFallbackAnalysis } from '../utils';
import { TV_SYMBOL_MAP, ASSET_GROUPS } from '../constants';
import { LayoutDashboard, TrendingUp, TrendingDown, Activity, ChevronDown, ArrowUpRight, ArrowDownRight, Scale, Minus, Check, Sparkles, Search, ArrowUp, ArrowDown, ArrowUpDown, BarChart2, ArrowLeft, Info, AlertTriangle, Edit3, Map as MapIcon, Star, GraduationCap } from 'lucide-react';

interface DashboardProps {
  summaryData: SummaryRow[];
  historyData: HistoryRow[];
  historyDates: string[];
  themeMode: ThemeMode;
  latestDate: string | null;
  onNavigateToCompare?: (assets: string[]) => void;
}

// Curated list of assets organized by category
const FEATURED_ASSETS = ['Gold', 'Bitcoin Micro', 'Dow Futures Mini', 'Euro FX'];

const COMPARE_COLORS = ['#f59e0b', '#10b981', '#8b5cf6'];

const InfoTooltip: React.FC<{ text: string; themeMode: ThemeMode }> = ({ text, themeMode }) => (
  <div className="group relative inline-flex items-center justify-center ml-1.5 cursor-help">
    <Info className={`w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 ${themeMode === 'light' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
      {text}
      <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${themeMode === 'light' ? 'border-t-slate-800' : 'border-t-slate-100'}`}></div>
    </div>
  </div>
);

const AssetSelector: React.FC<{
  selectedAssets: string[];
  maxSelection: number;
  onToggle: (asset: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  themeMode: ThemeMode;
  excludeAsset?: string;
}> = ({ selectedAssets, maxSelection, onToggle, isOpen, setIsOpen, themeMode, excludeAsset }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
          themeMode === 'light'
            ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            : 'bg-slate-900 border-white/10 text-white hover:bg-slate-800'
        }`}
      >
        <Activity className="w-4 h-4" />
        <span>Compare ({selectedAssets.length}/{maxSelection})</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto rounded-2xl border shadow-2xl z-50 p-2 ${
          themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
        }`}>
          {ASSET_GROUPS.map((group) => {
            const availableItems = group.items.filter(item => item !== excludeAsset);
            if (availableItems.length === 0) return null;
            
            return (
              <div key={group.name} className="mb-2">
                <div className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider ${
                  themeMode === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {group.name}
                </div>
                {availableItems.map(item => {
                  const isSelected = selectedAssets.includes(item);
                  const isDisabled = !isSelected && selectedAssets.length >= maxSelection;
                  
                  return (
                    <button
                      key={item}
                      disabled={isDisabled}
                      onClick={() => onToggle(item)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected 
                          ? (themeMode === 'light' ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/20 text-blue-300')
                          : (themeMode === 'light' ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-white/5 text-slate-300')
                      }`}
                    >
                      <span className="font-medium">{item}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ summaryData, historyData, historyDates, themeMode, latestDate, onNavigateToCompare }) => {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Compare State
  const [mainCompareAssets, setMainCompareAssets] = useState<string[]>([]);
  const [isMainCompareOpen, setIsMainCompareOpen] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    setIsCardFlipped(false);
  }, [selectedCommodity]);
  
  // Scanner State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SummaryRow | 'Sentiment'; direction: 'asc' | 'desc' } | null>(null);
  const [isMarketScannerOpen, setIsMarketScannerOpen] = useState(true);

  // AI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiOfflineMode, setIsAiOfflineMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Notes State
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>([]);
  
  useEffect(() => {
    const savedNotes = localStorage.getItem('cot_trading_notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }

    const savedFavorites = localStorage.getItem('cot_favorites');
    if (savedFavorites) {
        try {
            setFavorites(JSON.parse(savedFavorites));
        } catch(e) {
            console.error("Failed to parse favorites", e);
        }
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, asset: string) => {
    e.stopPropagation();
    let newFavorites;
    if (favorites.includes(asset)) {
        newFavorites = favorites.filter(a => a !== asset);
    } else {
        newFavorites = [...favorites, asset];
    }
    setFavorites(newFavorites);
    localStorage.setItem('cot_favorites', JSON.stringify(newFavorites));
  };

  const handleNoteChange = (asset: string, text: string) => {
    const newNotes = { ...notes, [asset]: text };
    setNotes(newNotes);
    localStorage.setItem('cot_trading_notes', JSON.stringify(newNotes));
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter summaryData to only include relevant assets defined in ASSET_GROUPS
  const filteredSummaryData = useMemo(() => {
    const allowedAssets = new Set(ASSET_GROUPS.flatMap(g => g.items));
    let data = summaryData.filter(d => allowedAssets.has(d.Commodity));

    // Search
    if (searchTerm) {
        data = data.filter(d => d.Commodity.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort
    if (sortConfig) {
        data.sort((a, b) => {
            if (sortConfig.key === 'Sentiment') {
                 // Sort by Long %
                 const aTotal = a["Long Positions"] + a["Short Positions"];
                 const bTotal = b["Long Positions"] + b["Short Positions"];
                 const aRatio = aTotal ? a["Long Positions"] / aTotal : 0;
                 const bRatio = bTotal ? b["Long Positions"] / bTotal : 0;
                 return sortConfig.direction === 'asc' ? aRatio - bRatio : bRatio - aRatio;
            }
            
            const aValue = a[sortConfig.key as keyof SummaryRow];
            const bValue = b[sortConfig.key as keyof SummaryRow];
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                 return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return data;
  }, [summaryData, searchTerm, sortConfig]);

  const toggleMainCompare = (asset: string) => {
    setMainCompareAssets(prev => 
      prev.includes(asset) 
        ? prev.filter(a => a !== asset)
        : prev.length < 2 ? [...prev, asset] : prev
    );
  };

  const handleSort = (key: keyof SummaryRow | 'Sentiment') => {
      let direction: 'asc' | 'desc' = 'desc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
          direction = 'asc';
      }
      setSortConfig({ key, direction });
  };

  const selectedItem = useMemo(() => {
    return filteredSummaryData.find(c => c.Commodity === selectedCommodity);
  }, [filteredSummaryData, selectedCommodity]);
  
  const selectedHistory = useMemo(() => {
    if (!selectedCommodity) return [];
    const row = historyData.find(h => h.Commodity === selectedCommodity);
    if (!row) return [];

    return historyDates.map(date => ({
      date: date.split(',')[0],
      fullDate: date,
      value: row[date] as number
    })).reverse();
  }, [selectedCommodity, historyData, historyDates]);

  const mainChartData = useMemo(() => {
    return selectedHistory.map((item) => {
      const dataPoint: any = { ...item };
      mainCompareAssets.forEach((asset, index) => {
        const row = historyData.find(h => h.Commodity === asset);
        if (row) {
          dataPoint[`compare_${index}`] = row[item.fullDate] as number;
        }
      });
      return dataPoint;
    });
  }, [selectedHistory, mainCompareAssets, historyData]);

  const netChangeHistory = useMemo(() => {
    if (selectedHistory.length < 2) return [];
    return selectedHistory.map((item, index) => {
        if (index === 0) return null;
        const prev = selectedHistory[index - 1];
        return {
            date: item.date,
            value: item.value - prev.value
        };
    }).filter(Boolean) as { date: string, value: number }[];
  }, [selectedHistory]);

  const chartStats = useMemo(() => {
    if (!selectedHistory.length) return { max: 0, min: 0, avg: 0 };
    const values = selectedHistory.map(d => d.value);
    return {
      max: Math.max(...values),
      min: Math.min(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    };
  }, [selectedHistory]);

  // Theme-Dependent Styles
  const themeStyles = useMemo(() => {
    if (themeMode === 'light') {
        return {
            headerBg: 'bg-white/80 border-slate-200 shadow-lg shadow-slate-200/50',
            textMain: 'text-slate-900',
            textSub: 'text-slate-500',
            chartBg: 'bg-white border-slate-200 shadow-xl',
            chartGrid: '#e2e8f0',
            chartAxis: '#64748b',
            trendColorPositive: '#2563eb', // Blue-600
            trendColorNeutral: '#94a3b8',
            tableHeader: 'bg-slate-50 text-slate-500 border-slate-200',
            tableRow: 'hover:bg-slate-50 border-slate-100 text-slate-700',
            tableDivider: 'divide-slate-200',
            tableRowSelected: 'bg-blue-50 border-l-blue-500',
            dropdownBg: 'bg-white border-slate-200 text-slate-700',
            dropdownItemHover: 'hover:bg-slate-100',
            pieChartFill: '#3b82f6',
            pieChartBg: '#cbd5e1',
            activeButtonBg: 'bg-blue-600 text-white',
            aiButton: 'from-blue-100 to-blue-100 text-blue-700 border-blue-200'
        };
    } 
    // Default (Ocean)
    return {
        headerBg: 'bg-slate-900/80 border-blue-500/10 shadow-2xl',
        textMain: 'text-white',
        textSub: 'text-slate-400',
        chartBg: 'bg-slate-900/80 border-blue-500/10 shadow-2xl',
        chartGrid: '#1e293b',
        chartAxis: '#64748b',
        trendColorPositive: '#3b82f6',
        trendColorNeutral: '#cbd5e1',
        tableHeader: 'bg-slate-950 text-blue-300/70 border-blue-900/30',
        tableRow: 'hover:bg-blue-500/10 border-blue-800/10 text-slate-200',
        tableDivider: 'divide-blue-900/30', // Use subtle blue divider for Ocean mode
        tableRowSelected: 'bg-blue-600/20 border-l-blue-400',
        dropdownBg: 'bg-slate-900/90 border-blue-500/20 text-white',
        dropdownItemHover: 'hover:bg-blue-500/20',
        pieChartFill: '#3b82f6',
        pieChartBg: '#64748b',
        activeButtonBg: 'bg-blue-600 text-white shadow-blue-900/40',
        aiButton: 'from-blue-600/20 to-blue-600/20 text-white border-white/30'
    };
  }, [themeMode]);

  const isSelectedPositive = (selectedItem?.["Net Positions"] ?? 0) > 0;
  const trendColor = isSelectedPositive ? themeStyles.trendColorPositive : themeStyles.trendColorNeutral;

  const renderCustomDot = (props: any) => {
      const { cx, cy, index } = props;
      const isLast = index === selectedHistory.length - 1;
      
      if (isLast) {
          return (
              <g key={`dot-${index}`}>
                  <circle cx={cx} cy={cy} r="4" fill="none" stroke={trendColor} strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" from="4" to="24" dur="2s" begin="0s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="2s" begin="0s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r="5" fill={trendColor} stroke={themeMode === 'light' ? '#fff' : "#0f172a"} strokeWidth="2" />
              </g>
          );
      }
      return <circle cx={cx} cy={cy} r={0} />; 
  };

  const handleAIAnalysis = async () => {
    setIsAIModalOpen(true);
    setIsAnalyzing(true);
    setAiAnalysis(null);

    let liveQuote: any = null;

    try {
        // 1. Fetch live spot market price to anchor realistic technical key levels
        if (selectedItem?.Commodity) {
            try {
                const qRes = await fetch(`/api/market-price?commodity=${encodeURIComponent(selectedItem.Commodity)}`);
                if (qRes.ok) {
                    liveQuote = await qRes.json();
                }
            } catch (err) {
                console.warn("Could not fetch live market price for prompt anchoring:", err);
            }
        }

        let prompt = "";
        
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const dateContext = latestDate ? `The COT data is current as of ${latestDate}. Today is ${today}.` : `Today is ${today}.`;
        
        const searchInstruction = `
            SEARCH TASK 1 (Context): Search for key **Geopolitical, Economic, and Political** news that affected ${selectedItem ? selectedItem.Commodity : "the market"}. 
            **CRITICAL:** Focus specifically on the period from **${latestDate || "recent past"}** to **TODAY (${today})**. What has happened SINCE the data was released?
            SEARCH TASK 2 (Forward Looking): Search for the **upcoming economic calendar** for ${selectedItem ? selectedItem.Commodity : "major global markets"} for the next 7 days starting from today, ${today}. 
            **CRITICAL:** Look for high-impact events on **Forex Factory** or similar reliable economic calendars. 
            **MANDATORY:** You MUST specifically check for upcoming **Unemployment Claims** data if relevant to the asset (especially for USD pairs/Indices).
        `;

        if (selectedItem) {
            const quoteContext = liveQuote && liveQuote.price ? `
            REAL-TIME MARKET DATA (ANCHOR):
            - Current Spot Price: $${liveQuote.price} ${liveQuote.currency || "USD"}
            - Previous Close: $${liveQuote.prevClose}
            
            CRITICAL DIRECTIVES FOR DAILY TIMEFRAME KEY PRICE LEVELS:
            - The user strictly operates on the **DAILY TIMEFRAME**. 
            - You MUST use the Google Search tool to find highly accurate **Daily Timeframe Support and Resistance** levels for ${selectedItem.Commodity} from reputable sources like Investing.com or TradingView.
            - DO NOT invent numbers. If you cannot find accurate Daily levels via search, calculate them strictly based on Daily structural logic, but prioritize SEARCH.
            - "current_price": "$${liveQuote.price}"
            - "resistance": "Exact numerical price - Daily Resistance 1 (e.g., from Investing.com)"
            - "resistance_2": "Exact higher numerical price - Daily Resistance 2"
            - "pivot_point": "Exact numerical price - Daily Pivot or Liquidity Level"
            - "support": "Exact numerical price - Daily Support 1"
            - "support_2": "Exact lower numerical price - Daily Support 2"
            - "invalidation_level": "The exact daily close price that invalidates your thesis." 
            ` : `
            CRITICAL DIRECTIVES FOR REALISTIC KEY PRICE LEVELS:
            - You MUST provide realistic, concrete numerical price levels (not generic descriptions) reflecting current real-world market prices for ${selectedItem.Commodity}.
            - Always state the exact numerical price first (e.g., "$2,915.50 - Institutional Order Block"), followed by the technical reasoning.
            `;

            prompt = `Act as a friendly, expert trading mentor. Speak directly to me (the user) in a supportive, conversational tone.
            Analyze this COT report data for ${selectedItem.Commodity}:
            ${dateContext}
            Current Data:
            - Net Position: ${selectedItem["Net Positions"]}
            - Net Change (Weekly): ${selectedItem["Net Change"]}
            - Long Positions: ${selectedItem["Long Positions"]} (Change: ${selectedItem["Long Change"]})
            - Short Positions: ${selectedItem["Short Positions"]} (Change: ${selectedItem["Short Change"]})
            Historical Net Positions (Past 6 Weeks, newest to oldest): 
            ${JSON.stringify(selectedHistory.map(h => h.value).reverse())}

            ${quoteContext}
            
            ${searchInstruction}
            
            You MUST return the response in valid JSON format with the following structure. Do not use Markdown formatting outside the JSON strings.
            {
              "sentiment": {
                "label": "Bullish" | "Bearish" | "Neutral",
                "reason": "Brief 1-sentence reason"
              },
              "perspective": "Your friendly explanation of the market situation. What is smart money doing?",
              "actionable_advice": "Specific 'If I Were You' advice. Tell me exactly what you would do.",
              "key_levels": {
                "current_price": "$${liveQuote ? liveQuote.price : 'Current spot price'}",
                "resistance": "Exact numerical price (e.g. $4,485.50) - Tactical R1 resistance / Liquidity sweep",
                "resistance_2": "Exact higher numerical price (e.g. $4,510.00) - Major R2 supply zone",
                "pivot_point": "Exact numerical price (e.g. $4,455.00) - Weekly equilibrium PP",
                "support": "Exact numerical price (e.g. $4,432.00) - Tactical S1 support / Bullish Order Block",
                "support_2": "Exact lower numerical price (e.g. $4,410.00) - S2 discount demand pool",
                "invalidation_level": "Exact numerical price (e.g. $4,395.00) - Structural thesis invalidation"
              },
              "institutional_bias": "Brief analysis of institutional positioning changes (Accumulation/Distribution).",
              "global_context": {
                "news_highlights": [
                    "MACRO/GEO 1: Specific, hard-hitting Geopolitical or Central Bank news from the last 48 hours.",
                    "MACRO/GEO 2: Major economic data or global trade/political shift.",
                    "MACRO/GEO 3: Another pure macroeconomic driver affecting institutional risk appetite."
                ],
                "weekly_impact": "Deep analytical conclusion on how these specific macro/geopolitical events either validate or contradict the COT institutional positioning.",
                "market_sentiment_score": "Number 0-100. 0=Extreme Risk-Off (Safe Havens bid), 100=Extreme Risk-On. Base this purely on macro/geopolitical fears vs. greed.",
                "key_risks": ["Black Swan / Macro Risk 1", "Geopolitical / Economic Risk 2"]
              },
              "playbook": [
                {
                  "event": "Event Name",
                  "date": "Date/Time",
                  "forecast": "Consensus Forecast",
                  "plan": "What to do if it beats/misses",
                  "why": "Reasoning based on market conditions",
                  "when_to_act": "Specific timing or trigger",
                  "impact_if_deviates": "What happens if actual != forecast"
                }
              ]
            }
            `;
        } else {
            const topMovers = filteredSummaryData
                .sort((a, b) => Math.abs(b["Net Change"]) - Math.abs(a["Net Change"]))
                .slice(0, 10)
                .map(d => `${d.Commodity}: NetPos ${d["Net Positions"]}, Chg ${d["Net Change"]}`);

            prompt = `Act as a friendly, expert trading mentor. Analyze the current COT market overview based on these top movers:
            ${dateContext}
            ${JSON.stringify(topMovers)}
            
            ${searchInstruction}
            
            You MUST return the response in valid JSON format with the following structure. Do not use Markdown formatting outside the JSON strings.
            {
              "sentiment": {
                "label": "Risk-On" | "Risk-Off" | "Neutral",
                "reason": "Brief 1-sentence reason"
              },
              "perspective": "Big picture market themes and drivers.",
              "actionable_advice": "Which assets to watch and where the opportunities are.",
              "key_levels": {
                "support": "Key global support zones (e.g., DXY levels)",
                "resistance": "Key global resistance zones",
                "pivot_point": "Critical market pivot"
              },
              "institutional_bias": "Overall institutional flow analysis (Risk-On/Risk-Off flows).",
              "global_context": {
                "news_highlights": [
                    "MACRO/GEO 1: Specific, hard-hitting Geopolitical or Central Bank news from the last 48 hours.",
                    "MACRO/GEO 2: Major economic data or global trade/political shift.",
                    "MACRO/GEO 3: Another pure macroeconomic driver affecting institutional risk appetite."
                ],
                "weekly_impact": "Deep analytical conclusion on how these specific macro/geopolitical events shape global Risk-On/Risk-Off flows.",
                "market_sentiment_score": "Number 0-100. 0=Extreme Risk-Off (Safe Havens bid), 100=Extreme Risk-On.",
                "key_risks": ["Black Swan / Macro Risk 1", "Geopolitical / Economic Risk 2"]
              },
              "playbook": [
                {
                  "event": "Event Name",
                  "date": "Date/Time",
                  "forecast": "Consensus Forecast",
                  "plan": "Trading plan",
                  "why": "Reasoning",
                  "when_to_act": "Timing/Trigger",
                  "impact_if_deviates": "Impact analysis"
                }
              ]
            }
            `;
        }

        const apiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemini-3.1-flash',
                prompt,
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                systemInstruction: "You are a friendly, experienced trading mentor. You explain things simply and clearly. You are not a robot; you are a helpful guide. Always ground your advice in the data and news provided. You have access to Google Search; ALWAYS search for TODAY'S DAILY TIMEFRAME technical support and resistance levels from sites like Investing.com or TradingView. The user trades STRICTLY on the DAILY timeframe. Be decisive but responsible. Return ONLY valid JSON."
            })
        });

        const resData = await apiRes.json();
        if (!apiRes.ok || !resData.text) {
            throw new Error(resData.error || "Failed to generate analysis");
        }

        setAiAnalysis(resData.text);
        setIsAiOfflineMode(false);

    } catch (error: any) {
        console.warn("AI Generation encountered an issue, generating automated COT quantitative analysis:", error?.message || error);
        // Fallback to intelligent quantitative analysis so user always receives structured data without JSON parse errors
        setIsAiOfflineMode(true);
        const fallbackText = generateLocalFallbackAnalysis(
            selectedItem ? selectedItem.Commodity : "Market Overview",
            selectedItem,
            selectedHistory,
            liveQuote
        );
        setAiAnalysis(fallbackText);
    } finally {
        setIsAnalyzing(false);
    }
  };

  // Determine icon color based on theme
  const getIconColorClass = () => {
     return "text-blue-400";
  };
  const iconColor = getIconColorClass();

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden">
      {/* Header Bar */}
      <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur-xl p-4 rounded-2xl border shrink-0 z-40 transition-colors duration-500 ${themeStyles.headerBg}`}>
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
                onClick={() => setSelectedCommodity('')}
                className={`relative group p-0.5 rounded-xl transition-all shadow-lg overflow-hidden ${!selectedCommodity ? 'scale-105' : ''}`}
                title="Market Overview"
            >
                {/* Animated Border Gradient */}
                <div className={`absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#3b82f6_50%,#0000_100%)] animate-[spin_3s_linear_infinite] ${!selectedCommodity ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'}`} />
                
                {/* Inner Background */}
                <div className={`absolute inset-[1.5px] rounded-[10px] z-0 transition-colors duration-300 ${
                    !selectedCommodity 
                        ? 'bg-blue-600' 
                        : (themeMode === 'light' ? 'bg-slate-100 group-hover:bg-slate-200' : 'bg-slate-800 group-hover:bg-slate-700')
                }`}></div>

                {/* Content */}
                <div className={`relative z-10 p-2 ${
                    !selectedCommodity 
                        ? 'text-white' 
                        : (themeMode === 'light' ? 'text-slate-500' : 'text-slate-400')
                }`}>
                    <LayoutDashboard className="w-5 h-5 group-hover:animate-bounce" />
                </div>
            </button>
            <div className="flex flex-col">
                <h2 className={`text-xl font-medium flex items-center gap-3 tracking-tight font-heading leading-none ${themeStyles.textMain}`}>
                    <Activity className={`w-5 h-5 ${selectedCommodity ? iconColor : themeStyles.textSub}`} />
                    {selectedCommodity ? selectedCommodity : "Market Overview"}
                </h2>
                {selectedItem && (
                    <span className={`text-[10px] font-medium uppercase tracking-widest mt-1 ${themeStyles.textSub}`}>Futures & Options</span>
                )}
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            {/* Action Buttons Group - Exact equal widths and identical heights */}
            <div className="grid grid-cols-4 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                {/* Heatmap Button */}
                <button
                    onClick={() => setIsHeatmapOpen(true)}
                    className="relative group h-11 w-full sm:w-28 rounded-xl overflow-hidden shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
                    title="خريطة الحرارة لتمركزات السوق (Market Heatmap)"
                >
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#10b981_50%,#0000_100%)] animate-[spin_4s_linear_infinite]" />
                    
                    {/* Inner Background */}
                    <div className={`absolute inset-[1.5px] rounded-[10px] z-0 ${themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}`}></div>
                    
                    {/* Content */}
                    <div className={`relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 w-full px-1.5 text-xs sm:text-[13px] font-medium ${themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        <MapIcon className="w-4 h-4 shrink-0 group-hover:animate-pulse" />
                        <span className="truncate">Heatmap</span>
                    </div>
                </button>

                {/* Compare Button */}
                <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="relative group h-11 w-full sm:w-28 rounded-xl overflow-hidden shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
                    title="مقارنة الأصول وتمركزات الحيتان (Compare Assets)"
                >
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#8b5cf6_50%,#0000_100%)] animate-[spin_3s_linear_infinite_reverse]" />
                    
                    {/* Inner Background */}
                    <div className={`absolute inset-[1.5px] rounded-[10px] z-0 ${themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}`}></div>
                    
                    {/* Content */}
                    <div className={`relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 w-full px-1.5 text-xs sm:text-[13px] font-medium ${themeMode === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        <Scale className="w-4 h-4 shrink-0 group-hover:animate-pulse" />
                        <span className="truncate">Compare</span>
                    </div>
                </button>

                {/* AI Insight Button */}
                <button
                    onClick={handleAIAnalysis}
                    className="relative group h-11 w-full sm:w-28 rounded-xl overflow-hidden shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
                    title="التحليل الذكي وتوليد الرؤى (AI Insights)"
                >
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#3b82f6_50%,#0000_100%)] animate-[spin_3s_linear_infinite]" />
                    
                    {/* Inner Background */}
                    <div className={`absolute inset-[1.5px] rounded-[10px] z-0 ${themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}`}></div>
                    
                    {/* Content */}
                    <div className={`relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 w-full px-1.5 text-xs sm:text-[13px] font-medium ${themeMode === 'light' ? 'text-blue-600' : 'text-white'}`}>
                        <Sparkles className="w-4 h-4 shrink-0 group-hover:animate-pulse" />
                        <span className="truncate">AI Insight</span>
                    </div>
                </button>

                {/* Educational Guide Button */}
                <button
                    onClick={() => setIsGuideOpen(true)}
                    className="relative group h-11 w-full sm:w-28 rounded-xl overflow-hidden shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
                    title="الدليل التعليمي التفاعلي لتقرير COT ومحاكي ميزان القوى"
                >
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#06b6d4_50%,#0000_100%)] animate-[spin_4s_linear_infinite]" />
                    
                    {/* Inner Background */}
                    <div className={`absolute inset-[1.5px] rounded-[10px] z-0 ${themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}`}></div>
                    
                    {/* Content */}
                    <div className={`relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 w-full px-1.5 text-xs sm:text-[13px] font-medium ${themeMode === 'light' ? 'text-blue-700' : 'text-white'}`}>
                        <GraduationCap className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">Guide</span>
                    </div>
                </button>
            </div>

            {/* Dropdown */}
            <div className="relative w-full sm:w-60 shrink-0" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full h-11 flex items-center justify-between backdrop-blur-xl border rounded-xl px-4 text-sm transition-all ${isDropdownOpen ? 'ring-2' : ''} ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 ring-blue-500/30' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 ring-white/10'}`}
            >
                <span className={`truncate font-medium ${!selectedCommodity ? 'opacity-60' : ''}`}>
                    {selectedCommodity || "Select Asset..."}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <div 
                className={`absolute top-full left-0 right-0 mt-2 backdrop-blur-2xl border rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top flex flex-col max-h-[60vh] z-50 
                ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                ${themeStyles.dropdownBg}`}
            >
                <div className="overflow-y-auto custom-scrollbar p-1.5">
                    <button
                        onClick={() => { setSelectedCommodity(''); setIsDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group mb-1 ${selectedCommodity === '' ? themeStyles.activeButtonBg : `${themeStyles.dropdownItemHover} opacity-70 hover:opacity-100`}`}
                    >
                        <span className="font-medium">Market Overview</span>
                        {selectedCommodity === '' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    
                    <div className="h-px bg-current opacity-10 my-1 mx-2"></div>

                    {ASSET_GROUPS.map((group) => {
                        const groupAssets = group.items.filter(name => filteredSummaryData.some(d => d.Commodity === name));
                        if (groupAssets.length === 0) return null;

                        return (
                            <div key={group.name} className="mt-2 mb-1">
                                <div className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider opacity-80 bg-black/10 mx-1 rounded-md mb-1 text-blue-400`}>
                                    {group.name}
                                </div>
                                {groupAssets.map(assetName => {
                                    const item = filteredSummaryData.find(d => d.Commodity === assetName);
                                    if (!item) return null;
                                    return (
                                        <button
                                            key={item.Commodity}
                                            onClick={() => { setSelectedCommodity(item.Commodity); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group mb-0.5 ${selectedCommodity === item.Commodity ? themeStyles.activeButtonBg : `${themeStyles.dropdownItemHover} opacity-80 hover:opacity-100`}`}
                                        >
                                            <span>{item.Commodity}</span>
                                            {selectedCommodity === item.Commodity && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
            </div>
        </div>
      </div>

      {selectedItem ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 animate-fade-in">
            {/* Left Sidebar - Overview & Stats */}
            <div className="lg:col-span-4 flex flex-col gap-6 [perspective:1000px] h-full">
                <div className={`relative w-full h-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateX(180deg)]' : ''}`}>
                    
                    {/* Front Face */}
                    <div className={`w-full h-full [backface-visibility:hidden] p-5 rounded-3xl border shadow-xl flex flex-col transition-colors duration-500 ${themeStyles.chartBg}`}>
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h2 className={`text-2xl font-medium tracking-tight font-heading ${themeStyles.textMain}`}>
                                    {selectedCommodity}
                                </h2>
                                <p className={`text-sm mt-1 ${themeStyles.textSub}`}>Market Overview</p>
                            </div>
                            <button 
                                onClick={() => setIsCardFlipped(true)}
                                className={`p-3 rounded-2xl transition-colors ${themeMode === 'light' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                                title="View TradingView Chart"
                            >
                                <BarChart2 className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                                <p className={`text-sm font-medium ${themeStyles.textSub}`}>Net Position</p>
                                <InfoTooltip text="الفرق بين صفقات الشراء (Long) والبيع (Short). يعكس الاتجاه العام لصناع السوق." themeMode={themeMode} />
                            </div>
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span className={`text-4xl font-mono font-medium tracking-tighter ${themeStyles.textMain}`}>
                                    {formatCurrency(selectedItem["Net Positions"])}
                                </span>
                                <span className={`text-sm font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                                    selectedItem["Net Change"] > 0 
                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                        : selectedItem["Net Change"] < 0 
                                            ? 'bg-rose-500/10 text-rose-500'
                                            : 'bg-slate-500/10 text-slate-500'
                                }`}>
                                    {selectedItem["Net Change"] > 0 ? <ArrowUpRight className="w-4 h-4" /> : selectedItem["Net Change"] < 0 ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                    {formatCurrency(Math.abs(selectedItem["Net Change"]))}
                                </span>
                            </div>
                            
                            {/* Extreme Alert Badge */}
                            {(() => {
                                const total = selectedItem["Long Positions"] + selectedItem["Short Positions"];
                                if (total === 0) return null;
                                const longRatio = selectedItem["Long Positions"] / total;
                                if (longRatio > 0.8) {
                                    return (
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-xs font-medium border border-emerald-500/30 animate-pulse">
                                            <AlertTriangle className="w-4 h-4" />
                                            Extreme Bullish (Overbought Warning)
                                        </div>
                                    );
                                }
                                if (longRatio < 0.2) {
                                    return (
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-500 text-xs font-medium border border-rose-500/30 animate-pulse">
                                            <AlertTriangle className="w-4 h-4" />
                                            Extreme Bearish (Oversold Warning)
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {/* Sentiment Bar */}
                        <div className="mb-5">
                            <div className="flex justify-between text-sm font-medium mb-3">
                                <div className="flex items-center gap-1.5 text-blue-500">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Long {((selectedItem["Long Positions"] / (selectedItem["Long Positions"] + selectedItem["Short Positions"])) * 100).toFixed(1)}%</span>
                                    <InfoTooltip text="نسبة صفقات الشراء من إجمالي الصفقات المفتوحة." themeMode={themeMode} />
                                </div>
                                <div className={`flex items-center gap-1.5 ${themeMode === 'light' ? 'text-slate-400' : 'text-white'}`}>
                                    <InfoTooltip text="نسبة صفقات البيع من إجمالي الصفقات المفتوحة." themeMode={themeMode} />
                                    <span>{((selectedItem["Short Positions"] / (selectedItem["Long Positions"] + selectedItem["Short Positions"])) * 100).toFixed(1)}% Short</span>
                                    <TrendingDown className="w-4 h-4" />
                                </div>
                            </div>
                            <div className={`h-3 w-full rounded-full overflow-hidden flex ${themeMode === 'light' ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(selectedItem["Long Positions"] / (selectedItem["Long Positions"] + selectedItem["Short Positions"])) * 100}%` }}></div>
                                <div className={`h-full transition-all duration-1000 ${themeMode === 'light' ? 'bg-slate-300' : 'bg-white'}`} style={{ width: `${(selectedItem["Short Positions"] / (selectedItem["Long Positions"] + selectedItem["Short Positions"])) * 100}%` }}></div>
                            </div>
                            <div className={`flex justify-between text-xs mt-2 font-mono ${themeStyles.textSub}`}>
                                <span>{formatCurrency(selectedItem["Long Positions"])}</span>
                                <span>{formatCurrency(selectedItem["Short Positions"])}</span>
                            </div>
                        </div>

                        {/* This Week's Positions */}
                        <div className="space-y-3 mt-2">
                            <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${themeStyles.textSub}`}>This Week's Positions</p>
                            <div className={`flex justify-between items-center p-3.5 rounded-2xl border transition-colors ${themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900/50 border-white/5'}`}>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    <span className={`text-sm font-medium ${themeStyles.textSub}`}>Longs</span>
                                    <InfoTooltip text="إجمالي عقود الشراء المفتوحة لصناع السوق." themeMode={themeMode} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-medium text-blue-500">{formatCurrency(selectedItem["Long Positions"])}</span>
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${selectedItem["Long Change"] > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                        {selectedItem["Long Change"] > 0 ? '+' : ''}{formatCurrency(selectedItem["Long Change"])}
                                    </span>
                                </div>
                            </div>
                            <div className={`flex justify-between items-center p-3.5 rounded-2xl border transition-colors ${themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900/50 border-white/5'}`}>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className={`w-4 h-4 ${themeMode === 'light' ? 'text-slate-400' : 'text-white'}`} />
                                    <span className={`text-sm font-medium ${themeStyles.textSub}`}>Shorts</span>
                                    <InfoTooltip text="إجمالي عقود البيع المفتوحة لصناع السوق." themeMode={themeMode} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-mono font-medium ${themeMode === 'light' ? 'text-slate-700' : 'text-white'}`}>{formatCurrency(selectedItem["Short Positions"])}</span>
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${selectedItem["Short Change"] > 0 ? (themeMode === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-white/20 text-white') : 'bg-slate-500/10 text-slate-500'}`}>
                                        {selectedItem["Short Change"] > 0 ? '+' : ''}{formatCurrency(selectedItem["Short Change"])}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Trading Notes Section */}
                        <div className="mt-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <Edit3 className={`w-4 h-4 ${themeStyles.textSub}`} />
                                <p className={`text-xs font-medium uppercase tracking-wider ${themeStyles.textSub}`}>My Trading Notes</p>
                            </div>
                            <textarea
                                value={notes[selectedCommodity] || ''}
                                onChange={(e) => handleNoteChange(selectedCommodity, e.target.value)}
                                placeholder={`Add your analysis notes for ${selectedCommodity} here...`}
                                className={`w-full flex-1 min-h-[100px] p-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-all ${
                                    themeMode === 'light' 
                                        ? 'bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:ring-blue-500/50' 
                                        : 'bg-slate-900/50 border border-white/5 text-slate-300 placeholder-slate-600 focus:ring-white/50'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Back Face - TradingView Chart */}
                    <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateX(180deg)] p-4 rounded-3xl border shadow-xl flex flex-col transition-colors duration-500 ${themeStyles.chartBg}`}>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className={`text-lg font-medium tracking-tight font-heading ${themeStyles.textMain}`}>
                                Live Chart
                            </h3>
                            <button 
                                onClick={() => setIsCardFlipped(false)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${themeMode === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                        <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <TradingViewWidget symbol={TV_SYMBOL_MAP[selectedCommodity] || "OANDA:XAUUSD"} themeMode={themeMode} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Charts */}
            <div className="lg:col-span-8 flex flex-col h-full">
                {/* Main Chart */}
                <div className={`w-full flex-1 rounded-3xl border shadow-xl relative overflow-hidden flex flex-col transition-colors duration-500 animate-fade-in delay-100 ${themeStyles.chartBg}`}>
                    <div className={`flex flex-wrap items-center justify-between p-5 border-b relative z-20 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/30 border-white/5'}`}>
                        <div>
                            <h3 className={`text-lg font-medium tracking-tight font-heading flex items-center gap-2 ${themeStyles.textMain}`}>
                                Historical Net Position
                                <span className={`px-2 py-0.5 rounded text-[10px] border ${themeMode === 'light' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/20 text-blue-300 border-blue-500/20'}`}>6 Weeks</span>
                            </h3>
                            <p className={`text-xs mt-0.5 ${themeStyles.textSub}`}>Track institutional positioning trends over time</p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 sm:mt-0">
                            <AssetSelector
                                selectedAssets={mainCompareAssets}
                                maxSelection={2}
                                onToggle={toggleMainCompare}
                                isOpen={isMainCompareOpen}
                                setIsOpen={setIsMainCompareOpen}
                                themeMode={themeMode}
                                excludeAsset={selectedCommodity}
                            />
                            <div className={`flex items-center gap-4 p-2 px-4 rounded-xl border hidden xl:flex ${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-white/5'}`}>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-medium uppercase tracking-wider ${themeStyles.textSub}`}>High</span>
                                    <span className={`text-sm font-mono font-medium ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>{formatCurrency(chartStats.max)}</span>
                                </div>
                                <div className="w-px h-6 bg-current opacity-10"></div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-medium uppercase tracking-wider ${themeStyles.textSub}`}>Avg</span>
                                    <span className={`text-sm font-mono font-medium text-blue-500`}>{formatCurrency(chartStats.avg)}</span>
                                </div>
                                <div className="w-px h-6 bg-current opacity-10"></div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-medium uppercase tracking-wider ${themeStyles.textSub}`}>Low</span>
                                    <span className={`text-sm font-mono font-medium ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{formatCurrency(chartStats.min)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-0 relative z-10 p-4">
                             {mainChartData.length > 0 ? (
                                 <motion.div 
                                     key={`chart-container-${selectedCommodity}`}
                                     initial={{ opacity: 0, y: 20 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     transition={{ duration: 0.5, ease: "easeOut" }}
                                     className="w-full h-full"
                                 >
                                     <ComposedChart
                                       data={mainChartData}
                                       xDataKey="date"
                                       animationDuration={1100}
                                       animationEasing="cubic-bezier(0.85, 0, 0.15, 1)"
                                     >
                                     
                                       <ReferenceArea
                                         y1={chartStats.avg * 0.9}
                                         y2={chartStats.avg * 1.1}
                                         fill="color-mix(in oklch, var(--chart-foreground-muted) 15%, transparent)"
                                         fillOpacity={1}
                                         pattern="none"
                                         patternColor="var(--chart-foreground-muted)"
                                         stroke="var(--chart-foreground-muted)"
                                         strokeStyle="dashed"
                                         strokeDasharray="4,4"
                                         fadeEdges={true}
                                         fadeEdgesLength={10}
                                         axisLabelColor={themeStyles.chartAxis}
                                         showMarkers={true}
                                         markerColor={themeStyles.chartAxis}
                                       />
                                     
                                       <Area
                                         dataKey="value"
                                         
                                         fillOpacity={0.3}
                                         strokeWidth={3}
                                         fill={trendColor}
                                         stroke={trendColor}
                                         fadeEdges
                                         gradientToOpacity={0}
                                         showLine
                                         showHighlight
                                       />
                                     
                                       {mainCompareAssets.map((asset, idx) => (
                                         <Line
                                           key={asset}
                                           dataKey={`compare_${idx}`}
                                           
                                           strokeWidth={2}
                                           stroke={COMPARE_COLORS[idx]}
                                           fadeEdges
                                           showHighlight
                                         />
                                       ))}
                                     
                                       <XAxis />
                                       <ChartTooltip />
                                     </ComposedChart>
                                 </motion.div>
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    No historical data available.
                                </div>
                             )}
                         </div>

                         {/* Background Decoration */}
                         <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none -mr-20 -mt-20 ${themeMode === 'light' ? 'bg-blue-100/50' : 'bg-blue-600/5'}`}></div>
                    </div>
            </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
            {/* Determine what to show: User favorites if they exist (up to 4), otherwise fallback to FEATURED_ASSETS */}
            {(() => {
                const assetsToShow = favorites.length > 0 
                    ? favorites.slice(0, 4) 
                    : FEATURED_ASSETS;
                
                return assetsToShow.map((assetName, index) => {
                    const summary = filteredSummaryData.find(s => s.Commodity === assetName);
                    const history = historyData.find(h => h.Commodity === assetName);
                    if (!summary) return null;
                    return (
                        <motion.div
                            key={assetName}
                            initial={{ opacity: 0, y: 32, x: (index - 1.5) * 16 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            transition={{ 
                              duration: 0.7, 
                              delay: index * 0.12, 
                              ease: [0.22, 1, 0.36, 1] 
                            }}
                            className="h-full"
                        >
                            <AssetTrendCard
                                index={index}
                                title={assetName}
                                commodity={assetName}
                                summaryRow={summary}
                                historyRow={history}
                                dates={historyDates}
                                onClick={() => setSelectedCommodity(assetName)}
                                isSelected={false}
                                themeMode={themeMode}
                            />
                        </motion.div>
                    );
                });
            })()}
          </div>
      )}

      {/* Market Scanner Grid */}
      {!selectedItem && (
        <div className={`backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden flex-1 min-h-0 flex flex-col mt-4 animate-fade-in delay-100 ${themeStyles.chartBg}`}>
            <div 
                className={`px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 cursor-pointer ${themeStyles.tableHeader}`}
                onClick={() => setIsMarketScannerOpen(!isMarketScannerOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-transform duration-300 ${isMarketScannerOpen ? 'rotate-0' : '-rotate-90'} ${themeMode === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`text-base font-medium tracking-tight font-heading ${themeStyles.textMain}`}>Market Scanner</h3>
                        <p className={`text-xs ${themeStyles.textSub}`}>Real-time institutional positioning</p>
                    </div>
                </div>
                
                {/* Search Input - Only visible when open */}
                {isMarketScannerOpen && (
                    <div className="relative w-full sm:w-64 group" onClick={(e) => e.stopPropagation()}>
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${themeMode === 'light' ? 'text-slate-400 group-focus-within:text-blue-500' : 'text-slate-500 group-focus-within:text-blue-400'}`}>
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/50 border-white/10 text-white hover:bg-slate-900/80'}`}
                        />
                    </div>
                )}
            </div>
            
            {isMarketScannerOpen && (
                <div className="overflow-auto flex-1 custom-scrollbar">
                <table className={`w-full text-xs text-left ${themeStyles.textSub} border-collapse`}>
                    <thead className={`text-[11px] font-medium uppercase sticky top-0 z-10 shadow-lg backdrop-blur-md ${themeStyles.tableHeader}`}>
                    <tr>
                        {[
                            { key: 'star', label: '', align: 'center', noSort: true },
                            { key: 'Commodity', label: 'Asset', align: 'left' },
                            { key: 'Net Positions', label: 'Net Pos', align: 'right' },
                            { key: 'Sentiment', label: 'Sentiment', align: 'center' },
                            { key: 'Net Change', label: 'Net Chg', align: 'right' },
                            { key: 'Long Change', label: 'Long Chg', align: 'right' },
                            { key: 'Short Change', label: 'Short Chg', align: 'right' }
                        ].map((col) => (
                            <th 
                                key={col.key} 
                                className={`px-6 py-5 tracking-wider cursor-pointer select-none transition-colors hover:text-blue-400 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                onClick={() => !col.noSort && handleSort(col.key as any)}
                            >
                                <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                                    {col.label}
                                    {!col.noSort && (
                                        <span className="flex flex-col ml-1">
                                            {sortConfig?.key === col.key ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className={`divide-y ${themeStyles.tableDivider}`}>
                    {filteredSummaryData.map((row) => {
                        const historyRow = historyData.find(h => h.Commodity === row.Commodity);
                        const sparklineData = historyRow 
                        ? historyDates.map(date => ({ value: historyRow[date] as number })).reverse()
                        : [];
                        
                        // Colors for table values - Blue/White Theme
                        const posColor = themeMode === 'light' ? "text-blue-600" : "text-white";
                        const negColor = themeMode === 'light' ? "text-slate-600" : "text-white"; 
                        const mutedColor = themeMode === 'light' ? "text-slate-400" : "text-slate-500";
                        
                        // Sparkline Colors - Blue/Cyan theme
                        const sparkColor = themeMode === 'light' ? '#2563eb' : '#ffffff'; // Blue-600 or Cyan-400

                        return (
                        <tr 
                            key={row.Commodity} 
                            className={`cursor-pointer transition-all duration-200 group border-l-4 hover:bg-white/5 ${selectedCommodity === row.Commodity ? themeStyles.tableRowSelected : `border-l-transparent ${themeStyles.tableRow}`}`}
                            onClick={() => setSelectedCommodity(row.Commodity)}
                        >
                            <td className="px-4 py-4 text-center">
                                <button
                                    onClick={(e) => toggleFavorite(e, row.Commodity)}
                                    className={`transition-colors focus:outline-none ${favorites.includes(row.Commodity) ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-400 hover:text-yellow-500 opacity-30 group-hover:opacity-100'}`}
                                >
                                    <Star className={`w-4 h-4 ${favorites.includes(row.Commodity) ? 'fill-current' : ''}`} />
                                </button>
                            </td>
                            <td className={`px-6 py-4 font-medium tracking-tight transition-colors ${themeStyles.textMain}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${row["Net Change"] > 0 ? 'bg-white shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-400'}`}></div>
                                    <span className="text-sm">{row.Commodity}</span>
                                </div>
                            </td>
                            
                            <td className={`px-6 py-4 text-right font-mono font-medium text-sm ${row["Net Positions"] > 0 ? (themeMode === 'light' ? 'text-blue-600' : 'text-blue-400') : mutedColor}`}>
                                {formatCurrency(row["Net Positions"])}
                            </td>

                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 w-24 mx-auto">
                                    <div className="flex justify-between text-[10px] font-medium uppercase opacity-70">
                                        <span className="text-blue-400">L</span>
                                        <span className="text-slate-400">S</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden flex">
                                        {(() => {
                                            const total = row["Long Positions"] + row["Short Positions"];
                                            if (total === 0) return <div className="w-full bg-slate-600"></div>;
                                            const longPct = (row["Long Positions"] / total) * 100;
                                            return (
                                                <>
                                                    <div style={{ width: `${longPct}%` }} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                    <div style={{ width: `${100 - longPct}%` }} className="h-full bg-slate-400/50"></div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </td>

                            <td className="px-6 py-4 text-right">
                                <div className={`inline-flex items-center justify-end gap-1 font-medium px-2 py-0.5 rounded-md border ${
                                    row["Net Change"] > 0 
                                        ? (themeMode === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white/10 text-white border-white/20') 
                                        : row["Net Change"] < 0 
                                            ? (themeMode === 'light' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/5 text-white border-white/10') 
                                            : (themeMode === 'light' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-white/5')
                                }`}>
                                    {row["Net Change"] > 0 ? <ArrowUpRight className="w-3 h-3" /> : row["Net Change"] < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                    {formatCurrency(row["Net Change"])}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-right">
                                <div className={`flex items-center justify-end gap-1 font-medium text-xs ${row["Long Change"] > 0 ? posColor : row["Long Change"] < 0 ? negColor : mutedColor}`}>
                                    {formatCurrency(row["Long Change"])}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-right">
                                <div className={`flex items-center justify-end gap-1 font-medium text-xs ${row["Short Change"] > 0 ? posColor : row["Short Change"] < 0 ? negColor : mutedColor}`}>
                                    {formatCurrency(row["Short Change"])}
                                </div>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            )}
        </div>
      )}

      {/* AI Analysis Overlay */}
      <AIAnalysisOverlay
        isAiOfflineMode={isAiOfflineMode} 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)}
        isLoading={isAnalyzing}
        analysis={aiAnalysis}
        title={selectedItem ? selectedItem.Commodity : "Market Overview"}
        data={selectedItem || null}
      />

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        onCompare={(assets) => {
          setIsCompareModalOpen(false);
          if (onNavigateToCompare) {
            onNavigateToCompare(assets);
          }
        }}
        themeMode={themeMode}
      />

      {/* Heatmap Modal */}
      <HeatmapModal
        isOpen={isHeatmapOpen}
        onClose={() => setIsHeatmapOpen(false)}
        data={summaryData}
        themeMode={themeMode}
        onSelectAsset={(commodity) => {
          setSelectedCommodity(commodity);
          setIsHeatmapOpen(false);
        }}
      />

      {/* Educational Guide Modal */}
      <EducationalGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        themeMode={themeMode}
      />
    </div>
  );
};

export default Dashboard;
