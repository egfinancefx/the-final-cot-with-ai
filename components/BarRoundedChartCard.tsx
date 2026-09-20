import React, { useMemo, useState } from 'react';
import { curveCatmullRom } from "@visx/curve";
import { ComposedChart } from "./charts/composed-chart";
import { Grid } from "./charts/grid";
import { Area } from "./charts/area";
import { SeriesBar } from "./charts/series-bar";
import { Line } from "./charts/line";
import { ChartTooltip } from "./charts/tooltip/chart-tooltip";
import { XAxis } from "./charts/x-axis";
import { SummaryRow, HistoryRow, ThemeMode } from '../types';
import { formatCurrency } from '../utils';
import { BarChart3, TrendingUp, Layers, Activity } from 'lucide-react';

interface BarRoundedChartCardProps {
  summaryData: SummaryRow[];
  historyData?: HistoryRow[];
  historyDates?: string[];
  themeMode: ThemeMode;
  onSelectAsset?: (asset: string) => void;
}

export const BarRoundedChartCard: React.FC<BarRoundedChartCardProps> = ({
  summaryData,
  historyData = [],
  historyDates = [],
  themeMode,
  onSelectAsset
}) => {
  // Top assets list to switch between
  const availableAssets = useMemo(() => {
    if (!summaryData || summaryData.length === 0) return ['Gold', 'Dow Futures Mini', 'Euro FX'];
    return summaryData.slice(0, 5).map(s => s.Commodity);
  }, [summaryData]);

  const [selectedAsset, setSelectedAsset] = useState<string>(() => availableAssets[0] || 'Gold');
  const [barHeadStyle, setBarHeadStyle] = useState<'dome' | 'capsule'>('dome');

  // Construct chart data for ComposedChart with date, runRate, units, revenue
  const data = useMemo(() => {
    if (historyDates && historyDates.length >= 2 && historyData && historyData.length > 0) {
      const historyRow = historyData.find(h => h.Commodity === selectedAsset) || historyData[0];
      const summaryRow = summaryData.find(s => s.Commodity === selectedAsset);

      const baseLong = summaryRow ? Math.abs(summaryRow["Long Positions"] || 240000) : 240000;
      const baseShort = summaryRow ? Math.abs(summaryRow["Short Positions"] || 110000) : 110000;

      // Chronological order from oldest to latest
      const sortedDates = [...historyDates].reverse();

      return sortedDates.map((dateStr, idx) => {
        const parsedDate = new Date(dateStr);
        const validDate = isNaN(parsedDate.getTime())
          ? new Date(2026, 6, 1 + idx * 7)
          : parsedDate;

        const histVal = historyRow ? Number(historyRow[dateStr]) || 0 : 0;
        
        // Scale values to positive contracts representing volume, open interest velocity, and positions
        const units = Math.max(10000, Math.round(baseShort * 0.65 + (idx * 4800) + Math.abs(histVal * 0.15)));
        const runRate = Math.max(15000, Math.round((baseLong + baseShort) * 0.42 + (idx * 6100) + (histVal * 0.25)));
        const revenue = Math.max(25000, Math.round(baseLong * 0.88 + (idx * 7200) + Math.abs(histVal * 0.35)));

        return {
          date: validDate,
          runRate,
          units,
          revenue,
        };
      });
    }

    // Default 8-point realistic dataset
    const baseDate = new Date("2026-06-16");
    return Array.from({ length: 8 }).map((_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i * 7);
      return {
        date: d,
        runRate: Math.round(210000 + i * 18000 + Math.sin(i) * 12000),
        units: Math.round(140000 + i * 14000 + Math.cos(i) * 9000),
        revenue: Math.round(310000 + i * 22000 + Math.sin(i * 1.5) * 15000),
      };
    });
  }, [historyDates, historyData, summaryData, selectedAsset]);

  const cardBg = themeMode === 'light' 
    ? 'bg-white border-slate-200 shadow-xl' 
    : 'bg-slate-900/80 border-blue-500/10 shadow-2xl backdrop-blur-md';

  const textMain = themeMode === 'light' ? 'text-slate-900' : 'text-white';
  const textSub = themeMode === 'light' ? 'text-slate-500' : 'text-slate-400';

  // CSS variables for harmonious chart theme
  const chartVariables = useMemo(() => {
    return themeMode === 'light'
      ? {
          '--chart-1': '#2563eb', // Line: crisp primary blue
          '--chart-3': '#60a5fa', // SeriesBar: balanced sky blue
          '--chart-4': '#93c5fd', // Area: subtle soft blue
          '--chart-grid': '#e2e8f0',
          '--chart-label': '#64748b',
          '--chart-tooltip-background': 'rgba(255, 255, 255, 0.96)',
          '--chart-tooltip-foreground': '#0f172a',
        }
      : {
          '--chart-1': '#38bdf8', // Line: bright cyan-sky
          '--chart-3': '#3b82f6', // SeriesBar: vibrant blue
          '--chart-4': '#1d4ed8', // Area: deep ocean blue
          '--chart-grid': '#1e293b',
          '--chart-label': '#94a3b8',
          '--chart-tooltip-background': 'rgba(15, 23, 42, 0.95)',
          '--chart-tooltip-foreground': '#f8fafc',
        };
  }, [themeMode]);

  const latest = data[data.length - 1];

  return (
    <div 
      className={`rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 flex flex-col h-full transition-all duration-300 ${cardBg}`}
      style={chartVariables as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1 pb-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${themeMode === 'light' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-semibold font-heading tracking-tight leading-tight ${textMain}`}>
              Bar Rounded Chart
            </h3>
            <p className={`text-[10px] ${textSub}`}>Multi-series institutional contracts & run rate</p>
          </div>
        </div>

        {/* Asset Selection Filter & Head Style Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5">
          {/* Head Style Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shrink-0">
            <button
              onClick={() => setBarHeadStyle('dome')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                barHeadStyle === 'dome'
                  ? (themeMode === 'light' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'bg-blue-500/30 text-blue-300 font-semibold border border-blue-500/30')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="رأس مستدير (Rounded Head)"
            >
              Rounded Head
            </button>
            <button
              onClick={() => setBarHeadStyle('capsule')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                barHeadStyle === 'capsule'
                  ? (themeMode === 'light' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'bg-blue-500/30 text-blue-300 font-semibold border border-blue-500/30')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="كبسولة كاملة مستديرة الزوايا (Full Capsule)"
            >
              Capsule
            </button>
          </div>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700/70 shrink-0" />

          {/* Asset Pills */}
          <div className="flex items-center gap-1 shrink-0">
            {availableAssets.slice(0, 4).map((asset) => {
              const shortName = asset.replace('Futures Mini', 'Mini').replace('High Grade ', '').slice(0, 10);
              const isSelected = selectedAsset === asset;
              return (
                <button
                  key={asset}
                  onClick={() => {
                    setSelectedAsset(asset);
                    if (onSelectAsset) onSelectAsset(asset);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all whitespace-nowrap ${
                    isSelected
                      ? (themeMode === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40')
                      : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')
                  }`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ComposedChart centerpiece from biklit library */}
      <div className="flex-1 w-full min-h-[190px] relative flex items-center justify-center my-0.5">
        <ComposedChart 
          margin={{ top: 8, right: 8, bottom: 40, left: 8 }} 
          data={data} 
          xDataKey="date" 
          aspectRatio="2 / 1" 
          barGap={0} 
          maxBarSize={32}
        >
          <Grid horizontal />
          <Area dataKey="runRate" curve={curveCatmullRom.alpha(0.42)} fill="var(--chart-4)" fillOpacity={0.32} />
          <SeriesBar 
            dataKey="units" 
            fill="var(--chart-3)" 
            radius={16} 
            roundedHead={true} 
            roundBottom={barHeadStyle === 'capsule'} 
          />
          <Line dataKey="revenue" curve={curveCatmullRom.alpha(0.42)} stroke="var(--chart-1)" strokeWidth={2.5} />
          <ChartTooltip showCrosshair={false} />
          <XAxis numTicks={8} />
        </ComposedChart>
      </div>

      {/* Interactive Legend & Series Metric Badges */}
      <div className={`mt-1 pt-2 border-t border-inherit flex flex-wrap items-center justify-between gap-2 text-[10px] ${textSub}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 rounded-full bg-[var(--chart-1)] shrink-0" />
            <span className="font-medium text-[var(--chart-1)]">Revenue: {latest ? formatCurrency(latest.revenue) : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-3 bg-[var(--chart-3)] shrink-0 transition-all ${barHeadStyle === 'capsule' ? 'rounded-full' : 'rounded-t-full rounded-b-none'}`} />
            <span className="font-medium text-[var(--chart-3)]">Units: {latest ? formatCurrency(latest.units) : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 rounded-[2px] bg-[var(--chart-4)] opacity-70 shrink-0" />
            <span className="font-medium text-[var(--chart-4)]">Run Rate: {latest ? formatCurrency(latest.runRate) : '—'}</span>
          </div>
        </div>

        <div className="text-[9px] font-mono opacity-80 flex items-center gap-1">
          <Activity className="w-3 h-3 text-blue-400" />
          <span>{selectedAsset}</span>
        </div>
      </div>
    </div>
  );
};

export default BarRoundedChartCard;
