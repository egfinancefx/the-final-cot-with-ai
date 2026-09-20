import React, { useMemo, useState } from 'react';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { RingChart } from './charts/bklit-ring-chart';
import { Ring } from './charts/bklit-ring';
import { RingCenter } from './charts/bklit-ring-center';
import { RingData } from './charts/bklit-ring-context';
import { CircleDot, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TopChangesRingCardProps {
  summaryData: SummaryRow[];
  themeMode: ThemeMode;
  onSelectAsset?: (asset: string) => void;
  compact?: boolean;
}

// 5 harmonious, eye-friendly, distinct modern tones (Blue, Emerald, Amber, Violet, Rose)
const TOP5_PALETTE = [
  '#3b82f6', // Currencies (Euro/Pound/etc)
  '#10b981', // Emerald / Agriculture / Copper
  '#f59e0b', // Gold / Precious Metals
  '#8b5cf6', // Indices / Modern asset
  '#f43f5e', // Energy / Crude Oil
];

// Helper to filter out sovereign debt, interest rate derivatives, and treasury notes
const isDebtOrNote = (name: string): boolean => {
  const lower = name.toLowerCase();
  return (
    lower.includes('note') ||
    lower.includes('bond') ||
    lower.includes('year') ||
    lower.includes('yr ') ||
    lower.includes('fed funds') ||
    lower.includes('sofr') ||
    lower.includes('t-note') ||
    lower.includes('t-bond') ||
    lower.includes('bills') ||
    lower.includes('treasury')
  );
};

export const TopChangesRingCard: React.FC<TopChangesRingCardProps> = ({
  summaryData,
  themeMode,
  onSelectAsset
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Top 5 assets by absolute Net Change (|Net Change|) in Currencies, Metals, Energy, Crypto
  const { ringData, top5Rows, totalAbsoluteShift } = useMemo(() => {
    if (!summaryData || summaryData.length === 0) {
      return { ringData: [], top5Rows: [], totalAbsoluteShift: 0 };
    }

    // Filter out bonds/notes
    const eligibleRows = summaryData.filter(row => {
      const name = row.Commodity || '';
      return !isDebtOrNote(name);
    });

    // Sort descending by absolute Net Change magnitude
    const sorted = [...eligibleRows].sort((a, b) => {
      const changeA = Math.abs(a["Net Change"] || 0);
      const changeB = Math.abs(b["Net Change"] || 0);
      return changeB - changeA;
    });

    const top5 = sorted.slice(0, 5);
    if (top5.length === 0) {
      return { ringData: [], top5Rows: [], totalAbsoluteShift: 0 };
    }

    const maxChange = Math.max(...top5.map(r => Math.abs(r["Net Change"] || 0)), 1);
    const totalShift = top5.reduce((acc, curr) => acc + Math.abs(curr["Net Change"] || 0), 0);

    const data: RingData[] = top5.map((row, idx) => {
      const absVal = Math.abs(row["Net Change"] || 0);
      return {
        label: row.Commodity,
        value: absVal,
        maxValue: maxChange * 1.06, // Clean progress ceiling
        color: TOP5_PALETTE[idx % TOP5_PALETTE.length],
      };
    });

    return { ringData: data, top5Rows: top5, totalAbsoluteShift: totalShift };
  }, [summaryData]);

  const cardBg = themeMode === 'light' 
    ? 'bg-white border-slate-200/80 shadow-sm' 
    : 'bg-slate-900/80 border-slate-800/80 shadow-lg backdrop-blur-sm';

  const textMain = themeMode === 'light' ? 'text-slate-900' : 'text-slate-100';
  const textSub = themeMode === 'light' ? 'text-slate-500' : 'text-slate-400';

  const activeHoveredRow = hoveredIndex !== null && top5Rows[hoveredIndex] ? top5Rows[hoveredIndex] : null;

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
            <p className={`text-[10px] truncate ${textSub}`}>Currencies, metals & energy weekly rebalancing</p>
          </div>
        </div>

        <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border shrink-0 ${
          themeMode === 'light' 
            ? 'bg-slate-100/80 text-slate-600 border-slate-200' 
            : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
        }`}>
          Top 5 Movers
        </span>
      </div>

      {/* Ring Chart Centerpiece - 5 rings with spacious stroke and clear spacing */}
      <div className="flex-1 w-full min-h-[160px] max-h-[195px] relative flex items-center justify-center my-0.5">
        {ringData.length > 0 ? (
          <RingChart 
            data={ringData} 
            size={180} 
            strokeWidth={10} 
            ringGap={5} 
            baseInnerRadius={32}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          >
            {ringData.map((item, index) => (
              <Ring index={index} key={item.label} showGlow={false} />
            ))}
            <RingCenter 
              defaultLabel="Top 5 Shifts"
              children={({ isHovered, label }) => {
                if (isHovered && activeHoveredRow) {
                  const netVal = activeHoveredRow["Net Change"] || 0;
                  const isUp = netVal >= 0;
                  return (
                    <div className="flex flex-col items-center justify-center text-center px-1 max-w-[95px]">
                      <span className={`text-[11px] font-semibold truncate w-full ${textMain}`} title={label}>
                        {label}
                      </span>
                      <div className={`flex items-center justify-center gap-0.5 my-0.5 font-mono text-xs font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? <ArrowUpRight className="w-3 h-3 shrink-0 stroke-[2.5]" /> : <ArrowDownRight className="w-3 h-3 shrink-0 stroke-[2.5]" />}
                        <span>{formatCurrency(netVal)}</span>
                      </div>
                      <span className={`text-[8px] uppercase tracking-wider font-medium ${textSub}`}>
                        Net Shift
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col items-center justify-center text-center px-1 max-w-[95px]">
                    <span className={`text-xs sm:text-sm font-mono font-bold tracking-tight ${themeMode === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                      {formatCurrency(totalAbsoluteShift)}
                    </span>
                    <span className={`text-[8px] font-medium uppercase tracking-wider mt-0.5 ${textSub}`}>
                      Top 5 Volume
                    </span>
                  </div>
                );
              }}
            />
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
          const color = TOP5_PALETTE[idx % TOP5_PALETTE.length];
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
