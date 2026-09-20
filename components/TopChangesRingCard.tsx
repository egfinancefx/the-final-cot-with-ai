import React, { useMemo, useState } from 'react';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { RingChart } from './charts/bklit-ring-chart';
import { Ring } from './charts/bklit-ring';
import { RingData } from './charts/bklit-ring-context';
import { CircleDot, TrendingUp, TrendingDown } from 'lucide-react';

interface TopChangesRingCardProps {
  summaryData: SummaryRow[];
  themeMode: ThemeMode;
  onSelectAsset?: (asset: string) => void;
  compact?: boolean;
}

// Harmonious deep and medium-dark blue palette with no pale or whitish tones
const BLUE_PALETTE_LIGHT = [
  '#172554', // Deepest Navy Blue (Blue 950)
  '#1e3a8a', // Dark Midnight Blue (Blue 900)
  '#1e40af', // Dark Royal Blue (Blue 800)
  '#1d4ed8', // Dark Cobalt Blue (Blue 700)
  '#2563eb', // Rich Sapphire Blue (Blue 600)
];

const BLUE_PALETTE_DARK = [
  '#1e40af', // Dark Royal Blue (Blue 800)
  '#1d4ed8', // Dark Cobalt Blue (Blue 700)
  '#2563eb', // Rich Sapphire Blue (Blue 600)
  '#3b82f6', // Solid Saturated Blue (Blue 500)
  '#0284c7', // Deep Ocean Blue (Sky 600)
];

// Specific target asset groups requested: Currencies, Metals, and strictly (Nasdaq, S&P 500, Dow Jones)
const TARGET_COMMODITIES = new Set([
  // 1. Currencies
  "Euro FX",
  "British Pound",
  "Japanese Yen",
  "Canadian Dollar",
  "Australian Dollar",
  "Swiss Franc",
  "New Zealand Dollar",
  "Mexican Peso",
  "Brazilian Real",
  "South African Rand",
  "U.S. Dollar Index",
  // 2. Metals
  "Gold",
  "Silver",
  "High Grade Copper",
  "Platinum",
  "Palladium",
  // 3. Core Indices strictly: Nasdaq, S&P 500, Dow Jones
  "Nasdaq 100 E-Mini",
  "S&P 500 E-Mini",
  "Dow Futures Mini",
]);

const isEligibleTargetAsset = (name: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  if (TARGET_COMMODITIES.has(trimmed)) return true;

  const lower = trimmed.toLowerCase();

  // Strictly exclude Russell and VIX
  if (lower.includes('vix') || lower.includes('russell')) return false;

  // Strictly exclude energy, crypto, grains/agriculture, bonds/rates
  if (
    lower.includes('oil') ||
    lower.includes('gas') ||
    lower.includes('ulsd') ||
    lower.includes('gasoline') ||
    lower.includes('bitcoin') ||
    lower.includes('ether') ||
    lower.includes('crypto') ||
    lower.includes('corn') ||
    lower.includes('soybean') ||
    lower.includes('wheat') ||
    lower.includes('cattle') ||
    lower.includes('hogs') ||
    lower.includes('cotton') ||
    lower.includes('coffee') ||
    lower.includes('sugar') ||
    lower.includes('cocoa') ||
    lower.includes('lumber') ||
    lower.includes('bond') ||
    lower.includes('note') ||
    lower.includes('treasury') ||
    lower.includes('sofr') ||
    lower.includes('fed funds') ||
    lower.includes('bills')
  ) {
    return false;
  }

  // Check if it's Nasdaq, S&P 500, or Dow
  if (lower.includes('nasdaq') || lower.includes('s&p 500') || lower.includes('dow')) {
    return true;
  }

  // Check if it's Gold, Silver, Copper, Platinum, Palladium
  if (
    lower.includes('gold') ||
    lower.includes('silver') ||
    lower.includes('copper') ||
    lower.includes('platinum') ||
    lower.includes('palladium')
  ) {
    return true;
  }

  // Check if it's a Currency
  if (
    lower.includes('euro') ||
    lower.includes('pound') ||
    lower.includes('yen') ||
    lower.includes('franc') ||
    lower.includes('peso') ||
    lower.includes('real') ||
    lower.includes('rand') ||
    lower.includes('dollar index') ||
    (lower.includes('dollar') && (lower.includes('canadian') || lower.includes('australian') || lower.includes('zealand')))
  ) {
    return true;
  }

  return false;
};

export const TopChangesRingCard: React.FC<TopChangesRingCardProps> = ({
  summaryData,
  themeMode,
  onSelectAsset
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const palette = themeMode === 'light' ? BLUE_PALETTE_LIGHT : BLUE_PALETTE_DARK;

  // Top 5 assets by absolute Net Change strictly in Currencies, Metals, and (Nasdaq, S&P 500, Dow Jones)
  const { ringData, top5Rows } = useMemo(() => {
    if (!summaryData || summaryData.length === 0) {
      return { ringData: [], top5Rows: [] };
    }

    // Filter strictly for Currencies, Metals, and specified Indices (Nasdaq, S&P 500, Dow Jones)
    const eligibleRows = summaryData.filter(row => {
      const name = row.Commodity || '';
      return isEligibleTargetAsset(name);
    });

    // Sort descending by absolute Net Change magnitude
    const sorted = [...eligibleRows].sort((a, b) => {
      const changeA = Math.abs(a["Net Change"] || 0);
      const changeB = Math.abs(b["Net Change"] || 0);
      return changeB - changeA;
    });

    const top5 = sorted.slice(0, 5);
    if (top5.length === 0) {
      return { ringData: [], top5Rows: [] };
    }

    const maxChange = Math.max(...top5.map(r => Math.abs(r["Net Change"] || 0)), 1);
    const palette = themeMode === 'light' ? BLUE_PALETTE_LIGHT : BLUE_PALETTE_DARK;

    const data: RingData[] = top5.map((row, idx) => {
      const absVal = Math.abs(row["Net Change"] || 0);
      return {
        label: row.Commodity,
        value: absVal,
        maxValue: maxChange * 1.06, // Clean progress ceiling
        color: palette[idx % palette.length],
      };
    });

    return { ringData: data, top5Rows: top5 };
  }, [summaryData, themeMode]);

  const cardBg = themeMode === 'light' 
    ? 'bg-white border-slate-200/80 shadow-sm' 
    : 'bg-slate-900/80 border-slate-800/80 shadow-lg backdrop-blur-sm';

  const textMain = themeMode === 'light' ? 'text-slate-900' : 'text-slate-100';
  const textSub = themeMode === 'light' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 flex flex-col h-full transition-all duration-300 ${cardBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1 pb-2 border-b border-inherit">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg border shrink-0 ${themeMode === 'light' ? 'bg-blue-50 text-blue-600 border-blue-200/60' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            <CircleDot className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-xs sm:text-sm font-semibold tracking-tight leading-tight truncate ${textMain}`}>
              Top 5 Net Position Shifts
            </h3>
            <p className={`text-[10px] truncate ${textSub}`}>Currencies, metals & core indices (Nasdaq, S&P 500, Dow)</p>
          </div>
        </div>

        <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border shrink-0 ${
          themeMode === 'light' 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-blue-950/70 text-blue-300 border-blue-800/60'
        }`}>
          FX, Metals & Indices
        </span>
      </div>

      {/* Ring Chart Centerpiece - 5 animated concentric rings */}
      <div className="flex-1 w-full min-h-[170px] relative flex items-center justify-center my-1">
        {ringData.length > 0 ? (
          <RingChart 
            data={ringData} 
            size={204} 
            strokeWidth={11} 
            ringGap={4.5} 
            baseInnerRadius={26}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          >
            {ringData.map((item, index) => (
              <Ring 
                index={index} 
                key={item.label} 
                showGlow={false} 
                trackColor={themeMode === 'light' ? 'rgba(30, 58, 138, 0.08)' : 'rgba(30, 58, 138, 0.25)'}
              />
            ))}
          </RingChart>
        ) : (
          <div className={`text-xs ${textSub} flex items-center gap-1.5`}>
            No shift data available
          </div>
        )}
      </div>

      {/* Clean, Readable Top 5 Legend */}
      <div className="mt-1 pt-2 border-t border-inherit flex flex-col gap-1">
        {top5Rows.map((row, idx) => {
          const rawChange = row["Net Change"] || 0;
          const isUp = rawChange >= 0;
          const color = palette[idx % palette.length];
          const isSelected = hoveredIndex === idx;

          return (
            <button
              key={row.Commodity}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelectAsset && onSelectAsset(row.Commodity)}
              className={`flex items-center justify-between px-2 py-1 rounded-md text-left transition-all ${
                isSelected
                  ? (themeMode === 'light' ? 'bg-blue-50/80 border border-blue-200' : 'bg-blue-500/15 border border-blue-500/30')
                  : (themeMode === 'light' ? 'hover:bg-slate-50 border border-transparent' : 'hover:bg-slate-800/50 border border-transparent')
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span 
                  className="w-2 h-2 rounded-full shrink-0 transition-transform" 
                  style={{ 
                    backgroundColor: color,
                    transform: isSelected ? 'scale(1.3)' : 'scale(1)'
                  }} 
                />
                <span className={`truncate text-[11px] font-medium ${isSelected ? textMain : textSub}`}>
                  {row.Commodity}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className={`font-mono text-[11px] font-semibold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isUp ? '+' : ''}{formatCurrency(rawChange)}
                </span>
                {isUp ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-500 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TopChangesRingCard;
