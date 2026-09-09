import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Flame, TrendingUp, TrendingDown, Activity, AlertTriangle, 
  Search, ArrowUpDown, LayoutGrid, Layers, Zap, Check, 
  ExternalLink, Sparkles, Filter, ChevronDown, BarChart2
} from 'lucide-react';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { ASSET_GROUPS, TV_SYMBOL_MAP } from '../constants';

interface HeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SummaryRow[];
  themeMode: ThemeMode;
  onSelectAsset?: (commodityName: string) => void;
}

type SortOption = 'highest_long' | 'highest_short' | 'net_position' | 'weekly_change' | 'volume' | 'alphabetical';
type SentimentFilter = 'all' | 'bullish' | 'bearish' | 'extreme' | 'neutral';
type ViewMode = 'cards' | 'treemap';

// Helper to determine asset category
const getAssetCategory = (commodity: string): string => {
  for (const group of ASSET_GROUPS) {
    if (group.items.includes(commodity)) {
      return group.name;
    }
  }
  return 'Other';
};

// Helper for clean symbol display
const getDisplaySymbol = (commodity: string): string => {
  const tv = TV_SYMBOL_MAP[commodity];
  if (!tv) return commodity.substring(0, 4).toUpperCase();
  const parts = tv.split(':');
  const sym = parts[1] || tv;
  if (sym.startsWith('XAU')) return 'XAU/USD';
  if (sym.startsWith('XAG')) return 'XAG/USD';
  if (sym.startsWith('XCU')) return 'COPPER';
  if (sym.startsWith('EUR')) return 'EUR/USD';
  if (sym.startsWith('GBP')) return 'GBP/USD';
  if (sym.startsWith('USDJPY')) return 'USD/JPY';
  if (sym.startsWith('USDCAD')) return 'USD/CAD';
  if (sym.startsWith('AUDUSD')) return 'AUD/USD';
  if (sym.startsWith('USDCHF')) return 'USD/CHF';
  if (sym.startsWith('NZDUSD')) return 'NZD/USD';
  if (sym.startsWith('BTC')) return 'BTC/USD';
  if (sym.startsWith('ETH')) return 'ETH/USD';
  if (sym.startsWith('WTICO')) return 'WTI OIL';
  if (sym.startsWith('NATGAS')) return 'NAT GAS';
  if (sym.startsWith('ES')) return 'S&P 500';
  if (sym.startsWith('NQ')) return 'NASDAQ';
  if (sym.startsWith('YM')) return 'DOW 30';
  if (sym.startsWith('RTY')) return 'RUSSELL';
  return sym.replace('USD', '/USD').replace('USDT', '/USDT').substring(0, 7);
};

const HeatmapModal: React.FC<HeatmapModalProps> = ({ 
  isOpen, 
  onClose, 
  data, 
  themeMode,
  onSelectAsset 
}) => {
  const isLight = themeMode === 'light';

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('highest_long');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Process data for the heatmap
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      const totalPositions = item["Long Positions"] + item["Short Positions"];
      const longRatio = totalPositions > 0 ? item["Long Positions"] / totalPositions : 0.5;
      const shortRatio = totalPositions > 0 ? item["Short Positions"] / totalPositions : 0.5;
      const category = getAssetCategory(item.Commodity);
      const symbol = getDisplaySymbol(item.Commodity);
      const isExtreme = longRatio >= 0.75 || shortRatio >= 0.75;

      let statusType: 'extreme_bull' | 'bullish' | 'extreme_bear' | 'bearish' | 'neutral' = 'neutral';
      let statusLabelAr = 'توازن مؤسسي';
      let statusLabelEn = 'Neutral / Balanced';

      if (longRatio >= 0.75) {
        statusType = 'extreme_bull';
        statusLabelAr = 'شراء كاسح (تشبع)';
        statusLabelEn = 'Extreme Bullish';
      } else if (longRatio >= 0.58) {
        statusType = 'bullish';
        statusLabelAr = 'ثقة شرائية قوية';
        statusLabelEn = 'Strong Long';
      } else if (shortRatio >= 0.75) {
        statusType = 'extreme_bear';
        statusLabelAr = 'بيع كاسح (تشبع)';
        statusLabelEn = 'Extreme Bearish';
      } else if (shortRatio >= 0.58) {
        statusType = 'bearish';
        statusLabelAr = 'ضغط بيعي مؤسسي';
        statusLabelEn = 'Strong Short';
      }

      return {
        ...item,
        totalPositions,
        longRatio,
        shortRatio,
        category,
        symbol,
        isExtreme,
        statusType,
        statusLabelAr,
        statusLabelEn,
      };
    });
  }, [data]);

  // Macro Statistics for Header
  const macroStats = useMemo(() => {
    if (processedData.length === 0) return { total: 0, bullishCount: 0, bearishCount: 0, bullishPct: 50, avgLongRatio: 50 };
    const total = processedData.length;
    const bullishCount = processedData.filter(d => d.longRatio >= 0.55).length;
    const bearishCount = processedData.filter(d => d.shortRatio >= 0.55).length;
    const neutralCount = total - bullishCount - bearishCount;
    const bullishPct = Math.round((bullishCount / total) * 100);
    const avgLongRatio = Math.round(
      (processedData.reduce((acc, curr) => acc + curr.longRatio, 0) / total) * 100
    );

    return {
      total,
      bullishCount,
      bearishCount,
      neutralCount,
      bullishPct,
      avgLongRatio,
    };
  }, [processedData]);

  // Filter and Sort Data
  const filteredAndSortedData = useMemo(() => {
    return processedData
      .filter(item => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.Commodity.toLowerCase().includes(q);
          const matchSymbol = item.symbol.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          if (!matchName && !matchSymbol && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // Sentiment filter
        if (selectedSentiment === 'bullish') {
          return item.longRatio >= 0.58;
        }
        if (selectedSentiment === 'bearish') {
          return item.shortRatio >= 0.58;
        }
        if (selectedSentiment === 'extreme') {
          return item.isExtreme;
        }
        if (selectedSentiment === 'neutral') {
          return item.longRatio < 0.58 && item.shortRatio < 0.58;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'highest_long':
            return b.longRatio - a.longRatio;
          case 'highest_short':
            return b.shortRatio - a.shortRatio;
          case 'net_position':
            return Math.abs(b["Net Positions"]) - Math.abs(a["Net Positions"]);
          case 'weekly_change':
            return Math.abs(b["Net Change"]) - Math.abs(a["Net Change"]);
          case 'volume':
            return b.totalPositions - a.totalPositions;
          case 'alphabetical':
            return a.Commodity.localeCompare(b.Commodity);
          default:
            return 0;
        }
      });
  }, [processedData, searchQuery, selectedCategory, selectedSentiment, sortBy]);

  // Categories list with counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: processedData.length };
    processedData.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return [
      { id: 'All', labelAr: 'جميع الأسواق', labelEn: 'All Assets', count: counts['All'] || 0 },
      { id: 'Currencies', labelAr: 'العملات الأجنبية', labelEn: 'Currencies FX', count: counts['Currencies'] || 0 },
      { id: 'Metals', labelAr: 'المعادن والذهب', labelEn: 'Precious Metals', count: counts['Metals'] || 0 },
      { id: 'Energy', labelAr: 'الطاقة والنفط', labelEn: 'Energy', count: counts['Energy'] || 0 },
      { id: 'Indices', labelAr: 'المؤشرات العالمية', labelEn: 'Indices', count: counts['Indices'] || 0 },
      { id: 'Crypto', labelAr: 'العملات الرقمية', labelEn: 'Crypto', count: counts['Crypto'] || 0 },
    ].filter(c => c.id === 'All' || (counts[c.id] && counts[c.id] > 0));
  }, [processedData]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 overflow-hidden"
      onClick={onClose}
    >
      {/* Background Decorative Ambient Glows matching Ocean Blue theme */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
        isLight ? 'bg-blue-400/10' : 'bg-blue-600/15'
      }`}></div>
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
        isLight ? 'bg-cyan-400/10' : 'bg-cyan-500/15'
      }`}></div>

      <div 
        className={`relative w-full max-w-7xl h-[92vh] max-h-[960px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-200 animate-in zoom-in-95 ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60' 
            : 'bg-slate-900 border-blue-800/40 text-blue-50 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.95)]'
        }`}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP GLOW BAR (Ocean Blue & Cyan Brand Gradient) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500"></div>

        {/* 1. HEADER SECTION */}
        <div className={`p-4 sm:p-6 border-b shrink-0 ${
          isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-900/90 border-blue-900/40'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title and Brand Header */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  isLight 
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-blue-500/25' 
                    : 'bg-gradient-to-br from-blue-600 to-cyan-500 shadow-blue-500/30'
                }`}>
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    خريطة الحرارة ومراكز السيولة
                  </h2>
                  <span className={`hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider border ${
                    isLight 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'bg-blue-500/10 text-cyan-400 border-blue-500/30'
                  }`}>
                    Live Institutional Heatmap
                  </span>
                </div>
                <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-blue-200/70'}`}>
                  رصد مباشر لتدفقات الأموال الذكية وتمركزات كبار المضاربين حسب تقرير الـ COT
                </p>
              </div>
            </div>

            {/* Macro Sentiment Gauge & Stats Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Macro Bias Meter */}
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-blue-900/40'
              }`}>
                <div className="flex flex-col text-right">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-blue-200/60'}`}>
                    المزاج العام للسوق
                  </span>
                  <span className={`text-xs font-black flex items-center gap-1 ${
                    macroStats.bullishPct >= 50 
                      ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                      : isLight ? 'text-slate-700' : 'text-white'
                  }`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {macroStats.bullishPct}% صعودي
                  </span>
                </div>

                {/* Visual Ratio Bar */}
                <div className="w-24 sm:w-28 flex flex-col gap-1">
                  <div className={`h-2 w-full rounded-full overflow-hidden flex p-0.5 ${isLight ? 'bg-slate-200' : 'bg-slate-950/60'}`}>
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500" 
                      style={{ width: `${macroStats.bullishPct}%` }}
                    ></div>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLight ? 'bg-gradient-to-r from-slate-400 to-slate-600' : 'bg-gradient-to-r from-slate-300 to-white'
                      }`}
                      style={{ width: `${100 - macroStats.bullishPct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono font-bold">
                    <span className={isLight ? 'text-blue-600' : 'text-cyan-400'}>{macroStats.bullishCount} شراء</span>
                    <span className={isLight ? 'text-slate-600' : 'text-white'}>{macroStats.bearishCount} بيع</span>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-blue-900/40'
              }`}>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-blue-200/70 hover:text-white'
                  }`}
                  title="عرض البطاقات الحديثة"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>بطاقات تفاعلية</span>
                </button>
                <button
                  onClick={() => setViewMode('treemap')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'treemap'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-blue-200/70 hover:text-white'
                  }`}
                  title="عرض خريطة المربعات المتلاصقة"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>تري ماب (Treemap)</span>
                </button>
              </div>

              {/* Close Button */}
              <button 
                onClick={onClose} 
                className={`p-2.5 rounded-2xl transition-colors border ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600' 
                    : 'bg-slate-800/80 border-blue-900/40 hover:bg-slate-700 text-blue-200 hover:text-white'
                }`}
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. FILTERS & SEARCH TOOLBAR */}
          <div className={`mt-4 pt-4 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
            isLight ? 'border-slate-200' : 'border-blue-900/40'
          }`}>
            {/* Category Ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar scrollbar-none">
              {categoriesWithCounts.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    selectedCategory === cat.id
                      ? isLight
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : isLight
                        ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        : 'bg-slate-800/60 text-blue-200/70 border-blue-900/30 hover:border-blue-700 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{cat.labelAr}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.id
                      ? isLight ? 'bg-white/20 text-white' : 'bg-blue-900/40 text-cyan-200 font-bold'
                      : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-900/80 text-blue-300'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Controls: Search, Sentiment, Sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Box */}
              <div className={`relative flex items-center rounded-xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-blue-900/40'
              }`}>
                <Search className={`w-3.5 h-3.5 mr-2.5 pointer-events-none ${isLight ? 'text-slate-400' : 'text-blue-400'}`} />
                <input
                  type="text"
                  placeholder="ابحث عن أصل أو رمز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent text-xs py-1.5 pl-3 pr-8 focus:outline-none w-32 sm:w-44 ${
                    isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-blue-300/40'
                  }`}
                  dir="rtl"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2 text-slate-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sentiment Filter Tabs */}
              <div className={`flex items-center rounded-xl border p-0.5 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-blue-900/40'
              }`}>
                <button
                  onClick={() => setSelectedSentiment('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedSentiment === 'all'
                      ? isLight ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-sm'
                      : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-blue-200/70 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setSelectedSentiment('bullish')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    selectedSentiment === 'bullish'
                      ? isLight ? 'bg-blue-600 text-white shadow-sm font-black' : 'bg-blue-600 text-white shadow-sm font-black'
                      : isLight ? 'text-blue-600 hover:text-blue-800' : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-blue-600' : 'bg-cyan-400'}`}></span>
                  شراء
                </button>
                <button
                  onClick={() => setSelectedSentiment('bearish')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    selectedSentiment === 'bearish'
                      ? isLight ? 'bg-slate-700 text-white shadow-sm font-black' : 'bg-white text-slate-950 shadow-sm font-black'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-600' : 'bg-white'}`}></span>
                  بيع
                </button>
                <button
                  onClick={() => setSelectedSentiment('extreme')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    selectedSentiment === 'extreme'
                      ? isLight ? 'bg-blue-900 text-white shadow-sm font-black' : 'bg-cyan-400 text-slate-950 shadow-sm font-black'
                      : isLight ? 'text-blue-700 hover:text-blue-900' : 'text-cyan-300 hover:text-cyan-200'
                  }`}
                  title="تمركزات تفوق 75%"
                >
                  <Zap className="w-3 h-3" />
                  تشبع حاد
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`text-xs py-1.5 px-3 rounded-xl border appearance-none pr-7 pl-3 cursor-pointer font-bold focus:outline-none ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-700' 
                      : 'bg-slate-800/90 border-blue-900/40 text-blue-100'
                  }`}
                  dir="rtl"
                >
                  <option value="highest_long">الأعلى شراءً %</option>
                  <option value="highest_short">الأعلى بيعاً %</option>
                  <option value="net_position">صافي العقود الأكبر</option>
                  <option value="weekly_change">أكبر تغير أسبوعي</option>
                  <option value="volume">حجم السيولة الإجمالي</option>
                  <option value="alphabetical">الترتيب الأبجدي</option>
                </select>
                <ArrowUpDown className={`w-3 h-3 absolute right-2 top-2.5 pointer-events-none ${isLight ? 'text-slate-400' : 'text-blue-400'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* 3. HEATMAP CONTENT VIEW */}
        <div className={`flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar ${
          isLight ? 'bg-slate-50/70' : 'bg-slate-950/60'
        }`}>
          {filteredAndSortedData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8">
              <AlertTriangle className="w-10 h-10 text-cyan-500 mb-3" />
              <h3 className="text-lg font-bold">لا توجد أصول مطابقة للبحث أو الفلتر</h3>
              <p className={`text-xs mt-1 max-w-sm ${isLight ? 'text-slate-500' : 'text-blue-200/60'}`}>
                جرب تغيير خيارات التصفية أو مسح عبارة البحث لإظهار جميع الأصول المؤسسية.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedSentiment('all'); }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* CARDS GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedData.map((asset) => {
                const isBullish = asset.longRatio >= 0.55;
                const isBearish = asset.shortRatio >= 0.55;
                const longPct = Math.round(asset.longRatio * 100);
                const shortPct = Math.round(asset.shortRatio * 100);
                const netContracts = asset["Net Positions"];
                const weeklyDelta = asset["Net Change"];
                const isExtreme = asset.isExtreme;

                // Card Theme & Glowing Borders:
                // Dark Mode: Blue & White | Light Mode: Blue & Slate/Gray
                let cardThemeClass = '';
                let borderGlow = '';

                if (isBullish) {
                  cardThemeClass = isLight 
                    ? 'bg-white border-blue-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 text-slate-900' 
                    : 'bg-[#0b1b36]/90 border-blue-500/35 hover:border-cyan-400 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.35)] text-blue-50';
                  borderGlow = 'from-blue-600 to-cyan-400';
                } else if (isBearish) {
                  cardThemeClass = isLight 
                    ? 'bg-white border-slate-300 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-500/10 text-slate-900' 
                    : 'bg-[#151c2a]/90 border-slate-400/35 hover:border-white hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.2)] text-white';
                  borderGlow = isLight ? 'from-slate-700 to-slate-400' : 'from-slate-300 to-white';
                } else {
                  cardThemeClass = isLight 
                    ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 text-slate-900' 
                    : 'bg-slate-900/90 border-blue-900/40 hover:border-cyan-500/50 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.2)] text-blue-50';
                  borderGlow = 'from-blue-600 to-cyan-400';
                }

                return (
                  <div
                    key={asset.Commodity}
                    onMouseEnter={() => setHoveredAsset(asset.Commodity)}
                    onMouseLeave={() => setHoveredAsset(null)}
                    onClick={() => {
                      if (onSelectAsset) {
                        onSelectAsset(asset.Commodity);
                        onClose();
                      }
                    }}
                    className={`group relative rounded-2xl p-4.5 flex flex-col justify-between border backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 cursor-pointer overflow-hidden ${cardThemeClass}`}
                  >
                    {/* Top Accent Gradient Line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${borderGlow}`}></div>

                    {/* Ambient Glow spot on hover */}
                    <div className={`absolute -top-12 -left-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ${
                      isBullish ? 'bg-cyan-500' : isBearish ? (isLight ? 'bg-slate-400' : 'bg-white') : 'bg-blue-500'
                    }`}></div>

                    {/* 1. Card Header */}
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded-md border uppercase ${
                            isLight 
                              ? 'bg-slate-100 border-slate-200 text-slate-800' 
                              : 'bg-blue-950/80 border-blue-800/50 text-cyan-300'
                          }`}>
                            {asset.symbol}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-500' 
                              : 'bg-slate-800/80 border-blue-900/30 text-blue-200/70'
                          }`}>
                            {asset.category}
                          </span>
                        </div>
                        <h3 className={`font-bold text-base sm:text-lg tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`} title={asset.Commodity}>
                          {asset.Commodity}
                        </h3>
                      </div>

                      {/* Overcrowded Indicator */}
                      {isExtreme && (
                        <div 
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border animate-pulse shadow-sm ${
                            isLight
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                          }`}
                          title="تمركز تاريخي حاد قد ينذر بانعكاس أو انفجار سعري"
                        >
                          <Zap className="w-3 h-3" />
                          <span>تشبع حاد</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Sentiment Status Pill */}
                    <div className="relative z-10 my-3 flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        isBullish 
                          ? isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/20 text-cyan-300 border-blue-500/40' 
                          : isBearish 
                            ? isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-white border-white/30' 
                            : isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-900/25 text-blue-300 border-blue-800/30'
                      }`}>
                        {isBullish ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : isBearish ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Activity className="w-3.5 h-3.5" />
                        )}
                        <span>{asset.statusLabelAr}</span>
                      </div>

                      <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-blue-200/60'}`}>
                        {asset.statusLabelEn}
                      </span>
                    </div>

                    {/* 3. Sentiment Power Meter (Dual Bar) */}
                    <div className="relative z-10 space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span className={`flex items-center gap-1 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>
                          <span>{longPct}%</span>
                          <span className="text-[10px] opacity-75">شراء</span>
                        </span>
                        <span className={`flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-white'}`}>
                          <span className="text-[10px] opacity-75">بيع</span>
                          <span>{shortPct}%</span>
                        </span>
                      </div>

                      {/* Ratio Bar */}
                      <div className={`h-2.5 w-full rounded-full overflow-hidden flex p-0.5 border ${
                        isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-950/70 border-blue-900/40'
                      }`}>
                        <div 
                          className="h-full rounded-r-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-sm transition-all duration-500"
                          style={{ width: `${longPct}%` }}
                        ></div>
                        <div 
                          className={`h-full rounded-l-full shadow-sm transition-all duration-500 ${
                            isLight 
                              ? 'bg-gradient-to-r from-slate-400 to-slate-600' 
                              : 'bg-gradient-to-r from-slate-300 to-white'
                          }`}
                          style={{ width: `${shortPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 4. Detailed Institutional Metrics */}
                    <div className={`relative z-10 mt-3.5 pt-3 border-t grid grid-cols-2 gap-2 text-right ${
                      isLight ? 'border-slate-200' : 'border-blue-900/30'
                    }`}>
                      <div>
                        <div className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-blue-200/60'}`}>
                          صافي التمركز
                        </div>
                        <div className={`font-mono text-xs font-black tracking-tight ${
                          netContracts > 0 
                            ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                            : netContracts < 0 
                              ? isLight ? 'text-slate-700' : 'text-white' 
                              : isLight ? 'text-slate-700' : 'text-blue-200'
                        }`}>
                          {netContracts > 0 ? `+${formatCurrency(netContracts)}` : formatCurrency(netContracts)}
                        </div>
                      </div>

                      <div>
                        <div className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-blue-200/60'}`}>
                          التغير الأسبوعي
                        </div>
                        <div className={`font-mono text-xs font-black tracking-tight flex items-center justify-end gap-1 ${
                          weeklyDelta > 0 
                            ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                            : weeklyDelta < 0 
                              ? isLight ? 'text-slate-700' : 'text-white' 
                              : isLight ? 'text-slate-500' : 'text-blue-300'
                        }`}>
                          <span>{weeklyDelta > 0 ? `+${formatCurrency(weeklyDelta)}` : formatCurrency(weeklyDelta)}</span>
                          {weeklyDelta > 0 ? '▲' : weeklyDelta < 0 ? '▼' : '—'}
                        </div>
                      </div>
                    </div>

                    {/* 5. Hover Action Trigger */}
                    <div className={`relative z-10 mt-3 pt-2 flex items-center justify-between text-xs font-bold transition-colors ${
                      isLight ? 'text-slate-500 group-hover:text-slate-900' : 'text-blue-200/60 group-hover:text-white'
                    }`}>
                      <span className="text-[11px] group-hover:text-blue-500 flex items-center gap-1 transition-colors">
                        <span>عرض الشارت والتحليل</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-[-2px] transition-transform" />
                      </span>
                      <span className="text-[10px] font-mono opacity-70">
                        {formatCurrency(asset.totalPositions)} عقد
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TREEMAP VIEW (Finviz Style matching site theme) */
            <div className="w-full flex flex-wrap gap-2.5">
              {filteredAndSortedData.map((asset) => {
                const isBullish = asset.longRatio >= 0.55;
                const isBearish = asset.shortRatio >= 0.55;
                const longPct = Math.round(asset.longRatio * 100);
                const shortPct = Math.round(asset.shortRatio * 100);
                
                // Sizing factor based on total positions
                const totalVol = asset.totalPositions;
                const minWidth = Math.max(160, Math.min(320, 150 + (totalVol / 10000)));

                let bgTreemap = '';
                if (isBullish) {
                  bgTreemap = isLight
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950 hover:border-blue-500 hover:shadow-md'
                    : 'bg-[#0b1b36] border-blue-500/40 text-blue-100 hover:border-cyan-400 hover:bg-[#0f244a]';
                } else if (isBearish) {
                  bgTreemap = isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-900 hover:border-slate-500 hover:shadow-md'
                    : 'bg-[#182030] border-slate-400/40 text-white hover:border-white hover:bg-[#212c42]';
                } else {
                  bgTreemap = isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-900 hover:border-blue-400 hover:shadow-md'
                    : 'bg-slate-900/90 border-blue-900/40 text-blue-100 hover:border-blue-600 hover:bg-slate-800/90';
                }

                return (
                  <div
                    key={asset.Commodity}
                    onClick={() => {
                      if (onSelectAsset) {
                        onSelectAsset(asset.Commodity);
                        onClose();
                      }
                    }}
                    style={{ flexGrow: 1, minWidth: `${minWidth}px`, height: '140px' }}
                    className={`rounded-2xl p-3.5 flex flex-col justify-between border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:z-10 hover:shadow-xl ${bgTreemap}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-mono text-xs font-black uppercase opacity-80">{asset.symbol}</div>
                        <div className="font-bold text-sm truncate max-w-[180px]">{asset.Commodity}</div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        isBullish 
                          ? isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/30 text-cyan-300' 
                          : isBearish 
                            ? isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/20 text-white' 
                            : isLight ? 'bg-slate-200 text-slate-700' : 'bg-blue-900/40 text-blue-200'
                      }`}>
                        {isBullish ? `${longPct}% L` : isBearish ? `${shortPct}% S` : '50/50'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className={`h-1.5 w-full rounded-full overflow-hidden flex ${isLight ? 'bg-slate-200' : 'bg-black/40'}`}>
                        <div className={`h-full ${isLight ? 'bg-blue-600' : 'bg-cyan-400'}`} style={{ width: `${longPct}%` }}></div>
                        <div className={`h-full ${isLight ? 'bg-slate-500' : 'bg-white'}`} style={{ width: `${shortPct}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="opacity-75">الصافي:</span>
                        <span className={`font-bold ${
                          asset["Net Positions"] > 0 
                            ? isLight ? 'text-blue-600' : 'text-cyan-400' 
                            : asset["Net Positions"] < 0 
                              ? isLight ? 'text-slate-700' : 'text-white' 
                              : ''
                        }`}>
                          {asset["Net Positions"] > 0 ? `+${formatCurrency(asset["Net Positions"])}` : formatCurrency(asset["Net Positions"])}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. FOOTER BAR (Legend & Quick Guide) */}
        <div className={`px-6 py-3.5 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/95 border-blue-900/40 text-blue-200/70'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`font-bold text-[11px] ${isLight ? 'text-slate-500' : 'text-blue-300/60'}`}>
              دليل درجات الألوان:
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-blue-600' : 'bg-cyan-400 shadow-sm shadow-cyan-400/50'}`}></span>
              <span className={`font-bold text-[11px] ${isLight ? 'text-blue-600' : 'text-cyan-300'}`}>
                شراء مؤسسي مهيمن ({isLight ? 'أزرق' : 'أزرق سماوي'})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-slate-600' : 'bg-white shadow-sm shadow-white/50'}`}></span>
              <span className={`font-bold text-[11px] ${isLight ? 'text-slate-700' : 'text-white'}`}>
                بيع مؤسسي مهيمن ({isLight ? 'رصاصي' : 'أبيض'})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-blue-900' : 'bg-blue-400 animate-pulse'}`}></span>
              <span className={`font-bold text-[11px] ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
                تمركز تاريخي متطرف (≥ 75%)
              </span>
            </div>
          </div>

          <div className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-blue-200/70'}`}>
            💡 اضغط على أي بطاقة لعرض تفاصيل وشارت الأصل فوراً في لوحة التحكم الرئيسية
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HeatmapModal;
