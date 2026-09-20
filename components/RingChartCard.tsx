import React, { useMemo, useState } from 'react';
import { SummaryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { ASSET_GROUPS } from '../constants';
import { CircleDot } from 'lucide-react';
import {
  RingChart,
  Ring,
  RingCenter,
  Legend,
  LegendItemComponent,
  LegendMarker,
  LegendLabel,
  LegendValue,
  LegendProgress,
  RingDatum
} from './charts/ring-chart';

interface RingChartCardProps {
  summaryData: SummaryRow[];
  themeMode: ThemeMode;
}

export const RingChartCard: React.FC<RingChartCardProps> = ({
  summaryData,
  themeMode
}) => {
  const [viewMode, setViewMode] = useState<'sentiment' | 'sectors'>('sentiment');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Overall Market Sentiment Data
  const sentimentData = useMemo(() => {
    if (!summaryData || summaryData.length === 0) {
      return {
        chart: [
          { label: 'Long Contracts', value: 65000, formattedValue: '65.0K', color: '#3b82f6' },
          { label: 'Short Contracts', value: 35000, formattedValue: '35.0K', color: '#94a3b8' }
        ] as RingDatum[],
        totalLong: 65000,
        totalShort: 35000,
        total: 100000,
        longPct: 65
      };
    }

    let totalLong = 0;
    let totalShort = 0;

    summaryData.forEach(row => {
      totalLong += row["Long Positions"] || 0;
      totalShort += row["Short Positions"] || 0;
    });

    const total = totalLong + totalShort;
    const longPct = total > 0 ? (totalLong / total) * 100 : 50;

    const longColor = themeMode === 'light' ? '#2563eb' : '#3b82f6';
    const shortColor = themeMode === 'light' ? '#94a3b8' : '#64748b';

    return {
      chart: [
        { 
          label: 'Long Contracts', 
          value: totalLong, 
          formattedValue: formatCurrency(totalLong),
          color: longColor 
        },
        { 
          label: 'Short Contracts', 
          value: totalShort, 
          formattedValue: formatCurrency(totalShort),
          color: shortColor 
        }
      ] as RingDatum[],
      totalLong,
      totalShort,
      total,
      longPct
    };
  }, [summaryData, themeMode]);

  // 2. Sectors Breakdown Data
  const sectorsData = useMemo<RingDatum[]>(() => {
    if (!summaryData || summaryData.length === 0) return [];

    const sectorColors: Record<string, string> = {
      'Currencies': '#3b82f6', // Blue
      'Metals': '#f59e0b',     // Amber
      'Indices': '#8b5cf6',    // Purple
      'Energy': '#ef4444',     // Red
      'Crypto': '#10b981'      // Emerald
    };

    return ASSET_GROUPS.map(group => {
      let groupVolume = 0;
      group.items.forEach(item => {
        const row = summaryData.find(s => s.Commodity === item);
        if (row) {
          groupVolume += (row["Long Positions"] || 0) + (row["Short Positions"] || 0);
        }
      });

      return {
        label: group.name,
        value: groupVolume,
        formattedValue: formatCurrency(groupVolume),
        color: sectorColors[group.name] || '#64748b'
      };
    }).filter(s => s.value > 0);
  }, [summaryData]);

  const activeRingData = viewMode === 'sentiment' ? sentimentData.chart : sectorsData;

  const cardBg = themeMode === 'light' 
    ? 'bg-white border-slate-200 shadow-xl' 
    : 'bg-slate-900/80 border-blue-500/10 shadow-2xl backdrop-blur-md';

  const textMain = themeMode === 'light' ? 'text-slate-900' : 'text-white';
  const textSub = themeMode === 'light' ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 flex flex-col h-full transition-all duration-300 ${cardBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${themeMode === 'light' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
            <CircleDot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold font-heading tracking-tight leading-tight ${textMain}`}>
              Ring Chart
            </h3>
            <p className={`text-[10px] ${textSub}`}>Market sentiment & sector allocation</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setViewMode('sentiment');
              setHoveredIndex(null);
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
              viewMode === 'sentiment'
                ? (themeMode === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40')
                : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')
            }`}
          >
            Sentiment
          </button>
          <button
            onClick={() => {
              setViewMode('sectors');
              setHoveredIndex(null);
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
              viewMode === 'sectors'
                ? (themeMode === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40')
                : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')
            }`}
          >
            Sectors
          </button>
        </div>
      </div>

      {/* Ring Chart Centerpiece using biklit exact pattern */}
      <div className="flex-1 w-full min-h-[140px] max-h-[165px] relative flex items-center justify-center my-0.5">
        <RingChart
          data={activeRingData}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
          size={150}
          strokeWidth={14}
        >
          {activeRingData.map((_, i) => (
            <Ring index={i} key={i} />
          ))}
          <RingCenter 
            defaultLabel={viewMode === 'sentiment' ? "Bullish Ratio" : "Total Contracts"} 
            defaultValue={viewMode === 'sentiment' ? `${sentimentData.longPct.toFixed(1)}%` : formatCurrency(sentimentData.total)} 
          />
        </RingChart>
      </div>

      {/* Legend using biklit exact composition pattern */}
      <div className="mt-1 pt-1.5 border-t border-inherit">
        <Legend
          hoveredIndex={hoveredIndex}
          items={activeRingData}
          onHoverChange={setHoveredIndex}
        >
          <LegendItemComponent>
            <div className="flex items-center min-w-0 flex-1">
              <LegendMarker />
              <LegendLabel />
            </div>
            <div className="flex items-center shrink-0">
              <LegendValue showPercentage />
              <LegendProgress />
            </div>
          </LegendItemComponent>
        </Legend>
      </div>
    </div>
  );
};

export default RingChartCard;
